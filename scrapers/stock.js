const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-block-resources');
const AnonymousPlugin = require('puppeteer-extra-plugin-anonymize-ua');
const cheerio = require("cheerio");
const { InvestingModel } = require('../mongodb');

async function getStocks() {
    const baseURL = "https://www.investing.com/equities/StocksFilter?index_id=";
    const smIndexList = [20, 166, 169, 172, 19155, 167, 27, 176, 178, 179, 38017, 40820];
    const smIndexNameList = ["Nasdaq 100", "S&P 500", "Dow Jones Industrial Average", "DAX", "BIST 100", "CAC 40", "FTSE 100", "SMI", "Nikkei 225", "Hang Seng", "Taiwan Weighted", "Shanghai Composite"];
    const smIndexCurrencyList = ["USD", "USD", "USD", "EUR", "TRY","EUR", "GBP", "CHF", "JPY", "HKD", "TWD", "CNY"]
    const stockList = [];

    puppeteer.use(StealthPlugin());
    puppeteer.use(AdblockerPlugin());
    puppeteer.use(AnonymousPlugin());

    for (let index = 0; index < smIndexList.length; index++) {
        await getStocksData(
            baseURL + smIndexList[index].toString(),
            smIndexCurrencyList[index],
            smIndexNameList[index],
            stockList
        );
    }

    const session = await InvestingModel.startSession();
    await session.withTransaction(async () => {
        await InvestingModel.deleteMany({
            "_id.type": "stock"
        });
        await InvestingModel.insertMany(stockList, {
            ordered: false
        });
    });
    session.endSession();
}

async function getStocksData(url, stockCurrency, stockMarket, stockList, isRefreshed = false) {
    try {
        const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForSelector('#cross_rate_markets_stocks_1');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const html = await page.content();
        const $ = cheerio.load(html);

        //".marketInnerContent > table > tbody > tr"
        $("#cross_rate_markets_stocks_1 > tbody > tr").each((_, element) => {
            const stockName = $(element).find("a").text().trimEnd().trimStart();
            stockList.push(InvestingModel({
                _id: {
                    symbol: stockName,
                    type: "stock",
                    stock_currency: stockCurrency,
                    market: stockMarket,
                },
                name: stockName,
                price: parseFloat($($(element).find("td")[2]).text().trimEnd().trimStart()),
                created_at: new Date()
            }));
        });
        await browser.close();
    } catch (error) {
        console.log("\nURL: ",url,"\nStock Currency:",stockCurrency,"\nStock Market:",stockMarket);
        console.log("GetStocksData Error",error);
        if (!isRefreshed) {
            console.log("Refreshed");
            await getStocksData(url, stockCurrency, stockMarket, stockList, true);
            return;
        } 
        return;
    }
}

module.exports.GetStocks = getStocks;