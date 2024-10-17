var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    start: {type: Number},
    end: {type: Number},
    amount: {type: Number, default: 0},
    isDeleted: {type: Boolean, default: false}
  });

  const travel_rates = mongoose.model("travel_rates", schema);

  return travel_rates;
};






