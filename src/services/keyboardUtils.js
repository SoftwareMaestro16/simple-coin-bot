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
            { text: 'Blum 🗃', url: 'https://t.me/blum/app?startapp=memepadjetton_LUDOMAN_hFG7q-ref_Y9kokQfbIr'},
            { text: 'STON.fi 💎', url: 'https://app.ston.fi/swap?chartVisible=false&chartInterval=1w&ft=TON&tt=EQDbKihXMZuNfl7m7VcNrHIyYYYgCFPhccIqNN_ocNn-PBCb'},
            { text: 'BigPump ▶️', url: 'https://t.me/pocketfi_bot/bigpump?startapp=vlady_uk_8859-eyJjb2luSWQiOiI4NDEzNiJ9'},
          ]
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