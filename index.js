const { ConnectToMongoDB, DisconnectFromMongoDB } = require("./mongodb");
const { GetStocks } = require("./scrapers/stock");
const { GetExchangeRates } = require("./scrapers/exchange");

async function main() {
    try{
        await ConnectToMongoDB();
        await GetExchangeRates();
        await GetStocks();
        await DisconnectFromMongoDB();
    } catch(err) {
        console.log('Error occured', err);
    }
}

main();
