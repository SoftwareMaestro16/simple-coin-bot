const bot = require('../bot');
const { handleProfile, handleDisconnectWallet, handleWalletConnection, handlePrivateChat } = require('./walletHandlers');
const { getUserById, addUser, getAllUsers } = require('../db');
const { generateMainKeyboard } = require('./keyboardUtils');
const { admins, chats } = require('../utils/config');

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'Unknown';
  const userName = msg.from.username || null;

  try {
    const existingUser = await getUserById(userId);

    if (!existingUser) {
      await addUser(userId, firstName, userName);
    }

    const address = existingUser?.address || null;

    const text = address
      ? '✅ Ваш кошелек уже подключен. Используйте кнопки ниже:'
      : '☀️ Добро пожаловать! Пожалуйста, выберите Кошелек для подключения:';

    const keyboard = generateMainKeyboard(address);

    bot.sendMessage(chatId, text, {
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (error) {
    bot.sendMessage(chatId, 'Произошла ошибка при выполнении команды.');
  }
});

bot.onText(/\/show_users/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!admins.includes(userId)) {
    return bot.sendMessage(chatId, 'У вас нет прав.')
  }

  try {
    const users = await getAllUsers(); 
    if (users.length === 0) {
      bot.sendMessage(chatId, 'В базе данных нет пользователей.');
    } else {
      let userList = '📋 Список пользователей:\n\n';

      users.forEach((user, index) => {
        const firstName = user.firstName || 'Не указано';
        const userName = user.userName ? `@${user.userName}` : 'Не указан';
        userList += `${index + 1}. <b>${firstName}</b> (${userName})\n`;
      });

      bot.sendMessage(chatId, userList, { parse_mode: 'HTML' });
    }
  } catch (error) {
    console.error('Ошибка при выводе пользователей:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при попытке получить список пользователей.');
  }
});

bot.onText(/\/count_users/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!admins.includes(userId)) {
    return bot.sendMessage(chatId, 'У вас нет прав.')
  }

  try {
    const users = await getAllUsers(); 
    const userCount = users.length;

    bot.sendMessage(chatId, `📊 В базе данных ${userCount} пользователь(ей).`);
  } catch (error) {
    console.error('Ошибка при подсчете пользователей:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при попытке подсчитать пользователей.');
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const callbackData = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  if (callbackData === 'Profile') {
    await handleProfile(chatId, messageId);
  } else if (callbackData === 'DisconnectWallet') {
    await handleDisconnectWallet(chatId, messageId);
  } else if (callbackData === 'PrivateChat') {
    await handlePrivateChat(chatId, messageId, bot);
  } else if (callbackData === 'BackToMenu') {
    await bot.editMessageText(
      '✅ Ваш кошелек уже подключен. Используйте кнопки ниже:',
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Профиль 👤', callback_data: 'Profile' },
            ],
            [
              { text: 'Приватный Чат 🌟', callback_data: 'PrivateChat' },
            ],
            [
              { text: 'Blum 🗃', url: 'https://t.me/blum/app?startapp=memepadjetton_LUDOMAN_hFG7q-ref_Y9kokQfbIr' },
              { text: 'STON.fi 💎', url: 'https://app.ston.fi/swap?chartVisible=false&chartInterval=1w&ft=TON&tt=EQDbKihXMZuNfl7m7VcNrHIyYYYgCFPhccIqNN_ocNn-PBCb' },
              { text: 'BigPump ▶️', url: 'https://t.me/pocketfi_bot/bigpump?startapp=vlady_uk_8859-eyJjb2luSWQiOiI4NDEzNiJ9' },
            ],
          ],
        },
      }
    );
  } else if (['Tonkeeper', 'MyTonWallet', 'TonHub'].includes(callbackData)) {
    await handleWalletConnection(chatId, callbackData, messageId);
  }
});

bot.on('chat_join_request', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  console.log(`Получена заявка на присоединение: chatId=${chatId}, userId=${userId}`);

  const user = await getUserById(userId);

  if (!user) {
    console.warn(`Пользователь с ID ${userId} не найден в базе данных.`);
    return;
  }

  const chatConfig = Object.values(chats).find(chat => chat.id === chatId);

  if (!chatConfig) {
    console.warn(`Конфигурация для чата с ID ${chatId} не найдена.`);
    return;
  }

  const requiredBalance = chatConfig.requirement;

  try {
    const address = user.address;

    if (!address) {
      console.error(`Address не найден для пользователя ${userId}. Заявка отклонена.`);
      return;
    }

    console.log(`Проверяем баланс пользователя: userId=${userId}, address=${address}`);

    const currentBalance = await getBalance(address);

    console.log(`Баланс пользователя: currentBalance=${currentBalance}, requiredBalance=${requiredBalance}`);

    if (currentBalance >= requiredBalance) {
      console.log(`Баланс пользователя достаточный. Принимаем заявку: userId=${userId}`);
      await bot.approveChatJoinRequest(chatId, userId);

      const firstName = msg.from.first_name || 'Участник';
      await bot.sendMessage(
        chatId,
        `🎉 Добро пожаловать, <b>${firstName}</b>, в наш приватный чат! 🌟\n\n`,
        { parse_mode: 'HTML' }
      );
    } else {
      console.warn(`Недостаточно средств: userId=${userId}, balance=${currentBalance}, required=${requiredBalance}`);
      await bot.declineChatJoinRequest(chatId, userId);
    }
  } catch (error) {
    console.error(`Ошибка обработки запроса на присоединение: userId=${userId}, chatId=${chatId}`, error);
  }
});