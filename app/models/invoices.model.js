var Mongoose = require("mongoose"),
    Schema = Mongoose.Schema;

module.exports = (mongoose) => {
    var schema = mongoose.Schema(
        {

            jobId: { type: Schema.Types.ObjectId, ref: "jobs", },
            client: { type: Schema.Types.ObjectId, ref: "users", },
            addedBy: { type: Schema.Types.ObjectId, ref: "users", },
            totalAmount: { type: Number, defult: 0 },
            property: { type: Schema.Types.ObjectId, ref: "properties", },
            sentDate: { type: Date },
            paidDate: { type: Date },
            paymentType: { type: String, enum: ["manual", "stripe"], defult: "manual" },
            proofs: { type: Array, defults: [] },
            invoiceNumber: { type: String },
            paymentId: { type: String },
            status: { type: "String", enum: ["pending", "sent", "completed", "cancelled"], default: "pending" },
            isDeleted: { type: Boolean, default: false },
            createdAt: Date,
            updatedAt: Date,
        },
        { timestamps: true }
    );
    const invoices = mongoose.model("invoices", schema);

    return invoices;
};






