const { toUserFriendlyAddress } = require('@tonconnect/sdk');
const { getWalletInfo } = require('../tonConnect/wallets');
const { editTonAddress } = require('../utils/editTonAddress');
const { generateQRCode, getConnector } = require('../tonConnect/connector');
const { getData } = require('../utils/getBalance');
const { updateUserAddressAndBalance, getUserById } = require('../db');
const { generateProfileKeyboard } = require('./keyboardUtils');
const bot = require('../bot');

async function handleProfile(chatId, messageId) {
  try {
    const user = getUserById(chatId);

    if (!user) {
      await bot.editMessageText('Данные профиля не найдены.', {
        chat_id: chatId,
        message_id: messageId,
      });
      return;
    }

    const address = user.address || 'Не Подключен';
    const balance = new Intl.NumberFormat('en-US').format(user.balance || 0);

    const options = generateProfileKeyboard(address);

    await bot.editMessageText(
      `👤 <b>Ваш профиль:</b>\n\n` +
      `<b>Имя:</b> <code>${user.id}</code>\n` +
      `<b>Имя:</b> ${user.name}\n` +
      `<b>Username:</b> @${user.username}\n` +
      `<b>Адрес:</b> <code>${editTonAddress(address)}</code>\n` +
      `<b>Баланс:</b> ${balance}`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: options,
      }
    );
  } catch (error) {
    console.error('Error fetching profile data:', error);
    bot.editMessageText('Произошла ошибка при загрузке профиля.', {
      chat_id: chatId,
      message_id: messageId,
    });
  }
}

async function handleDisconnectWallet(chatId, messageId) {
  updateUserAddressAndBalance(chatId, null, 0);

  const keyboard = generateProfileKeyboard('Не Подключен');

  await bot.editMessageText('🔑 Кошелек отключен. Выберите новый для подключения:', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: keyboard,
  }); 
}

async function handleWalletConnection(chatId, walletName, messageId) {
  try {
    const walletInfo = await getWalletInfo(walletName);

    if (!walletInfo) {
      await bot.editMessageText(`Кошелек ${walletName} не найден.`, {
        chat_id: chatId,
        message_id: messageId,
      });
      return;
    }

    await bot.deleteMessage(chatId, messageId);

    const connector = getConnector(chatId);
    let qrMessageId;

    connector.onStatusChange(async (wallet) => {
      if (wallet) {
        const userFriendlyAddress = toUserFriendlyAddress(wallet.account.address);

        try {
          const rawBalance = await getData(userFriendlyAddress);
          const balance = new Intl.NumberFormat('en-US').format(rawBalance);

          updateUserAddressAndBalance(chatId, userFriendlyAddress, rawBalance);

          if (qrMessageId) {
            await bot.deleteMessage(chatId, qrMessageId);
          }

          bot.sendMessage(
            chatId,
            `🎉 <b>${wallet.device.appName}</b> Кошелек Подключен!\nАдрес: <code>${editTonAddress(userFriendlyAddress)}</code>\n<b>$LUDOMAN: </b><code>${balance}</code>`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: 'Профиль 👤', callback_data: 'Profile' },
                  ],
                ],
              },
            }
          );
        } catch (error) {
          console.error('Failed to fetch wallet balance:', error);
          bot.sendMessage(chatId, 'Произошла ошибка при получении данных кошелька.');
        }
      } else {
        bot.sendMessage(chatId, 'Кошелек Отключен.');
      }
    });

    const link = connector.connect({
      bridgeUrl: walletInfo.bridgeUrl,
      universalLink: walletInfo.universalLink,
    });

    const qrCode = await generateQRCode(link);

    const sentMessage = await bot.sendPhoto(chatId, qrCode, {
      caption: `Отсканируйте QR Code, чтобы подключить ${walletName} Кошелек.`,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Подключить Кошелек 👛',
              url: link,
            },
          ],
        ],
      },
    });

    qrMessageId = sentMessage.message_id;
  } catch (error) {
    console.error('Error handling wallet connection:', error);
    bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
  }
}

async function handlePrivateChat(chatId, messageId, bot) {
  await bot.editMessageText(
    'Чтобы попасть в приватный чат, вам необходимо иметь на балансе подключенного кошелька не менее 500000 токенов.',
    {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Отправить Заявку ⚡️', url: 'https://t.me/+BErKBsNBzGk5MjMy' },
          ],
          [
            { text: '« Назад', callback_data: 'BackToMenu' },
          ],
        ],
      },
    }
  );
}

module.exports = {
  handleProfile,
  handleDisconnectWallet,
  handleWalletConnection,
  handlePrivateChat
};