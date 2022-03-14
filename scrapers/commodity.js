const request = require("request-promise")
const cheerio = require("cheerio");
const { InvestingModel } = require("../mongodb");

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
                        symbol: getSymbolFromName(commodityName),
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
}

function getSymbolFromName(name) {
    switch (name) {
        case "Gold":
            return "XAU";
        case "Platinum":
            return "XPT";
        case "Palladium":
            return "XPD";
        case "Silver":
            return "XAG";
        default:
            return name;
    }
}

module.exports.GetCommodityPrices = getCommodityPrices;