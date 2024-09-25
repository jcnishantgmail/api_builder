var Mongoose = require("mongoose"),
    Schema = Mongoose.Schema;



module.exports = (mongoose) => {
    
    var schema = mongoose.Schema(
        {
            id: String,
            invoiceId: { type: Schema.Types.ObjectId, ref: "invoices"},
            txnDatetime: {type: Date},
            paymentType: { type: String, enum: ["manual", "stripe"], default: "manual" },
            status: { type: String, enum: ["successful", "failed", "cancelled", "NA"], default: "pending" },
            createdAt: Date,
            updatedAt: Date
        },
        { timestamps: true }
    );
    const payment = mongoose.model("payment", schema);

    return payment;
};