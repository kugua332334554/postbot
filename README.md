# postbot
一个依靠CloudFlareWorker实现的PostBot

# 效果展示
<img width="2030" height="632" alt="image" src="https://github.com/user-attachments/assets/5e70d87f-8291-4568-82e4-02ac404295bb" />
<img width="2030" height="1236" alt="image" src="https://github.com/user-attachments/assets/c0f6ba49-d02f-4683-9038-75c23fbc2d01" />
<img width="2002" height="1080" alt="image" src="https://github.com/user-attachments/assets/e0d1ff53-3e6a-4d70-8e2c-611a10822149" />

# 部署方式
1.创建Worker和TG Bot

2.粘贴代码

3.添加变量 BOT_TOKEN

4.注册WebHook 访问网站 https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WEBHOOK_URL> 分别替换为你的TOKEN和Worker网址 访问后看到 Webhook was set... 即成功

5.添加KV名称随意

6.绑定KV 命名 POST_DATA

7.到botfather 输入 /mybots 选择你的bot 选择Bot Settings 选择 Inline Mode 选择Turn on

8.开始使用
