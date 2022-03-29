const request = require("request-promise");
const { InvestingModel } = require("../mongodb");

async function getCryptoCurrencies() {
    cryptoList = [];

    const apiURL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?CMC_PRO_API_KEY=${process.env.CMC_KEY}&limit=300`
    const result = await request(apiURL);


    try {
        const jsonList = JSON.parse(result);

        jsonList["data"].forEach(cryptoData => {
            cryptoList.push(
                InvestingModel({
                    _id: {
                        symbol: cryptoData["symbol"],
                        type: "crypto",
                        market: "CoinMarketCap"
                    },
                    name: cryptoData["name"],
                    price: cryptoData["quote"]["USD"]["price"],
                    created_at: new Date()
                })
            );
        });

        const session = await InvestingModel.startSession();
        await session.withTransaction(async () => {
            await InvestingModel.deleteMany({
                "_id.type": "crypto"}
            );
            await InvestingModel.insertMany(cryptoList, {
                ordered: false
            });
        });
        session.endSession();
    } catch(error) {
        console.log("Error occured", error);
        return;
    }
}

module.exports.GetCryptoCurrencies = getCryptoCurrencies;