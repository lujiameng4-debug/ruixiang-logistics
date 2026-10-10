import http from 'node:http';

const CARGO_NAMES = {
  cement: '水泥', flyash: '粉煤灰', clinker: '熟料', coal: '煤炭',
  container: '集装箱', bulk: '其他散货', other: '其他货物'
};
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(value => value.trim()).filter(Boolean);
const port = Number(process.env.PORT || 8787);
const clean = (value, max) => typeof value === 'string'
  ? value.trim().replace(/[\r\n\t]+/g, ' ').slice(0, max)
  : '';

function reply(response, status, data, origin) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    ...(origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    } : {})
  });
  response.end(JSON.stringify(data));
}

const server = http.createServer(async (request, response) => {
  const requestOrigin = request.headers.origin || '';
  const allowedOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : '';
  if (!allowedOrigin) return reply(response, 403, { message: '此来源无法提交运输需求。' });
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    });
    return response.end();
  }
  if (request.url !== '/submit' || request.method !== 'POST') {
    return reply(response, 405, { message: '请通过运输需求表单提交。' }, allowedOrigin);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096) return reply(response, 413, { message: '提交内容过长。' }, allowedOrigin);
    chunks.push(chunk);
  }
  let input;
  try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return reply(response, 400, { message: '提交内容格式有误。' }, allowedOrigin); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return reply(response, 400, { message: '提交内容格式有误。' }, allowedOrigin);
  }
  if (input.website) return reply(response, 200, { ok: true }, allowedOrigin);

  const origin = clean(input.origin, 100);
  const destination = clean(input.destination, 100);
  const contact = clean(input.contact, 50);
  const phone = clean(input.phone, 30);
  const notes = clean(input.notes, 200);
  const tonnes = Number(input.tonnes);
  const cargo = Object.hasOwn(CARGO_NAMES, input.cargo) ? CARGO_NAMES[input.cargo] : '';
  if (!origin || !destination || !contact || !/^[+\d\s()-]{6,30}$/.test(phone) ||
      !Number.isFinite(tonnes) || tonnes < 0.1 || tonnes > 5000 || !cargo ||
      String(input.origin).length > 100 || String(input.destination).length > 100 ||
      String(input.contact).length > 50 || String(input.notes ?? '').length > 200) {
    return reply(response, 400, { message: '请检查装卸地点、重量和联系方式。' }, allowedOrigin);
  }

  let webhook;
  try { webhook = new URL(process.env.WECOM_WEBHOOK_URL); }
  catch { return reply(response, 503, { message: '在线提交正在配置中，请先通过电话或邮件联系我们。' }, allowedOrigin); }
  if (webhook.protocol !== 'https:' || webhook.hostname !== 'qyapi.weixin.qq.com' ||
      webhook.pathname !== '/cgi-bin/webhook/send' || !webhook.searchParams.get('key')) {
    return reply(response, 503, { message: '在线提交正在配置中，请先通过电话或邮件联系我们。' }, allowedOrigin);
  }

  const content = [
    '【网站运输需求】',
    `提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}`,
    `联系人：${contact}`,
    `联系电话：${phone}`,
    `装车点：${origin}`,
    `卸车点：${destination}`,
    `货物重量：${tonnes} 吨`,
    `货物类型：${cargo}`,
    `补充要求：${notes || '无'}`
  ].join('\n');
  try {
    const sent = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ msgtype: 'text', text: { content } }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await sent.json();
    if (!sent.ok || data.errcode !== 0) throw new Error('WECOM_SEND_FAILED');
    return reply(response, 200, { ok: true }, allowedOrigin);
  } catch {
    return reply(response, 502, { message: '提交暂时失败，请稍后重试，或直接电话、邮件联系。' }, allowedOrigin);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Inquiry server listening on http://127.0.0.1:${port}`);
});
