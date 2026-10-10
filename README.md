# 瑞祥物流网站

静态网站发布到 [GitHub Pages](https://lujiameng4-debug.github.io/ruixiang-logistics/)。询价表单由本地 Node 服务接收，再转发到企业微信群机器人；网站页面和服务端代码分开运行。

本地服务的启动、HTTPS 通道和环境变量配置见 [INQUIRY_SETUP.md](INQUIRY_SETUP.md)。企业微信 Webhook 存放在未提交的 `.env` 文件中。
