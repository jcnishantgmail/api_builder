var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    job: {type: Schema.Types.ObjectId, ref: "jobs"},
    date: {type: String, required: true},
    hours:{type:Number},
    minutes:{type:Number},
    completed_images: {type: Array, default: []},
    servicefee: {type: Number, default: 0},
    createdAt: Date,
    updatedAt: Date
  },
  {
    timestamps: true   
  });

  const serviceDatelogs = mongoose.model("serviceDatelogs", schema);

  return serviceDatelogs;
};






