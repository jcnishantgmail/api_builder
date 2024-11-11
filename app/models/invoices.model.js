var Mongoose = require("mongoose"),
    Schema = Mongoose.Schema;



module.exports = (mongoose) => {
    
    var schema = mongoose.Schema(
        {
            jobId: { type: Schema.Types.ObjectId, ref: "jobs", },
            client: { type: Schema.Types.ObjectId, ref: "users", },
            addedBy: { type: Schema.Types.ObjectId, ref: "users", },
            property: { type: Schema.Types.ObjectId, ref: "properties", },
            sentDate: { type: Date },
            paidDate: { type: Date },
            paymentType: { type: String, enum: ["manual", "stripe"], default: "manual" },
            proofs: { type: Array, default: [] },
            invoiceNumber: { type: String },
            paymentId: { type: String },
            status: { type: String, enum: ["pending", "sent", "completed", "cancelled"], default: "pending" },
            isDeleted: { type: Boolean, default: false },
            createdAt: Date,
            updatedAt: Date,
            services: {type: Array},
            materials: {type: Array},
            dueDate: {type: Date},
            terms: {type: Number},  
            subtotal: {type: Number, default: 0},
            vat_total: {type: Number, default: 0},
            total: {type: Number, default: 0},
            balance_due: {type: Number, default: 0},
            vat_summary: Array,
            labour_charge: {type: Number, default: 0},
            admin_info: Object,
            client_info: Object,
            bank_account_details: Object
        }, 
        { timestamps: true }
    );
    const invoices = mongoose.model("invoices", schema);

    return invoices;
};






