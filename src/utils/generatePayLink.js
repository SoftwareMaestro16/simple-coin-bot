const { SIMPLE_COIN_ADDRESS } = require("./getBalance");
const { getCollector, setPaymentTrackingCode } = require("../db.js");

const prefix = {
  "Tonkeeper": 'https://app.tonkeeper.com/',
  "MyTonWallet": 'ton://',
  "Tonhub": 'https://tonhub.com/'
};

function generateRandomText(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generatePayLink(walletApp, userId) {
  try {
    const appPrefix = prefix[walletApp];
    if (!appPrefix) {
      throw new Error(`Unsupported wallet app: ${walletApp}`);
    }

    const collector = await getCollector();
    if (!collector || !collector.collectorAddress) {
      throw new Error('Collector address is not set.');
    }

    if (!collector.monthlyAmount || collector.monthlyAmount <= 0) {
      throw new Error('Monthly amount is not set or invalid.');
    }

    const randomText = generateRandomText();
    const amount = collector.monthlyAmount * 10 ** 9;

    const payLink = `${appPrefix}transfer/${collector.collectorAddress}?jetton=${SIMPLE_COIN_ADDRESS}&amount=${amount}&text=${randomText}`;

    await setPaymentTrackingCode(userId, randomText);

    console.log('Generated Pay Link:', payLink);

    return { payLink, trackingCode: randomText, monthlyAmount: collector.monthlyAmount };
  } catch (error) {
    console.error('Error generating payment link:', error.message);
    throw new Error('Failed to generate payment link. Please try again later.');
  }
}

module.exports = {
  generatePayLink
};