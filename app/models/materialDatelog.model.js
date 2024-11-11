var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    job: {type: Schema.Types.ObjectId, ref: "jobs"},
    date: {type: String, required: true},
    material: {type: Schema.Types.ObjectId, ref: "materials"},
    quantity: {type: Number, default: 0},
    isDeleted: {type: Boolean, default: false},
    createdAt: Date,
    updatedAt: Date
  });

  const materialDatelogs = mongoose.model("materialDatelogs", schema);

  return materialDatelogs;
};






