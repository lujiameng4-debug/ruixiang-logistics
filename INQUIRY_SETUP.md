# GitHub Pages + 本地询价服务

网站页面由 GitHub Pages 发布；询价接口运行在本地 PC 上，将客户填写的装车点、卸车点、吨数、货物类型和联系方式转发到企业微信群机器人。当前不计算价格或距离，也不保存数据库记录。

## 1. 配置本地服务

将 `.env.example` 复制为 `.env`，把 `WECOM_WEBHOOK_URL` 改为真实的企业微信群机器人 Webhook 地址。`.env` 已被 Git 忽略，绝不能提交到公开仓库。

```sh
cp .env.example .env
node --env-file=.env server/inquiry-server.mjs
```

服务默认只监听 `127.0.0.1:8787`。只允许 `ALLOWED_ORIGINS` 中的网站页面跨域提交。以后使用自有域名时，在 `.env` 中用逗号追加新网站来源，例如 `https://www.example.cn`，然后重启服务。

## 2. 给本地接口一个公网 HTTPS 地址

GitHub Pages 的 HTTPS 页面不能直接访问客户电脑上的 `localhost`，也不能调用未加密的 `http://` 接口。需给本地服务配置公网 HTTPS 入口。临时展示可用 Cloudflare Quick Tunnel（只是通道，不是 Worker）：

```sh
cloudflared tunnel --url http://127.0.0.1:8787
```

终端会显示一个随机的 `https://…trycloudflare.com` 地址。把它加上 `/submit` 后填入 `inquiry-config.js`，提交并推送到 GitHub。每次重启 Quick Tunnel，随机地址可能变化，需再次更新该文件并推送。正式使用建议用自有域名配置固定隧道地址，或改为长期运行的云服务器。

## 3. 发布网站

公开仓库的 `main` 分支每次推送时，`.github/workflows/pages.yml` 会把静态网页和素材发布到 GitHub Pages。到仓库 **Settings → Pages**，将发布来源设为 **GitHub Actions**。

GitHub Pages 只发布页面素材，不会运行 `server/inquiry-server.mjs`。本地 PC、服务进程和公网隧道必须保持运行，询价提交才可用。休眠、关机或网络中断时，网页仍能打开，但询价提交会失败。企业微信群机器人只能向所在群发送消息；当前无数据库备份。
