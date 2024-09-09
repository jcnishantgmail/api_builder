var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {

      title: String,
      description: String,
      images: Array,
      status: { type: "String", enum: ["pending", "in-progress" ,"completed"], default: "pending" },
      addedBy: { type: Schema.Types.ObjectId, ref: "users", },
      contractor: { type: Schema.Types.ObjectId, ref: "users", },
      client: { type: Schema.Types.ObjectId, ref: "users", },
      property: { type: Schema.Types.ObjectId, ref: "properties", },
      isDeleted: { type: Boolean, default: false },
      estimate:{type:Number,default:0},
      createdAt: Date,
      updatedAt: Date,
    },
    { timestamps: true }
  );
  const jobs = mongoose.model("jobs", schema);

  return jobs;
};






