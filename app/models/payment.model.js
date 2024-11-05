var Mongoose = require("mongoose"),
    Schema = Mongoose.Schema;



module.exports = (mongoose) => {
    
    var schema = mongoose.Schema(
        {
            id: String,
            job: { type: Schema.Types.ObjectId, ref: "jobs"},
            invoiceId: { type: Schema.Types.ObjectId, ref: "invoices"},
            paymentType: { type: String, enum: ["manual", "stripe"], default: "manual" },
            status: { type: String, enum: ["successful", "failed", "cancelled", "NA"], default: "pending" },
            user: {type: Schema.Types.ObjectId, ref: "users"},
            createdAt: Date,
            updatedAt: Date,
            isDeleted: {type: Boolean, default: false}
        },
        { timestamps: true }
    );
    const payment = mongoose.model("payment", schema);

    return payment;
};