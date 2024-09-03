var Mongoose = require("mongoose"),
Schema = Mongoose.Schema;
module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      name: String,
      slug:String,
      image: String,
      type: { type: String, enum: ["parent", "child"], default: "parent" },
      categoryId: { type: Schema.Types.ObjectId, ref: "categories", index: true },
      status: { type: String, default: "active" },
      addedBy: { type: Schema.Types.ObjectId, ref: "users", index: true },
      isDeleted: { type: Boolean, default: false, index: true },
      createdAt: Date,
      updatedAt: Date,
    },
    { timestamps: true }
  );

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Categories = mongoose.model("categories", schema);
  return Categories;
};
