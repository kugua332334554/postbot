let botUsername = null; // 用于缓存机器人用户名

function generateRandomId() {
    const firstPart = Math.random().toString(36).substring(2, 10);
    const secondPart = Math.random().toString(36).substring(2, 10);
    return (firstPart + secondPart).toUpperCase();
}

function parseLinks(text) {
    return text.split('\n').map(row => 
        [...row.matchAll(/\[([^\]]+)\s*\+\s*([^\]]+)\]/g)].map(m => ({
            text: m[1].trim(),
            url: m[2].trim()
        }))
    ).filter(r => r.length);
}
//tgapi
async function callTelegramApi(method, body, token) {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.ok ? res.json() : (console.error(await res.text()), res.json());
}
//username
async function getBotUsername(token) {
    if (botUsername) return botUsername;
    try {
        const { ok, result } = await callTelegramApi('getMe', {}, token);
        return ok ? (botUsername = result.username) : 'your_bot_username_placeholder';
    } catch (e) {
        return 'your_bot_username_placeholder';
    }
}
//启动
async function sendMainMenu(chat_id, text, token) {
    await callTelegramApi('sendMessage', {
        chat_id, text, parse_mode: 'HTML',
        reply_markup: {
            resize_keyboard: true,
            keyboard: [[
                { text: '创建帖子', icon_custom_emoji_id: '5883973610606956186' },
                { text: '关于我们', icon_custom_emoji_id: '5944940516754853337' }
            ]]
        }
    }, token);
}
//step2
async function sendWaitingPostKeyboard(chat_id, token) {
    await callTelegramApi('sendMessage', {
        chat_id,
        parse_mode: 'HTML',
        text: '请发送您的帖子内容（<tg-emoji emoji-id="5899806560867062244">🔠</tg-emoji>文本、<tg-emoji emoji-id="5775949822993371030">🖼</tg-emoji>图片、<tg-emoji emoji-id="5945068566909815651">🎞</tg-emoji>GIF、<tg-emoji emoji-id="6005986106703613755">📷</tg-emoji>视频、<tg-emoji emoji-id="5891249688933305846">🎵</tg-emoji>音频、<tg-emoji emoji-id="5875206779196935950">📁</tg-emoji>文件和<tg-emoji emoji-id="5884343982816759327">↗️</tg-emoji>按钮）。',
        reply_markup: {
            resize_keyboard: true,
            keyboard: [[{ text: '取消', icon_custom_emoji_id: '5985346521103604145' }]]
        }
    }, token);
}

//step3
async function sendWaitingLinksKeyboard(chat_id, text, token) {
    await callTelegramApi('sendMessage', {
        chat_id,
        text,
        parse_mode: 'HTML',
        reply_markup: {
            resize_keyboard: true,
            keyboard: [[
                { text: '不需要', icon_custom_emoji_id: '5870734657384877785' },
                { text: '取消', icon_custom_emoji_id: '5985346521103604145' }
            ]]
        }
    }, token);
}

//主逻辑
async function handleTelegramUpdate(update, token, env) {
    const kv = env.POST_DATA;
    const currentBotUsername = await getBotUsername(token);
    if (update.message) {
        const message = update.message;
        const text = message.text || '';
        const chatId = message.chat.id;
        const currentKvState = await kv.get(`STATE:${chatId}`);
        if (text.startsWith('/start')) {
            const welcomeText = `<tg-emoji emoji-id="5890944389773005080">👋</tg-emoji> <b>您好，用户！</b>\n\n` +
                                `<tg-emoji emoji-id="5886455371559604605">✨</tg-emoji> 此机器人可以帮助您创建帖子。`;
            await sendMainMenu(chatId, welcomeText, token);
            await kv.delete(`STATE:${chatId}`);
            await kv.delete(`CONTENT:${chatId}`);
        } else if (text === '创建帖子') {
            await kv.put(`STATE:${chatId}`, 'waiting_for_post');
            await kv.delete(`CONTENT:${chatId}`);
            await sendWaitingPostKeyboard(chatId, token);

        } else if (text === '关于我们') {
            await callTelegramApi('sendMessage', {
                chat_id: chatId,
                text: '<tg-emoji emoji-id="5879785854284599288">ℹ️</tg-emoji>机器人可以创建包含 \n<tg-emoji emoji-id="5899806560867062244">🔠</tg-emoji>文本、<tg-emoji emoji-id="5775949822993371030">🖼</tg-emoji>图片、<tg-emoji emoji-id="5945068566909815651">🎞</tg-emoji>GIF、<tg-emoji emoji-id="6005986106703613755">📷</tg-emoji>视频、<tg-emoji emoji-id="5891249688933305846">🎵</tg-emoji>音频、<tg-emoji emoji-id="5875206779196935950">📁</tg-emoji>文件和<tg-emoji emoji-id="5884343982816759327">↗️</tg-emoji>按钮的帖子。',
                parse_mode: 'HTML', 
            }, token);

        } else if (text === '取消') {
            await kv.delete(`STATE:${chatId}`);
            await kv.delete(`CONTENT:${chatId}`);
            const welcomeText = '<tg-emoji emoji-id="6010362983320916413">🏡</tg-emoji> 帖子创建已取消。返回主菜单。';
            await sendMainMenu(chatId, welcomeText, token);

        } else if (currentKvState === 'waiting_for_post') {
            let postContent = {};

            let rawText = '';
            let entities = [];

            if (message.photo && message.photo.length > 0) {
                const photo = message.photo.pop();
                rawText = message.caption || '';
                entities = message.caption_entities || [];

                postContent = {
                    type: 'photo',
                    file_id: photo.file_id,
                    caption: rawText,
                    caption_entities: entities,
                };
            } else if (message.animation) {
                rawText = message.caption || '';
                entities = message.caption_entities || [];

                postContent = {
                    type: 'animation',
                    file_id: message.animation.file_id,
                    caption: rawText,
                    caption_entities: entities,
                };
            } else if (message.video) { 
                rawText = message.caption || '';
                entities = message.caption_entities || [];

                postContent = {
                    type: 'video', 
                    file_id: message.video.file_id,
                    caption: rawText,
                    caption_entities: entities,
                };
            } else if (message.audio) { 
                rawText = message.caption || '';
                entities = message.caption_entities || [];

                postContent = {
                    type: 'audio', 
                    file_id: message.audio.file_id,
                    caption: rawText,
                    caption_entities: entities,
                    file_name: message.audio.file_name,
                };

            } else if (message.document) {
                rawText = message.caption || '';
                entities = message.caption_entities || [];

                postContent = {
                    type: 'document', 
                    file_id: message.document.file_id,
                    caption: rawText,
                    caption_entities: entities,
                    file_name: message.document.file_name,
                };

            } else if (text) {
                rawText = text;
                entities = message.entities || [];

                postContent = {
                    type: 'text',
                    text: rawText,
                    entities: entities,
                };
            } else {
                await callTelegramApi('sendMessage', {
                    chat_id: chatId,
                    text: '请发送有效的文本、照片、GIF、视频、音频或文件。状态已重置。'
                }, token);
                await kv.delete(`STATE:${chatId}`);
                return;
            }

            if (!rawText && entities.length === 0 && !postContent.file_id) {
                 await callTelegramApi('sendMessage', {
                    chat_id: chatId,
                    text: '请发送有效的文本、照片、GIF、视频、音频或文件。状态已重置。'
                }, token);
                await kv.delete(`STATE:${chatId}`);
                return;
            }


            await kv.put(`CONTENT:${chatId}`, JSON.stringify(postContent));
            await kv.put(`STATE:${chatId}`, 'waiting_for_links');
            const linkInstructions = '<tg-emoji emoji-id="5886455371559604605">➡️</tg-emoji>请按以下格式发送链接：\n' +
                '[按钮文本 + 链接]\n\n' +
                '<tg-emoji emoji-id="5985433648810171091">🏷</tg-emoji>示例：\n' +
                '[YouTube + https://youtube.com]\n\n' +
                '<tg-emoji emoji-id="5985433648810171091">🏷</tg-emoji>若要在同一行添加多个按钮，请将链接写在相邻位置。\n' +
                '格式：\n' +
                '[第一个文本 + 第一个链接] [第二个文本 + 第二个链接]\n\n' +
                '<tg-emoji emoji-id="5985433648810171091">🏷</tg-emoji>若要在新行添加多个按钮，请从新行开始写新链接。\n' +
                '格式：\n' +
                '[第一个文本 + 第一个链接]\n' +
                '[第二个文本 + 第二个链接]\n\n' +
                '<tg-emoji emoji-id="5879785854284599288">ℹ️</tg-emoji>注意：按钮文本不支持 Markdown。';
            await sendWaitingLinksKeyboard(chatId, linkInstructions, token);

        } else if (currentKvState === 'waiting_for_links') {

            const contentJson = await kv.get(`CONTENT:${chatId}`);
            if (!contentJson) {
                await kv.delete(`STATE:${chatId}`);
                await sendMainMenu(chatId, '错误：未找到帖子内容。请使用“📃 创建帖子”重新开始。', token);
                return;
            }

            const postContent = JSON.parse(contentJson);
            let inlineKeyboardRows = [];

            if (text === '不需要') {
            } else {
                inlineKeyboardRows = parseLinks(text);

                if (inlineKeyboardRows.length === 0) {
                     await callTelegramApi('sendMessage', {
                         chat_id: chatId,
                         text: '无法解析链接。请检查格式，或使用“🆗 不需要”跳过。'
                     }, token);
                     return;
                }
            }

            const postId = generateRandomId();

            const finalPost = {
                ...postContent,
                inline_keyboard: inlineKeyboardRows,
                postId: postId
            };

            await kv.put(`POST:${postId}`, JSON.stringify(finalPost));
            await kv.delete(`STATE:${chatId}`);
            await kv.delete(`CONTENT:${chatId}`);
            const shareCommand = `@${currentBotUsername} ${postId}`;
            const confirmationText = `<tg-emoji emoji-id="5890944389773005080">💬</tg-emoji>您的帖子已准备就绪！\n\n` +
                                     `<tg-emoji emoji-id="5877495434124988415">📎</tg-emoji>您可以使用以下代码在任何聊天中使用它：\n` +
                                     `<code>${shareCommand}</code>`;

            const shareButtonMarkup = {
                inline_keyboard: [
                    [
                        {
                            text: `分享帖子`,
                            switch_inline_query: postId,
                            icon_custom_emoji_id: '5967432491684860012' 
                        }
                    ]
                ]
            };

            await callTelegramApi('sendMessage', {
                chat_id: chatId,
                text: confirmationText,
                reply_markup: shareButtonMarkup,
                parse_mode: 'HTML',
            }, token);
            const resetText = '<tg-emoji emoji-id="5886666250158870040">💬</tg-emoji> 点击下方按钮创建另一个帖子。';
            
            await sendMainMenu(chatId, resetText, token);
        }
    }

    else if (update.inline_query) {
        const query = update.inline_query;
        const postId = query.query.trim().toUpperCase();

        let results = [];

        if (postId.length >= 1) {
            const postJson = await kv.get(`POST:${postId}`);

            if (postJson) {
                const post = JSON.parse(postJson);
                const replyMarkup = {
                    inline_keyboard: post.inline_keyboard || []
                };

                if (post.type === 'text') {
                    results.push({
                        type: 'article',
                        id: postId,
                        title: `帖子 ID: ${postId} (文本)`,
                        input_message_content: {
                            message_text: post.text,
                            entities: post.entities || []
                        },
                        reply_markup: replyMarkup
                    });
                } else if (post.type === 'photo') {
                    results.push({
                        type: 'photo',
                        id: postId,
                        photo_file_id: post.file_id,
                        caption: post.caption,
                        caption_entities: post.caption_entities || [],
                        reply_markup: replyMarkup
                    });

                } else if (post.type === 'animation') {
                    results.push({
                        type: 'gif',
                        id: postId,
                        gif_file_id: post.file_id,
                        title: `帖子 ID: ${postId} (GIF)`,
                        caption: post.caption,
                        caption_entities: post.caption_entities || [],
                        reply_markup: replyMarkup
                    });
                } else if (post.type === 'video') { 
                    results.push({
                        type: 'document', 
                        id: postId,
                        document_file_id: post.file_id,
                        title: `帖子 ID: ${postId} (视频)`,
                        caption: post.caption,
                        caption_entities: post.caption_entities || [],
                        reply_markup: replyMarkup
                    });
                // 添加对音频的支持
                } else if (post.type === 'audio') { 
                    const fileTitle = post.file_name || '音频文件';
                    results.push({
                        type: 'audio', // Telegram inline type for audio
                        id: postId,
                        audio_file_id: post.file_id, 
                        title: `帖子 ID: ${postId} (${fileTitle})`, 
                        caption: post.caption,
                        caption_entities: post.caption_entities || [],
                        reply_markup: replyMarkup
                    });

                } else if (post.type === 'document') { // 添加通用文件支持
                    const fileTitle = post.file_name || '通用文件';
                    results.push({
                        type: 'document', // 适用于所有通用文件
                        id: postId,
                        document_file_id: post.file_id,
                        title: `帖子 ID: ${postId} (${fileTitle})`, // 标题显示文件名
                        caption: post.caption,
                        caption_entities: post.caption_entities || [],
                        reply_markup: replyMarkup
                    });
                }
            }
        }

        await callTelegramApi('answerInlineQuery', {
            inline_query_id: query.id,
            results: results,
            cache_time: 10,
        }, token);
    }
}

export default {
    async fetch(req, env) {
        const { POST_DATA, BOT_TOKEN } = env;
        if (!POST_DATA || !BOT_TOKEN) return new Response('cf err', { status: 500 });
        if (req.method !== 'POST') return new Response('met not found', { status: 405 });

        try {
            await handleTelegramUpdate(await req.json(), BOT_TOKEN, env);
        } catch (e) {
            console.error('Error:', e.message);
        }

        return new Response('OK'); 
    }
};
