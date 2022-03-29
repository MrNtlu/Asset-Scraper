const { ConnectToMongoDB, DisconnectFromMongoDB } = require("./mongodb");
const { GetStocks } = require("./scrapers/stock");
const { GetExchangeRates } = require("./scrapers/exchange");
const { GetCryptoCurrencies } = require("./apis/cmc");

async function main() {
    try{
        await ConnectToMongoDB();
        await GetExchangeRates();
        await GetStocks();
        await GetCryptoCurrencies();
        await DisconnectFromMongoDB();
    } catch(err) {
        console.log('Error occured', err);
        return;
    }
}

main();