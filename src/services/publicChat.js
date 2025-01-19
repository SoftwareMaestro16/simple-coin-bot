const { chats, admins } = require('../utils/config');
const { getUserById } = require('../db');
const { getData } = require('../utils/getBalance');

async function checkLowLevelMessage(bot, msg) {
  console.log('Received a message:', msg);

  const chat = chats.lowLevel;

  if (msg.chat.id === chat.id) {
    console.log(`Message received in lowLevel chat: ${chat.id}`);
    try {
      const userId = msg.from.id;
      const firstName = msg.from.first_name || 'Участник'; 
      console.log(`User ID: ${userId}, Name: ${firstName}`);

      if (admins.includes(userId)) {
        console.log(`Skipping admin: ${userId}`);
        return;
      }

      console.log(`Fetching user data for user ID: ${userId}`);
      const user = await getUserById(userId);

      let sendMessage = false; 
      let reason = '';

      if (!user || !user.address) {
        console.log(`User ${userId} does not have a connected wallet or is not in the database.`);
        reason = `⚠️ ${firstName}, чтобы писать в чате, вам необходимо иметь <b>1 $SC</b> на балансе и подключить свой Кошелек.`;
        sendMessage = true;
      } else {
        console.log(`Fetching balance for user ID: ${userId}, address: ${user.address}`);
        const balance = await getData(user.address);

        if (balance === null || balance < 1) {
          console.log(`User ${userId} does not meet the token requirement. Current balance: ${balance}`);
          reason = `⚠️ ${firstName}, чтобы писать в чате, вам необходимо иметь <b>1 $SC</b> на балансе.`;
          sendMessage = true;
        } else {
          console.log(`User ${userId} meets the token requirement. Current balance: ${balance}`);
        }
      }

      if (sendMessage) {
        await bot.deleteMessage(chat.id, msg.message_id);
        console.log(`Deleted message from user ${userId}`);

        const botMessage = await bot.sendMessage(chat.id, reason, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🌟 Simple Coin Bot 🪙',
                  url: 'https://t.me/sc_chat_control_bot',
                },
              ],
            ],
          },
        });

        console.log(`Sent bot message to user ${userId}`);

        setTimeout(() => {
          bot.deleteMessage(chat.id, botMessage.message_id).catch((err) => {
            console.error('Error deleting bot message:', err);
          });
        }, 12500);

        const muteUntil = Math.floor(Date.now() / 1000) + 60; // 10 минут (600)
        await bot.restrictChatMember(chat.id, userId, {
          until_date: muteUntil,
        });
        console.log(`Muted user ${userId} for 10 minutes`);
      }
    } catch (error) {
      console.error('Error handling message in lowLevel chat:', error);
    }
  } else {
    console.log(`Message is not from lowLevel chat: ${msg.chat.id}`);
  }
}

module.exports = {
  checkLowLevelMessage,
};