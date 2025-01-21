const { getNft } = require('../utils/getNft');
const { chats, admins } = require('../utils/config');
const { getAllUsers } = require('../db');

async function checkNftChat(bot) {
  const chat = chats.nftChat;
  console.log(`Starting NFT chat user check for chat ID: ${chat.id}`);

  try {
    const users = await getAllUsers(); 

    for (const user of users) {
      const userId = user.userId;

      if (admins.includes(userId)) {
        console.log(`Skipping admin: ${userId}`);
        continue; 
      }

      try {
        const chatMember = await bot.getChatMember(chat.id, userId);

        if (!chatMember || chatMember.status === 'left' || chatMember.status === 'kicked') {
          console.log(`User ${userId} is not a member of chat ${chat.id}.`);
          continue;
        }

        if (!user.address) {
          console.log(`User ${userId} does not have a connected wallet.`);
          await bot.banChatMember(chat.id, userId);
          await bot.unbanChatMember(chat.id, userId);
          continue;
        }

        console.log(`Checking NFT for user: userId=${userId}, address=${user.address}`);

        const nftResponse = await getNft(user.address);

        const hasNft = nftResponse?.length > 0;

        if (!hasNft) {
          console.log(
            `User ${userId} does not have the required NFT. Removing from chat ${chat.id}.`
          );
          await bot.banChatMember(chat.id, userId); 
          await bot.unbanChatMember(chat.id, userId); 
        } else {
          console.log(`User ${userId} has the required NFT. Keeping in chat.`);
        }
      } catch (error) {
        if (error.response?.body?.error_code === 400) {
          console.log(`User ${userId} is not found in chat ${chat.id}.`);
        } else {
          console.error(`Error checking user ${userId} in chat ${chat.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error checking users in NFT chat:', error);
  }
}

function startNftChatUserCheck(bot) {
  const period = 3600000 * 6;

  setInterval(() => checkNftChat(bot), period); // 6 часов
}

module.exports = {
  startNftChatUserCheck,
};