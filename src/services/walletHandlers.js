const { toUserFriendlyAddress } = require('@tonconnect/sdk');
const { getWalletInfo } = require('../tonConnect/wallets');
const { editTonAddress } = require('../utils/editTonAddress');
const { generateQRCode, getConnector } = require('../tonConnect/connector');
const { getData } = require('../utils/getBalance');
const { updateUserAddressAndBalance, getUserById, getUserByAddress } = require('../db');
const { generateProfileKeyboard } = require('./keyboardUtils');
const bot = require('../bot');
const { admins, chats } = require('../utils/config');
const User = require('../models/User'); 
const { generatePayLink } = require('../utils/generatePayLink');
const QRCode = require('qrcode');
const { startPaymentVerification } = require('../utils/verifyPayment');

async function handleProfile(chatId, messageId) {
  try {
    const user = await getUserById(chatId);

    if (!user) {
      await bot.editMessageText('Данные профиля не найдены.', {
        chat_id: chatId,
        message_id: messageId,
      });
      return;
    }

    const address = editTonAddress(user.address) || 'Не Подключен';

    let balance = 0;
    if (user.address) {
      try {
        balance = await getData(user.address); 
        balance = new Intl.NumberFormat('en-US').format(balance || 0); 
      } catch (error) {
        console.error('Error fetching balance from API:', error);
        balance = 'Ошибка загрузки';
      }
    } else {
      balance = 'Не Подключен';
    }

    const options = generateProfileKeyboard(address);

    await bot.editMessageText(
      `👤 <b>Ваш профиль:</b>\n\n` +
      `<b>Имя:</b> <code>${user.userId}</code>\n` +
      `<b>Имя:</b> ${user.firstName}\n` +
      `<b>Username:</b> @${user.userName}\n` +
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
    await bot.editMessageText('Произошла ошибка при загрузке профиля.', {
      chat_id: chatId,
      message_id: messageId,
    });
  }
}

async function handleDisconnectWallet(chatId, messageId) {
  await updateUserAddressAndBalance(chatId, null, 0, null);

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
      if (!wallet) {
        console.warn('Disconnected.');
        return;
      }

      if (wallet) {
        const userFriendlyAddress = toUserFriendlyAddress(wallet.account.address);

        if (!userFriendlyAddress) {
          console.error('Invalid wallet address detected.');
          return;
        }

        const existingUser = await getUserByAddress(userFriendlyAddress);

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

          updateUserAddressAndBalance(chatId, userFriendlyAddress, rawBalance, wallet.device.appName);

          if (qrMessageId) {
            await bot.deleteMessage(chatId, qrMessageId);
          }

          bot.sendMessage(
            chatId,
            `🎉 <b>${wallet.device.appName}</b> Кошелек Подключен!\nАдрес: <code>${editTonAddress(userFriendlyAddress)}</code>\n<b>$SC: </b><code>${balance}</code>`,
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
          bot.sendMessage(chatId, '❌ У вас нет на балансе $SC. Кошелек не подключен.', {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'DeDust 🟨', url: 'https://dedust.io/swap/TON/EQB9QBqniFI0jOmw3PU6v1v4LU3Sivm9yPXDDB9Qf7cXTDft' },
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
  try {
    const text = 'Выберите уровень чата, чтобы отправить заявку на вступление:\n\n';

    if (messageId) {
      await bot.deleteMessage(chatId, messageId);
    }

    const lowLevelChats = [
      {
        id: -1002442392045,
        url: 'https://t.me/simplecoin_chatSC',
        title: '⚡️ SC Chat',
      },
      {
        id: -1002230648515,
        url: 'https://t.me/TON_in_my_Mindd_Chat',
        title: 'TMM Chat 🌟',
      },
    ];

    const inlineKeyboard = [];
    for (let i = 0; i < lowLevelChats.length; i += 2) {
      const row = lowLevelChats.slice(i, i + 2).map(chat => ({
        text: chat.title,
        url: chat.url,
      }));
      inlineKeyboard.push(row);
    }

    inlineKeyboard.push(
      // [
      //   { text: '🌙 Monthly Chat 💳', callback_data: 'MonthlyChat' },
      // ],
      [
        { text: '🐳 Whale Chat 🪙', url: chats.highLevel.url },
      ],
      [
        { text: '« Назад', callback_data: 'BackToMenu' },
      ]
    );

    await bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  } catch (error) {
    console.error('Error in handlePrivateChat:', error);
    await bot.sendMessage(chatId, 'Произошла ошибка при открытии приватного чата.');
  }
}

async function handleMonthlyChatMenu(chatId, messageId, bot) {
  try {
    if (messageId) {
      await bot.deleteMessage(chatId, messageId);
    }

    const user = await User.findOne({ userId: chatId });

    if (!user || !user.connectedWallet) {
      await bot.sendMessage(
        chatId,
        '❌ У вас не подключен кошелек. Пожалуйста, подключите кошелек, чтобы продолжить.'
      );
      return;
    }

    const now = new Date();
    const subscriptionExpiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;

    if (subscriptionExpiresAt && subscriptionExpiresAt > now) {
      const remainingTime = subscriptionExpiresAt - now;
      const oneDay = 24 * 60 * 60 * 1000;

      if (remainingTime < oneDay) {
        const { payLink, trackingCode, monthlyAmount } = await generatePayLink(user.connectedWallet, chatId);
        const qrCodeBuffer = await QRCode.toBuffer(payLink, { width: 300 });

        await bot.sendPhoto(chatId, qrCodeBuffer, {
          caption: `⏳ Ваша подписка истекает менее чем через 1 день.\n` +
                   `💰 Вы можете продлить её, оплатив **${monthlyAmount} $SC**.\n` +
                   `🔑 Код отслеживания: \`${trackingCode}\`\n\n❗️Важно! Не закрывайте это меню во время Оплаты.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💸 Отправить 💎', url: payLink }],
              [{ text: '🔄 Обновить Код 📄', callback_data: 'UpdateTrackingCode' }],
              [{ text: '🎉 Вступить в Чат 📥', url: chats.mediumLevel.url }],
              [{ text: '« Назад', callback_data: 'PrivateChat' }],
            ],
          },
        });

        await startPaymentVerification(bot, chatId, user.userId);
        return;
      }

      const formattedDate = new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(subscriptionExpiresAt);

      await bot.sendMessage(chatId, `✅ Ваша подписка активна до: <b>${formattedDate}</b>.`, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎉 Вступить в Чат 📥', url: chats.mediumLevel.url }],
            [{ text: '« Назад', callback_data: 'PrivateChat' }],
          ],
        },
      });
      return;
    }

    const { payLink, trackingCode, monthlyAmount } = await generatePayLink(user.connectedWallet, chatId);
    const qrCodeBuffer = await QRCode.toBuffer(payLink, { width: 300 });

    await bot.sendPhoto(chatId, qrCodeBuffer, {
      caption: `💰 Для доступа вам необходимо оплатить ежемесячную плату в размере **${monthlyAmount} $SC**.\n` +
               `🔑 Код отслеживания: \`${trackingCode}\`\n` +
               `🕒 Срок оплаты: 5 минут\n\n❗️Важно! Не закрывайте это меню во время Оплаты.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💸 Отправить 💎', url: payLink }],
          [{ text: '🔄 Обновить Код 📄', callback_data: 'UpdateTrackingCode' }],
          [{ text: '🎉 Вступить в Чат 📥', url: chats.mediumLevel.url }],
          [{ text: '« Назад', callback_data: 'PrivateChat' }],
        ],
      },
    });

    await startPaymentVerification(bot, chatId, user.userId);
  } catch (error) {
    console.error('Error in handleMonthlyChatMenu:', error);
    await bot.sendMessage(chatId, 'Произошла ошибка при обработке подписки.');
  }
}

async function handleUpdateTrackingCode(chatId, messageId, bot) {
  try {
    if (messageId) {
      await bot.deleteMessage(chatId, messageId);
    }

    const user = await User.findOne({ userId: chatId });

    if (!user || !user.connectedWallet) {
      await bot.sendMessage(
        chatId,
        '❌ У вас не подключен кошелек. Пожалуйста, подключите кошелек, чтобы продолжить.'
      );
      return;
    }

    const now = new Date();
    const subscriptionExpiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;

    if (subscriptionExpiresAt && subscriptionExpiresAt > now) {
      const remainingTime = subscriptionExpiresAt - now;
      const oneDay = 24 * 60 * 60 * 1000;

      if (remainingTime < oneDay) {
        const { payLink, trackingCode, monthlyAmount } = await generatePayLink(user.connectedWallet, chatId);
        const qrCodeBuffer = await QRCode.toBuffer(payLink, { width: 300 });

        await bot.sendPhoto(chatId, qrCodeBuffer, {
          caption: `⏳ Ваша подписка истекает менее чем через 1 день.\n` +
                   `💰 Вы можете продлить её, оплатив **${monthlyAmount} $SC**.\n` +
                   `🔑 Код отслеживания: \`${trackingCode}\`\n\n❗️Важно! Не закрывайте это меню во время Оплаты.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💸 Отправить 💎', url: payLink }],
              [{ text: '🔄 Обновить Код 📄', callback_data: 'UpdateTrackingCode' }],
              [{ text: '🎉 Вступить в Чат 📥', url: chats.mediumLevel.url }],
              [{ text: '« Назад', callback_data: 'PrivateChat' }],
            ],
          },
        });

        await startPaymentVerification(bot, chatId, user.userId);
        return;
      }

      const formattedDate = new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(subscriptionExpiresAt);

      await bot.sendMessage(chatId, `✅ Ваша подписка активна до: <b>${formattedDate}</b>.`, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎉 Вступить в Чат 📥', url: chats.mediumLevel.url }],
            [{ text: '« Назад', callback_data: 'PrivateChat' }],
          ],
        },
      });
      return;
    }

    const { payLink, trackingCode, monthlyAmount } = await generatePayLink(user.connectedWallet, chatId);
    const qrCodeBuffer = await QRCode.toBuffer(payLink, { width: 300 });

    await bot.sendPhoto(chatId, qrCodeBuffer, {
      caption: `💰 Для доступа вам необходимо оплатить ежемесячную плату в размере **${monthlyAmount} $SC**.\n` +
               `🔑 Новый код отслеживания: \`${trackingCode}\`\n` +
               `🕒 Срок оплаты: 5 минут\n\n❗️Важно! Не закрывайте это меню во время Оплаты.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💸 Отправить 💎', url: payLink }],
          [{ text: '🔄 Обновить Код 📄', callback_data: 'UpdateTrackingCode' }],
          [{ text: '🎉 Вступить в Чат 📥', url: chats.mediumLevel.url }],
          [{ text: '« Назад', callback_data: 'PrivateChat' }],
        ],
      },
    });

    await startPaymentVerification(bot, chatId, user.userId);
  } catch (error) {
    console.error('Error in handleUpdateTrackingCode:', error);
    await bot.sendMessage(chatId, 'Произошла ошибка при обновлении кода.');
  }
}
module.exports = {
  handleProfile,
  handleDisconnectWallet,
  handleWalletConnection,
  handlePrivateChat,
  handleUpdateTrackingCode,
  handleMonthlyChatMenu
};