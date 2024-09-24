var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {

      title: String,
      description: String,
      images: Array,
      completed_images: {type: Array, default: []},
      status: { type: "String", enum: ["pending", "in-progress" ,"completed", "cancelled"], default: "pending" },
      addedBy: { type: Schema.Types.ObjectId, ref: "users", },
      contractor: { type: Schema.Types.ObjectId, ref: "users", },
      client: { type: Schema.Types.ObjectId, ref: "users", },
      property: { type: Schema.Types.ObjectId, ref: "properties", },
      isDeleted: { type: Boolean, default: false },
      estimate:{type:Number,default:0},
      material:{type:Array,default:[]},
      serviceTime:{type:Number,defult:0}, //Saved in minutes
      total:{type:Number,defult:0},
      contractorAmount:{type:Number},
      hours:{type:String},
      minutes:{type:String},
      urgency: {type:String},
      special_instruction: {type:String},
      invoiceStatus:{type:String},
      preferedTime:{type:Date},
      createdAt: Date,
      updatedAt: Date,
    },
    { timestamps: true }
  );
  const jobs = mongoose.model("jobs", schema);

  return jobs;
};






