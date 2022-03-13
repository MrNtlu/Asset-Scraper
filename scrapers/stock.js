const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const AnonymousPlugin = require('puppeteer-extra-plugin-anonymize-ua');
const cheerio = require("cheerio");
const { InvestingModel, DisconnectFromMongoDB } = require('../mongodb');

async function getStocks() {
    const baseURL = "https://www.investing.com/equities/StocksFilter?index_id=";
    const smIndexList = [172, 19155, 167, 27, 176, 178, 179, 38017, 40820];
    const smIndexNameList = ["DAX", "BIST 100", "CAC 40", "FTSE 100", "SMI", "Nikkei 225", "Hang Seng", "Taiwan Weighted", "Shanghai Composite"];
    const smIndexCurrencyList = ["EUR", "TRY","EUR", "GBP", "CHF", "JPY", "HKD", "TWD", "CNY"]
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

    console.log(stockList);
}

async function getStocksData(url, stockCurrency, stockMarket, stockList, isRefreshed = false) {
    try {
        const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox"] });
        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForSelector('#cross_rate_markets_stocks_1');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const html = await page.content();
        const $ = cheerio.load(html);

        //".marketInnerContent > table > tbody > tr"
        $("#cross_rate_markets_stocks_1 > tbody > tr").each((_, element) => {
            stockList.push(InvestingModel({
                _id: {
                    symbol: stockCurrency,
                    type: "stock"
                },
                stock_market: stockMarket,
                name: $(element).find("a").text().trimEnd().trimStart(),
                price: parseFloat($($(element).find("td")[2]).text().trimEnd().trimStart()),
                created_at: new Date()
            }));
        });
        await browser.close();
    } catch (error) {
        console.log(error);
        if (!isRefreshed) {
            console.log("Refreshed");
            await getStocksData(url, stockCurrency, stockMarket, stockList, true);
            return;
        } 
        return;
    }
}

async function getStockSymbol(url, stockList, index, isRefreshed = false) {
    // for (let index = 0; index < stockList.length; index++) {
    //     await getStockSymbol(stockList[index]._id.symbol, stockList, index);
    // }
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const baseURL = "https://www.investing.com";
    try {
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9'
        });
        await page.goto(baseURL + url);
        await page.waitForSelector('.text-2xl');
        await page.waitForNavigation({
            waitUntil: 'networkidle0',
        });
        const html = await page.content();
        const $ = cheerio.load(html);
        
        console.log("URL ", url);
        var symbol;
        try {
            symbol = $("h1.text-2xl").text().split("(")[1].replace(")", '').trimStart().trimEnd();
        } catch (error) {
            symbol = $("h1").text().split("(")[1].replace(")", '').trimStart().trimEnd();
        }
        await browser.close()
        stockList[index]._id.symbol = symbol;
    } catch (error) {
        console.log(error);
        if (!isRefreshed) {
            console.log("Refreshed");
            await getStockSymbol(url, stockList, index, true);
            return;
        } 
        return;
    }
}

module.exports.GetStocks = getStocks;