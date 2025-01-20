const { chats, admins } = require('../utils/config');
const { getAllUsers } = require('../db');
const { getData } = require('../utils/getBalance');

/**
 * Проверяет пользователей в highLevel чате.
 * Удаляет пользователей, которые не соответствуют требованиям.
 */
async function checkHighLevelChatUsers(bot) {
  const chat = chats.highLevel; // Используется исключительно highLevel чат
  console.log(`Starting highLevel chat user check for chat ID: ${chat.id}`);

  try {
    const users = await getAllUsers(); // Получаем всех пользователей из базы

    for (const user of users) {
      const userId = user.userId;

      if (admins.includes(userId)) {
        console.log(`Skipping admin: ${userId}`);
        continue;
      }

      try {
        const chatMember = await bot.getChatMember(chat.id, userId);

        if (!chatMember) {
          console.log(`User ${userId} is not a member of chat ${chat.id}.`);
          continue;
        }

        if (!user.address) {
          console.log(`User ${userId} does not have a connected wallet.`);
          continue;
        }

        const balance = await getData(user.address);

        if (balance === null) {
          console.error(`Could not fetch balance for user ${userId}`);
          continue;
        }

        if (balance < chat.requirement) {
          console.log(
            `User ${userId} does not meet the balance requirement for highLevel chat. Current balance: ${balance}. Removing...`
          );
          await bot.banChatMember(chat.id, userId); // Удаление пользователя
          await bot.unbanChatMember(chat.id, userId); // Разблокировка для повторного добавления в будущем
        } else {
          console.log(
            `User ${userId} meets the balance requirement for highLevel chat. Current balance: ${balance}.`
          );
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
    console.error(`Error checking users in highLevel chat:`, error);
  }
}

/**
 * Запускает проверку пользователей в highLevel чате каждые 2 часа.
 */
function startHighLevelChatUserCheck(bot) {
  setInterval(() => checkHighLevelChatUsers(bot), 7200000); // Интервал проверки: 2 часа
}

module.exports = {
  startHighLevelChatUserCheck,
};