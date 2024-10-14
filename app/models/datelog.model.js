var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const schema = mongoose.Schema({
    job: {type: Schema.Types.ObjectId, ref: "jobs"},
    contractor: {type: Schema.Types.ObjectId, ref: "users"},
    date: {type: String, required: true},
    hours:{type:Number},
    minutes:{type:Number},
    material:{type:Array,default:[]},
    distance_travelled: {type: Number, default: 0},
    completed_images: {type: Array, default: []},
    createdAt: Date,
    updatedAt: Date
  });

  const datelog = mongoose.model("datelog", schema);

  return datelog;
};






