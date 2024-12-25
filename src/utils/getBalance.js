const axios = require('axios');
const LUDOMAN_ADDRESS = 'EQDbKihXMZuNfl7m7VcNrHIyYYYgCFPhccIqNN_ocNn-PBCb';

async function getData(wallet) {
  try {
    const response = await axios.get(
      `https://tonapi.io/v2/accounts/${wallet}/jettons/${LUDOMAN_ADDRESS}?currencies=ton,usd,rub&supported_extensions=custom_payload`
    );

    if (response.data) {
      return getBalance(response.data);
    }

    console.warn('Empty response from API.');
    return 0; 
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // console.warn(`Wallet ${wallet} has no Jetton wallet.`);
      return 0; 
    }

    console.error('Error fetching data:', error.message || error);
    return 0; 
  }
}

function getBalance(data) {
  if (data && data.balance) {
    return data.balance / 10 ** 9;
  }

  console.warn('Balance not found or invalid in the response data.');
  return 0; 
}

module.exports = {
  getData,
  getBalance,
};