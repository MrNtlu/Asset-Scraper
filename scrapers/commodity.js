const request = require("request-promise")
const cheerio = require("cheerio");
const { InvestingModel } = require("../mongodb");

const commodityList = ["Gold", "Platinum", "Palladium", "Silver"];

async function getCommodityPrices(investingList) {    
    const result = await request.get("https://markets.businessinsider.com/commodities");
    const $ = cheerio.load(result);

    const tempCommodityCheckerList = []
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
            if (commodityList.indexOf(commodityName) > -1) {
                tempCommodityCheckerList.push(commodityName);
                investingList.push(
                    InvestingModel({
                        _id: {
                            symbol: getSymbolFromName(commodityName),
                            type: "commodity",
                            market: "Business Insider"
                        },
                        name: commodityName,
                        price: commodityPrice,
                        created_at: new Date()
                    })
                );   
            }
        });
    });

    if (tempCommodityCheckerList.length == commodityList.length) {
        await InvestingModel.deleteMany({
            "_id.type": { $in: ["exchange", "commodity"]}
        });
    } else {
        await InvestingModel.deleteMany({
            "_id.type": { $in: ["exchange"]}
        });
    }
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