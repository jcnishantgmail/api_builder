var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;
module.exports = (mongoose) => {
  var hourlyRateLogSchema = mongoose.Schema({
    hourlyRate: {type: Number, default: 0},
    rateUpdatedAt: Date
  });
  
  var schema = mongoose.Schema(
    {
      firstName: String,
      lastName: String,
      fullName: String,
      email: String,
      password: String,
      verificationCode: String,
      dialCode: String,
      mobileNo: String,
      image: {type: Array, default: []},
      address: String,
      address2:{type:String},
      company:{type:String},
      zipCode:{type:String},
      city: String,
      state: String,
      country: String,
      pinCode: String,
      verification_otp: String,
      loginPortal:String,
      hourlyRate:{type:Number,defult:0},
      hourlyRateLog: [hourlyRateLogSchema],
      skills:[{ type: Schema.Types.ObjectId, ref: 'skills' }],
      addedType:{ type: String, enum: ["self", "admin"],  default: "self" },
      isVerified: { type: String, default: "N" },
      role: { type: Schema.Types.ObjectId, ref: "roles", },
      status: { type: String, default: "active" },
      stripe_subscriptionId: String,
      addedBy: { type: Schema.Types.ObjectId, ref: "users", },
      isDeleted: { type: Boolean, default: false },
      createdAt: Date,
      updatedAt: Date,
      certificate: {type: Array, default: []},
      cis_rate: {type: Schema.Types.ObjectId, ref: 'cis_rates'},
      website: {type: String},
      vat_number: {type: Number}
      // social login keys
      // facebookId: {
      //   type: "string",
      // },
      // googleId: {
      //   type: "string",
      // },
      // appleId: {
      //   type: "string",
      // },

    },
    { timestamps: true }
  );

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Users = mongoose.model("users", schema);
  return Users;
};
