const { chats, admins } = require('../utils/config');
const { getAllUsers } = require('../db');
const { getData } = require('../utils/getBalance');

async function checkChatUsers(bot) {
  for (const [level, chat] of Object.entries(chats)) {
    try {
    //   console.log(`Checking users in ${level} chat...`);

      const users = getAllUsers();

      for (const user of users) {
        const userId = user.id;

        if (admins.includes(userId)) {
        //   console.log(`Skipping admin: ${userId}`);
          continue;
        }

        try {
          const chatMember = await bot.getChatMember(chat.id, userId);

          if (!chatMember) {
            // console.log(`User ${userId} is not a member of chat ${chat.id}.`);
            continue;
          }

          if (!user.address) {
            // console.log(`User ${userId} does not have a connected wallet.`);
            continue;
          }

          const balance = await getData(user.address);

          if (balance === null) {
            console.error(`Could not fetch balance for user ${userId}`);
            continue;
          }

          if (balance < chat.requirement) {
            // console.log(
            //   `User ${userId} does not meet the balance requirement for ${level} chat. ${balance} Removing...`
            // );
          
            await bot.banChatMember(chat.id, userId);
            await bot.unbanChatMember(chat.id, userId);
          } else {
            // console.log(`User ${userId} meets the balance requirement for ${level} chat.`);
          }
        } catch (error) {
          if (error.response?.body?.error_code === 400) {
            // console.log(`User ${userId} is not in chat ${chat.id}.`);
          } else {
            console.error(`Error checking user ${userId} in chat ${chat.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error checking users in ${level} chat:`, error);
    }
  }
}

function startChatUserCheck(bot) {
  setInterval(() => checkChatUsers(bot), 10000);
}
// 3600000 - 1 hour

module.exports = {
  startChatUserCheck,
};