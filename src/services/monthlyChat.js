const { chats, admins } = require('../utils/config');
const { getAllUsers } = require('../db');
const { delay } = require('../utils/delay');

async function checkMonthlyChatUsers(bot) {
    const chat = chats.mediumLevel;

    try {
        const users = await getAllUsers(); 

        for (const user of users) {
            const userId = user.userId;

            if (admins.includes(userId)) {
                console.log(`Skipping admin: ${userId}`);
                continue;
            }

            if (!user.subscriptionExpiresAt) {
                console.log(`User ${userId} has no subscription.`);
                continue;
            }

            const subscriptionDate = new Date(user.subscriptionExpiresAt);
            const currentDate = new Date();
            const timeRemaining = subscriptionDate - currentDate;

            await delay(2350);

            try {
                const chatMember = await bot.getChatMember(chat.id, userId);

                if (timeRemaining <= 0) {
                    if (chatMember.status !== 'left' && chatMember.status !== 'kicked') {
                        console.log(
                            `User ${userId} subscription expired and they are still in the chat. Sending warning and removing...`
                        );

                        const warningMessage = await bot.sendMessage(
                            userId,
                            `⏳ Ваша подписка истекла. Вы будете удалены из чата. Чтобы вернуться, продлите подписку.`,
                            {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: '✨ Продлить Подписку 🔑',
                                                callback_data: 'MonthlyChat',
                                            },
                                        ],
                                    ],
                                },
                            }
                        );

                        console.log(`Warning message sent to user ${userId}: ${warningMessage.message_id}`);

                        await new Promise((resolve) => setTimeout(resolve, 2000));

                        await bot.banChatMember(chat.id, userId);
                        await bot.unbanChatMember(chat.id, userId);

                        console.log(`User ${userId} removed from chat.`);
                    } else {
                        console.log(`User ${userId} is already out of the chat.`);
                    }
                } else if (timeRemaining > 0 && timeRemaining <= 24 * 60 * 60 * 1000) {
                    console.log(`User ${userId} subscription expires in less than 1 day.`);
                    await bot.sendMessage(
                        userId,
                        `⚠️ Ваша подписка истекает <b>${new Intl.DateTimeFormat('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        }).format(subscriptionDate)}</b>.\nПожалуйста, продлите её, чтобы оставаться в чате.`,
                        {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: '✨ Продлить Подписку 🔑',
                                            callback_data: 'MonthlyChat',
                                        },
                                    ],
                                ],
                            },
                        }
                    );
                } else {
                    console.log(`User ${userId} subscription is active.`);
                }
            } catch (error) {
                if (error.response?.body?.error_code === 400) {
                    console.log(`User ${userId} is not in chat ${chat.id}.`);
                } else {
                    console.error(`Error checking user ${userId} in chat ${chat.id}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error checking monthly chat users:', error);
    }
}

function startMonthlyChatUserCheck(bot) {
    checkMonthlyChatUsers(bot);
    const period = 3600000 * 11;

    setInterval(() => checkMonthlyChatUsers(bot), period); 
}

module.exports = {
    startMonthlyChatUserCheck,
};