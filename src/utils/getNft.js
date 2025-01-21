const axios = require('axios');
const COLLECTION_ADDRESS = 'EQCJy4Dfd0HNDnGoD7vPVL-THzwqOoaICgz46wqe54W_uHy8'; 

async function getNft(wallet) {
    return axios
    .get(`https://tonapi.io/v2/accounts/${wallet}/nfts?collection=${COLLECTION_ADDRESS}&limit=1000&offset=0&indirect_ownership=false`)
    .then(response => response.data.nft_items || []) 
    .catch(error => {
        console.error("Error fetching NFTs:", error);
        return []; 
    });
}

module.exports = {
    getNft
}