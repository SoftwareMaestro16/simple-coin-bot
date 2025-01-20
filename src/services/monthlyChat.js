const { chats, admins } = require('../utils/config');
const { getAllUsers, updateUserSubscription } = require('../db');

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

            if (timeRemaining > 0 && timeRemaining <= 24 * 60 * 60 * 1000) {
                console.log(`User ${userId} subscription expires in less than 1 day.`);
                try {
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
                } catch (error) {
                    console.error(`Error sending message to user ${userId}:`, error);
                }
            } else if (timeRemaining <= 0) {
                console.log(`User ${userId} subscription expired. Removing from chat.`);
                try {
                    // Проверяем, есть ли пользователь уже вне чата, чтобы не отправлять сообщение повторно
                    const chatMember = await bot.getChatMember(chat.id, userId);
                    if (chatMember.status === 'left' || chatMember.status === 'kicked') {
                        console.log(`User ${userId} is already out of the chat. Skipping message.`);
                        continue;
                    }

                    // Удаляем пользователя из чата
                    await bot.banChatMember(chat.id, userId);
                    await bot.unbanChatMember(chat.id, userId);

                    // Отправляем сообщение только один раз
                    await bot.sendMessage(
                        userId,
                        `⏳ Ваша подписка истекла. Чтобы вернуться в чат, продлите подписку.`,
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
                } catch (error) {
                    console.error(`Error removing user ${userId} from chat:`, error);
                }
            } else {
                console.log(`User ${userId} subscription is active.`);
            }
        }
    } catch (error) {
        console.error('Error checking monthly chat users:', error);
    }
}

function startMonthlyChatUserCheck(bot) {
  setInterval(() => checkMonthlyChatUsers(bot), 30000); // Каждые 30 секунд для теста
}

module.exports = {
  startMonthlyChatUserCheck,
};