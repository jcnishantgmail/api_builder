var Mongoose = require("mongoose"),
  Schema = Mongoose.Schema;

module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      job: {type: Schema.Types.ObjectId, ref: "jobs"},
      contractor: {type: Schema.Types.ObjectId, ref: "users"},
      startDate: Date,
      endDate: Date,
      totalHours: {type: Number, default: 0},
      actualHours: {type: Number, default: 0},
      isDeleted: {type: Boolean, default: false}
    },
    { timestamps: true }
  );
  const schedules = mongoose.model("schedules", schema);

  return schedules;
};






