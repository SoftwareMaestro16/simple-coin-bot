const axios = require('axios');
const SIMPLE_COIN_ADDRESS = 'EQB9QBqniFI0jOmw3PU6v1v4LU3Sivm9yPXDDB9Qf7cXTDft'; // EQB9QBqniFI0jOmw3PU6v1v4LU3Sivm9yPXDDB9Qf7cXTDft

async function getData(wallet) {
  try {
    const response = await axios.get(`https://tonapi.io/v2/accounts/${wallet}/jettons/${SIMPLE_COIN_ADDRESS}`);

    if (response.data && response.data.balance) {
      return response.data.balance / 10 ** 9;
    }

    // console.warn(`Jetton not found for wallet ${wallet}.`);
    return 0; 
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        console.error('404 Not Found: Jetton or wallet does not exist.');
        return 0;
      }
      if (error.response.status === 429) {
        console.warn('Rate limit exceeded. Retrying...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return getData(wallet);
      }
    }
    throw error; 
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
  SIMPLE_COIN_ADDRESS
};
