const { TonConnect } = require('@tonconnect/sdk');
const QRCode = require('qrcode');

class CustomStorage {
  constructor() {
    this.store = new Map();
  }

  async getItem(key) {
    return this.store.get(key) || null;
  }

  async setItem(key, value) {
    this.store.set(key, value);
  }

  async removeItem(key) {
    this.store.delete(key);
  }
}

function getConnector(chatId) {
  console.log(`Creating connector for chatId: ${chatId}`);
  return new TonConnect({
    manifestUrl: 'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json',
    storage: new CustomStorage(),
  });
}

const generateQRCode = async (link) => {
  return await QRCode.toBuffer(link, { width: 300 });
};

module.exports = { getConnector, generateQRCode };