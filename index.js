const request = require("request-promise")
const cheerio = require("cheerio");
const { connectToMongoDB } = require("./mongodb");
const saveExchangeModel = require("./mongodb");

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

    $(".list-group > .list-group-item").each((_, element) => {
        exchangeList.push($(element).text().split("(")[1].replace(")", ''));
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

                    saveExchangeModel(exchangeList[index], exchangeSymbol, exchangeRate);
                });
            }
        });
    }

    console.log(exchangeList);
}

/*TODO: 
Save exchange list to database
Save commodity to investings
*/

async function main() {
    await connectToMongoDB();

    getCommodityPrices();
    getExchangeRates();
}

main();