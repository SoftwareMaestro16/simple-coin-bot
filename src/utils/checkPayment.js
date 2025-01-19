const axios = require('axios');
const { toUserFriendlyAddress } = require('@tonconnect/sdk');

/**
 * @param {string} walletAddress - Адрес кошелька пользователя.
 * @param {string} expectedComment - Ожидаемый комментарий (trackingCode).
 * @returns {Promise<boolean>} - Возвращает true, если оплата найдена.
 */
async function checkPaymentInBlockchain(walletAddress, expectedComment) {
  if (!walletAddress) {
    console.error('Ошибка: адрес кошелька не предоставлен.');
    return false;
  }

  const url = `https://testnet.tonapi.io/v2/accounts/${walletAddress}/events?limit=25`;
  console.log(`Запрос URL: ${url}`); 

  try {
    const { data } = await axios.get(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    const events = data.events || [];

    for (const event of events) {
      if (event.actions) {
        for (const action of event.actions) {
          if (action.type === 'JettonTransfer' && action.status === 'ok') {
            const { comment } = action.JettonTransfer || {};
            if (comment === expectedComment) {
              console.log(`Совпадение найдено: ${comment}`);
              return true;
            }
          }
        }
      }
    }

    console.log('Совпадений не найдено.');
    return false;
  } catch (error) {
    console.error(`Ошибка при проверке транзакции в блокчейне: ${error.message}`);
    if (error.response) {
      console.error('Детали ошибки:', error.response.data);
    }
    return false;
  }
}

module.exports = {
  checkPaymentInBlockchain,
};