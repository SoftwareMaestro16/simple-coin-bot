require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { startChatUserCheck } = require('./services/chatUserCheck');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
startChatUserCheck(bot);

module.exports = bot;