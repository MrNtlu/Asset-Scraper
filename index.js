const request = require("request-promise")
const cheerio = require("cheerio");
const { connectToMongoDB, ExchangeModel, InvestingModel, disconnectFromMongoDB } = require("./mongodb");

async function getCommodityPrices(investingList) {    
    const result = await request.get("https://markets.businessinsider.com/commodities");
    const $ = cheerio.load(result);

    $($(".table")[1]).each((_, element) => {
        $(element).find($('tbody > tr')).each((_, innerElement) => {
            var commodityName;
            var commodityPrice;
            $(innerElement).find("td").each((index, e) => {
                if (index == 0) {
                    commodityName = $(e).text().trim();
                } else if (index == 1) {
                    commodityPrice = parseFloat($(e).text().trim().replace(',', ''));
                }
            });
            investingList.push(
                InvestingModel({
                    _id: {
                        symbol: commodityName,
                        type: "commodity"
                    },
                    name: commodityName,
                    price: commodityPrice,
                    created_at: new Date()
                })
            );
        });
    });

    await InvestingModel.deleteMany({
        "_id.type": { $in: ["exchange", "commodity"]}
    });
    await InvestingModel.insertMany(investingList);
    disconnectFromMongoDB();
}

async function getExchangeRates() {
    investingExchangeList = [];
    exchangeList = [];
    exchangePriceList = [];

    const result = await request.get("https://www.forex-ratings.com/currency-exchange-rates/");
    const $ = cheerio.load(result);

    $(".list-group > .list-group-item").each((_, element) => {
        const exchangeSymbol = $(element).text().split("(")[1].replace(")", '');
        const exchangeName = $(element).text().split("(")[0].trimEnd().trimStart();
        investingExchangeList.push(
            InvestingModel({
                _id: {
                    symbol: exchangeSymbol,
                    type: "exchange"
                },
                name: exchangeName,
                price: 1,
                created_at: new Date()
            })
        );
        exchangeList.push(exchangeSymbol);
    });

    for (const index in exchangeList) {
        const rateResult = await request.get("https://www.forex-ratings.com/currency-exchange-rates/"+exchangeList[index]);
        const $ = cheerio.load(rateResult);

        $("table").each((innerIndex, element) => {
            if (innerIndex == 0) {
                $(element).find("tbody > tr").each((_, innerElement) => {
                    var exchangeSymbol;
                    var exchangeRate;
                    $(innerElement).find("td").each((i, e) => {
                        const itemText = $(e).text();
                        if (i == 0) {
                            exchangeSymbol = itemText.split("(")[1].replace(")", '');
                        } else if (i == 2) {
                            exchangeRate = parseFloat(itemText.split(" ")[0]);
                        }
                    });
                    
                    exchangePriceList.push(
                        ExchangeModel({
                            from_exchange: exchangeList[index],
                            to_exchange: exchangeSymbol,
                            exchange_rate: exchangeRate,
                            created_at: new Date()
                        })
                    );
                });
            }
        });
    }

    await ExchangeModel.deleteMany({});
    await ExchangeModel.insertMany(exchangePriceList);
    getCommodityPrices(investingExchangeList);
}

async function main() {
    try{
        await connectToMongoDB();
        await getExchangeRates();
    } catch(err) {
        console.log('Error occured', err);
    }
}

main();