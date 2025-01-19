require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { startChatUserCheck } = require('./services/chatUserCheck');
const { checkLowLevelMessage } = require('./services/publicChat');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
startChatUserCheck(bot);

bot.on('message', async (msg) => {
    try {
      await checkLowLevelMessage(bot, msg); 
    } catch (error) {
      console.error('Error processing message:', error);
    }
});

module.exports = bot;