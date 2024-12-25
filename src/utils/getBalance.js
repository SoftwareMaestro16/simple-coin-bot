const axios = require('axios');
const LUDOMAN_ADDRESS = 'EQDbKihXMZuNfl7m7VcNrHIyYYYgCFPhccIqNN_ocNn-PBCb';

async function getData(wallet) {
  try {
    const response = await axios.get(
      `https://tonapi.io/v2/accounts/${wallet}/jettons/${LUDOMAN_ADDRESS}?currencies=ton,usd,rub&supported_extensions=custom_payload`
    );
    return getBalance(response.data); 
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function getBalance(data) {
  if (data && data.balance) {
    return data.balance / 10 ** 9; 
  } else {
    console.error('Balance not found in the response data.');
    return null; 
  }
}

module.exports = {
  getData,
  getBalance,
};