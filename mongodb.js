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

function disconnectFromMongoDB() { 
    mongoose.disconnect();
    console.log("Disconnected from db.");
}

const ExchangeModel = mongoose.model(
    "exchange", 
    mongoose.Schema({
        from_exchange: String,
        to_exchange: String,
        exchange_rate: Number,
        created_at: Date
    }, {
        versionKey: false
    }
));

const InvestingModel = mongoose.model(
  "investing",
  mongoose.Schema({
      _id: mongoose.Schema({
          symbol: String,
          type: String
      }, { _id : false }),
      name: String,
      price: Number,
      created_at: Date
  }, {
    versionKey: false
  }
));

module.exports.InvestingModel = InvestingModel;
module.exports.ExchangeModel = ExchangeModel;
module.exports.connectToMongoDB = connectToMongoDB;
module.exports.disconnectFromMongoDB = disconnectFromMongoDB;