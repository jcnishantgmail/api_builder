var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    job: {type: Schema.Types.ObjectId, ref: "jobs"},
    date: {type: Date, required: true},
    hours:{type:Number},
    minutes:{type:Number},
    completed_images: {type: Array, default: []},
    labour_charge: {type: Number, default: 0},
    isDeleted: {type: Boolean, default: false},
    createdAt: Date,
    updatedAt: Date
  },
  {
    timestamps: true   
  });

  const serviceDatelogs = mongoose.model("serviceDatelogs", schema);

  return serviceDatelogs;
};






