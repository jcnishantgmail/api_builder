var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    rate: {type: Number},
    isDeleted: {type: Boolean, default: false}
  }, 
  {
    timestamps: true
  });

  const vats = mongoose.model("vats", schema);

  return vats;
};






