function generateMainKeyboard(address) {
  return address
      ? [
          [
            { text: 'Профиль 👤', callback_data: 'Profile' },
          ],
          [
            { text: 'Приватный Чат 🌟', callback_data: 'PrivateChat' },
          ],
          [
            { text: '🟨 DeDust', url: 'https://dedust.io/swap/TON/EQB9QBqniFI0jOmw3PU6v1v4LU3Sivm9yPXDDB9Qf7cXTDft' },
            { text: 'GetGems 💎', url: 'https://getgems.io/collection/EQCJy4Dfd0HNDnGoD7vPVL-THzwqOoaICgz46wqe54W_uHy8' },
          ],
        ]
      : [
          [
            { text: 'Tonkeeper', callback_data: 'Tonkeeper' },
            { text: 'MyTonWallet', callback_data: 'MyTonWallet' },
            { text: 'TonHub', callback_data: 'TonHub' },
          ],
        ];
}
  
function generateProfileKeyboard(address) {
  return {
    inline_keyboard: address === 'Не Подключен'
      ? [
          [
            { text: 'Tonkeeper', callback_data: 'Tonkeeper' },
            { text: 'MyTonWallet', callback_data: 'MyTonWallet' },
            { text: 'TonHub', callback_data: 'TonHub' },
          ],
        ]
      : [
          [
            { text: 'Отключить Кошелек 💥', callback_data: 'DisconnectWallet' },
          ],
          [
            { text: '« Назад', callback_data: 'BackToMenu' },
          ],
        ],
  };
}
  
module.exports = { generateMainKeyboard, generateProfileKeyboard };