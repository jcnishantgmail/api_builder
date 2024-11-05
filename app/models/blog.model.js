var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {

      title: String,
      description: String,
      image: String,
      meta_desc:String,
      meta_title:String,
      meta_keywords:Array,
      slug:String,
      status: { type: "String", enum: ["active", "deactive"], default: "active" },
      addedBy: { type: Schema.Types.ObjectId, ref: "users", },
      isDeleted: { type: Boolean, default: false },
      createdAt: Date,
      updatedAt: Date,
    },
    { timestamps: true }
  );
  const blog = mongoose.model("blog", schema);

  return blog;
};






