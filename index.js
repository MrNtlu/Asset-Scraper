const request = require("request-promise")
const cheerio = require("cheerio")

async function getCommodityPrices() {
    commodityPriceList = [];
    
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
            commodityPriceList.push({
                "name": commodityName,
                "price": commodityPrice
            });
        });
    });

    console.log(commodityPriceList);
}

async function getExchangeRates() {
    exchangeList = [];
    exchangePriceList = [];

    const result = await request.get("https://www.forex-ratings.com/currency-exchange-rates/");
    const $ = cheerio.load(result);

    $(".list-group > .list-group-item").each((index, element) => {
        exchangeList.push($(element).text().split("(")[1].replace(")", ''));
    });

    for (const index in exchangeList) {
        const rateResult = await request.get("https://www.forex-ratings.com/currency-exchange-rates/"+exchangeList[index]);
        const $ = cheerio.load(rateResult);

        $("table").each((index, element) => {
            if (index == 0) {
                $(element).find("tbody > tr").each((_, innerElement) => {
                    var exchangeName;
                    var exchangeSymbol;
                    var exchangeRate;
                    $(innerElement).find("td").each((i, e) => {
                        const itemText = $(e).text();
                        if (i == 0) {
                            exchangeName = itemText.split("(")[0].trimEnd();
                            exchangeSymbol = itemText.split("(")[1].replace(")", '');
                        } else if (i == 2) {
                            exchangeRate = parseFloat(itemText.split(" ")[0]);
                        }
                    });
                    exchangePriceList.push({
                        "name": exchangeName,
                        "from": exchange,
                        "to": exchangeSymbol,
                        "exchange_rate": exchangeRate
                    });
                });
            }
        });
    }

    console.log(exchangePriceList);
}

getCommodityPrices();
getExchangeRates();