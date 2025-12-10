# postbot
一个依靠CloudFlareWorker实现的PostBot

# 效果展示
<img width="2012" height="1048" alt="image" src="https://github.com/user-attachments/assets/7e91377a-6d2a-4a68-9d9d-1504226168d2" />
<img width="2030" height="1070" alt="image" src="https://github.com/user-attachments/assets/5f7a4cc6-1497-452b-b595-1b9e65548f98" />
<img width="2028" height="1044" alt="image" src="https://github.com/user-attachments/assets/d0fd31c8-6da6-4142-92f2-1a0b41ebb92c" />
<img width="1996" height="1200" alt="image" src="https://github.com/user-attachments/assets/c42b5b18-5596-4cf0-878d-feba8e57a857" />
<img width="2024" height="146" alt="image" src="https://github.com/user-attachments/assets/91d7ebc3-c915-47b0-9f9e-0cf70929ca01" />


# 部署方式
1.创建Worker和TG Bot

2.粘贴代码

3.添加变量 BOT_TOKEN

4.注册WebHook 访问网站 https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WEBHOOK_URL> 分别替换为你的TOKEN和Worker网址 访问后看到 Webhook was set... 即成功

5.添加KV名称随意

6.绑定KV 命名 POST_DATA

7.到botfather 输入 /mybots 选择你的bot 选择Bot Settings 选择 Inline Mode 选择Turn on

8.开始使用
