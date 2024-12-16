var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    job: {type: Schema.Types.ObjectId, ref: "jobs"},
    contractor: {type: Schema.Types.ObjectId, ref: "users"},
    date: {type: Date, required: true},
    material: {type: Schema.Types.ObjectId, ref: "materials"},
    materialName: {type: String, default: ""},
    price: {type: Number, default: 0},
    isCustom: {type: Boolean, default: false},
    quantity: {type: Number, default: 0},
    isDeleted: {type: Boolean, default: false},
    createdAt: Date,
    updatedAt: Date
  });

  const materialDatelogs = mongoose.model("materialDatelogs", schema);

  return materialDatelogs;
};






