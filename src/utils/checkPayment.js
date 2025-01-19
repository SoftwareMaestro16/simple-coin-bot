const axios = require('axios');
const { Address } = require('@ton/core');
const { SIMPLE_COIN_ADDRESS } = require('./getBalance');
const { getCollector } = require("../db.js");

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

  const collector = await getCollector();
  if (!collector || !collector.collectorAddress) {
    console.error('Collector address is not set in the database.');
    return false;
  }

  const collectorAddress = Address.parse(collector.collectorAddress);

  const url = `https://testnet.tonapi.io/v2/accounts/${walletAddress}/events?limit=25`;
  console.log(`Запрос URL: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    const events = data.events || [];
    const simpleCoinAddress = Address.parse(SIMPLE_COIN_ADDRESS); 

    for (const event of events) {
      if (event.actions) {
        for (const action of event.actions) {
          if (action.type === 'JettonTransfer' && action.status === 'ok') {
            const { comment, jetton, recipient } = action.JettonTransfer || {};
            const jettonAddress = jetton?.address ? Address.parse(jetton.address) : null;
            const recipientAddress = recipient?.address ? Address.parse(recipient.address) : null;

            if (
              jettonAddress &&
              jettonAddress.equals(simpleCoinAddress) && 
              recipientAddress &&
              recipientAddress.equals(collectorAddress) && 
              comment === expectedComment
            ) {
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