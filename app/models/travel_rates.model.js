var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    start: {type: Number, unique: true},
    end: {type: Number, unique: true},
    amount: {type: Number, default: 0}
  });

  const travel_rates = mongoose.model("travel_rates", schema);

  return travel_rates;
};






