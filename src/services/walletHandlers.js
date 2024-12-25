const { toUserFriendlyAddress } = require('@tonconnect/sdk');
const { getWalletInfo } = require('../tonConnect/wallets');
const { editTonAddress } = require('../utils/editTonAddress');
const { generateQRCode, getConnector } = require('../tonConnect/connector');
const { getData } = require('../utils/getBalance');
const { updateUserAddressAndBalance, getUserById, getUserByAddress } = require('../db');
const { generateProfileKeyboard } = require('./keyboardUtils');
const bot = require('../bot');
const { admins, chats } = require('../utils/config');

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

    const address = editTonAddress(user.address) || 'Не Подключен';
    const balance = new Intl.NumberFormat('en-US').format(user.balance || 0);

    const options = generateProfileKeyboard(address);

    await bot.editMessageText(
      `👤 <b>Ваш профиль:</b>\n\n` +
      `<b>Имя:</b> <code>${user.id}</code>\n` +
      `<b>Имя:</b> ${user.name}\n` +
      `<b>Username:</b> @${user.username}\n` +
      `<b>Адрес:</b> <code>${address}</code>\n` +
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

        const existingUser = getUserByAddress(userFriendlyAddress);

        if (existingUser) {
          if (qrMessageId) {
            await bot.deleteMessage(chatId, qrMessageId);
          }

          await bot.sendMessage(
            chatId,
            '❌ Данный кошелек уже был подключен ранее. Пожалуйста, используйте другой кошелек.',
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: 'Tonkeeper', callback_data: 'Tonkeeper' },
                    { text: 'MyTonWallet', callback_data: 'MyTonWallet' },
                    { text: 'TonHub', callback_data: 'TonHub' },
                  ],
                ],
              },
            }
          );
          return; 
        }

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
          if (qrMessageId) {
            await bot.deleteMessage(chatId, qrMessageId);
          }
          bot.sendMessage(chatId, '❌ У вас нет на балансе $LUDOMAN. Кошелек не подключен.', {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Blum 🗃', url: 'https://t.me/blum/app?startapp=memepadjetton_LUDOMAN_hFG7q-ref_Y9kokQfbIr'},
                  { text: 'STON.fi 💎', url: 'https://app.ston.fi/swap?chartVisible=false&chartInterval=1w'},
                  { text: 'BigPump ▶️', url: 'https://t.me/pocketfi_bot/bigpump?startapp=vlady_uk_8859-eyJjb2luSWQiOiI4NDEzNiJ9'},
                ],
                [
                  { text: 'Tonkeeper', callback_data: 'Tonkeeper' },
                  { text: 'MyTonWallet', callback_data: 'MyTonWallet' },
                  { text: 'TonHub', callback_data: 'TonHub' },
                ],
              ],
            },
          });
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
    'Выберите уровень приватного чата, чтобы отправить заявку на вступление:\n\n' +
    '⬆️ Уровни:\n' +
    '500K, 2M, 10M $LUDOMAN.',
    {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Low · 500K ⚡️', url: chats.lowLevel.url },
          ],
          [
            { text: 'Medium · 2M 🌟', url: chats.mediumLevel.url },
          ],
          [
            { text: 'High · 10M 💎', url: chats.highLevel.url },
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