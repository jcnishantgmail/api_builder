var Mongoose = require("mongoose"),
Schema = Mongoose.Schema;

module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      name: String,
      // role: { type: String, enum: ["admin", "customer"], default: "customer" },
      permissions: { type: Array },
      isEditable: { type: Boolean, default: true },
      isDeleteAble: { type: Boolean, default: true },
      loginPortal: { type: String, default: "front" },
      status: { type: String, enum: ['active', 'deactive'], default: 'active', },

      addedBy: { type: Schema.Types.ObjectId, ref: "users" },
      isDeleted: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date },
    },
    { timestamps: true }
  );

  const roles = mongoose.model("roles", schema);

  return roles;
};
