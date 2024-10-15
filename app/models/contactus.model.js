var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    firstName: {type: String, default: ''},
    lastName: {type: String, default: ''},
    email: {type: String, default: ''},
    message: {type: String, default: ''},
    createdAt: Date,
    updatedAt: Date
  },{timestamps: true});

  const contactus = mongoose.model("contactus", schema);

  return contactus;
};






