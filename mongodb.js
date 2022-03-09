const mongoose = require("mongoose")
require('dotenv').config()

async function connectToMongoDB() {
    await mongoose.connect(
        process.env.MONGO_LOCAL_URI, 
        { 
            useNewUrlParser: true
        }
    );
}

const ExchangeModel = mongoose.model(
    "exchange", 
    mongoose.Schema({
        from_exchange: String,
        to_exchange: String,
        exchange_rate: Number
    }
));

const InvestingModel = mongoose.model(
  "investing",
  mongoose.Schema({
      _id: mongoose.Schema({
          symbol: String,
          type: String
      }),
      name: String,
      price: Number,
      created_at: Date
  }
));

async function saveExchangeModel(fromExchange, toExchange, exchangeRate) {
    try {
        const exchangeModel = new ExchangeModel({
            from_exchange: fromExchange,
            to_exchange: toExchange,
            exchange_rate: exchangeRate
        });
        await exchangeModel.save();
    } catch (error) {
        console.log("Error occured ", error);
    }
}

async function saveInvestingModel(symbol, type, name, price) {
    try {
        const investingModel = new InvestingModel({

        });
        await investingModel.save();
    } catch (error) {
        console.log("Error occured ", error);
    }
}

module.exports = saveExchangeModel;
module.exports.connectToMongoDB = connectToMongoDB;