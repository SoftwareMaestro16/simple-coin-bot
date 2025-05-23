require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { startHighLevelChatUserCheck } = require('./services/chatUserCheck');
const { checkLowLevelMessage } = require('./services/publicChat');
const { startMonthlyChatUserCheck } = require('./services/monthlyChat');
const { startNftChatUserCheck } = require('./services/nftChatCheck');
const { startNftChatUserCheck2 } = require('./services/nftChatCheck2');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

startHighLevelChatUserCheck(bot);
startMonthlyChatUserCheck(bot);
startNftChatUserCheck(bot);
startNftChatUserCheck2(bot);

bot.on('message', async (msg) => {
    try {
      await checkLowLevelMessage(bot, msg); 
    } catch (error) {
      console.error('Error processing message:', error);
    }
});

module.exports = bot;