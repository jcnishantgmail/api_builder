var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;
module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      name: String,
      address: String,
      address2:String,
      state: String,
      city: String,
      country:String,
      zipCode:String,
      image:String,
      status: { type: String, default: "active" },
      addedBy: { type: Schema.Types.ObjectId, ref: "users", },
      isDeleted: { type: Boolean, default: false },
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

  const properties = mongoose.model("properties", schema);
  return properties;
};
