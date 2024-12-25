const { WalletsListManager, isWalletInfoRemote } = require('@tonconnect/sdk');

const walletsListManager = new WalletsListManager({
    cacheTTLMs: Number(process.env.WALLETS_LIST_CACHE_TTL_MS) || 3600000
});

async function getWallets() {
    try {
        const wallets = await walletsListManager.getWallets();
        return wallets.filter(isWalletInfoRemote);
    } catch (error) {
        console.error('Error fetching wallets:', error);
        return [];
    }
}

async function getWalletInfo(walletAppName) {
    try {
        const wallets = await getWallets();
        return wallets.find(wallet => wallet.appName.toLowerCase() === walletAppName.toLowerCase());
    } catch (error) {
        console.error(`Error fetching wallet info for ${walletAppName}:`, error);
        return undefined;
    }
}

module.exports = {
    getWallets,
    getWalletInfo
};