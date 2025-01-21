const { chats, admins } = require('../utils/config');
const { getAllUsers, getCollector } = require('../db');
const { getData } = require('../utils/getBalance');

async function checkHighLevelChatUsers(bot) {
  const chat = chats.highLevel;
  console.log(`Starting highLevel chat user check for chat ID: ${chat.id}`);

  try {
    const collector = await getCollector();
    const whaleAmount = collector.whaleAmount;

    if (typeof whaleAmount !== 'number' || whaleAmount <= 0) {
      console.error('Invalid whaleAmount in collector. Ensure it is set correctly.');
      return;
    }

    console.log(`HighLevel chat token requirement (whaleAmount): ${whaleAmount}`);

    const users = await getAllUsers(); 

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
          await bot.banChatMember(chat.id, userId);
          await bot.unbanChatMember(chat.id, userId);
          continue;
        }

        const balance = await getData(user.address);

        if (balance === null || balance < whaleAmount) {
          console.log(
            `User ${userId} does not meet the balance requirement for highLevel chat. Current balance: ${balance}.`
          );
          if (!admins.includes(userId)) {
            console.log(`Removing user ${userId} from chat ${chat.id}.`);
            await bot.banChatMember(chat.id, userId);
            await bot.unbanChatMember(chat.id, userId);
          } else {
            console.log(`Admin ${userId} cannot be removed.`);
          }
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

function startHighLevelChatUserCheck(bot) {
  setInterval(() => checkHighLevelChatUsers(bot), 7200000); // 2 hours 7200000
}

module.exports = {
  startHighLevelChatUserCheck,
};