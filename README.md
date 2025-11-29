# postbot
一个依靠CloudFlareWorker实现的PostBot

# 部署方式
1.创建Worker
2.粘贴代码
3.添加变量 BOT_TOKEN
4.注册WebHook 访问网站 https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WEBHOOK_URL> 分别替换为你的TOKEN和Worker网址 访问后看到 Webhook was set... 即成功
5.添加KV名称随意
6.绑定KV 命名 POST_DATA
7.开始使用
