const request = require("request-promise")
const cheerio = require("cheerio");
const {ExchangeModel, InvestingModel}  = require("../mongodb");
const { GetCommodityPrices } = require("./commodity");

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
                    type: "exchange",
                    market: "Forex"
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
    await GetCommodityPrices(investingExchangeList);
}

module.exports.GetExchangeRates = getExchangeRates;