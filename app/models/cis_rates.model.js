var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    rate: {type: Number, default: 0}
  });

  const cis_rates = mongoose.model("cis_rates", schema);

  return cis_rates;
};






