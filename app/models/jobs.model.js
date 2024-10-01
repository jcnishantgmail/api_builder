var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {

  const datewiseLogSchema = mongoose.Schema({
    date: {type: String, required: true, unique: true},
    hours:{type:Number},
    minutes:{type:Number},
    material:{type:Array,default:[]},
    contractor: { type: Schema.Types.ObjectId, ref: "users",  },
    serviceTime: {type: Number, default: 0},
    completed_images: {type: Array, default: []}
  });

  var schema = mongoose.Schema(
    {

      title: String,
      description: String,
      images: {type: Array, default: []},
      completed_images: {type: Array, default: []},
      status: { type: "String", enum: ["pending", "in-progress", "paused" ,"completed", "cancelled"], default: "pending" },
      addedBy: { type: Schema.Types.ObjectId, ref: "users", },
      contractor: { type: Schema.Types.ObjectId, ref: "users", },
      client: { type: Schema.Types.ObjectId, ref: "users", },
      property: { type: Schema.Types.ObjectId, ref: "properties", },
      isDeleted: { type: Boolean, default: false },
      isInvoiceGenerated: { type: Boolean, default: false },
      estimate:{type:Number,default:0},
      material:{type:Array,default:[]},
      category: [{type: Schema.Types.ObjectId, ref: "categories"}],
      serviceTime:{type:Number,default:0}, //Saved in minutes
      total:{type:Number,defult:0},
      contractorAmount:{type:Number},
      hours:{type:Number},
      minutes:{type:Number},
      urgency: {type:String},
      special_instruction: {type:String},
      invoiceStatus:{type:String},
      preferedTime:{type:Date},
      datelog: [datewiseLogSchema],
      createdAt: Date,
      updatedAt: Date,
    },
    { timestamps: true }
  );
  const jobs = mongoose.model("jobs", schema);

  return jobs;
};






