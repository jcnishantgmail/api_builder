var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;
module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      name: String,
      image: String,
      price:{type:Number,default:0},
      quantity:{type:Number,default:0},
      unit:{type:String},
      vat_included:{ type: Boolean, default: false },
      vat:{type:Number,default:0},
      category:{ type: Schema.Types.ObjectId, ref: "categories", },
      standAlone: { type: Boolean, default: true },     
      supplier: { type: Schema.Types.ObjectId, ref: "users", },
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

  const materials = mongoose.model("materials", schema);
  return materials;
};
