const axios = require('axios');
const COLLECTION_ADDRESS = 'EQCJy4Dfd0HNDnGoD7vPVL-THzwqOoaICgz46wqe54W_uHy8'; 
const COLLECTION_ADDRESS_2 = 'EQDBjly3ZW1zeEhrw9F0JvwEcvlKgB3mBS_lBWEy_w9Rmhm6'; 

async function getNft(wallet) {
    return axios
    .get(`https://tonapi.io/v2/accounts/${wallet}/nfts?collection=${COLLECTION_ADDRESS}&limit=1000&offset=0&indirect_ownership=false`)
    .then(response => response.data.nft_items || []) 
    .catch(error => {
        console.error("Error fetching NFTs:", error);
        return []; 
    });
}

async function getNft2(wallet) {
    return axios
    .get(`https://tonapi.io/v2/accounts/${wallet}/nfts?collection=${COLLECTION_ADDRESS_2}&limit=1000&offset=0&indirect_ownership=false`)
    .then(response => response.data.nft_items || []) 
    .catch(error => {
        console.error("Error fetching NFTs:", error);
        return []; 
    });
}

module.exports = {
    getNft, getNft2
}