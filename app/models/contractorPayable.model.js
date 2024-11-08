var Mongoose = require("mongoose"),
    Schema = Mongoose.Schema;


module.exports = (mongoose) => {
    var otherExpenseSchema = mongoose.Schema({
        amount: {type: Number, default: 0},
        description: {type: String, default: ''}
    });

    var schema = mongoose.Schema(
        {
            date: Date,
            job: {type: Schema.Types.ObjectId, ref: "jobs"},
            contractor: {type: Schema.Types.ObjectId, ref: "users"},
            status: {type: String, enum: ["paid", "unpaid"], default: "unpaid"},
            distance_travelled: {type: Number, default: 0},
            travel_expense: {type: Number, default: 0},
            cis_amt: {type: Number, default: 0},
            labour_charge: {type: Number, default: 0},
            other_expense: [otherExpenseSchema],
            other_expense_total: {type: Number, default: 0},
            net_payable: {type: Number, default: 0},
            isDeleted: {type: Boolean, default: false},
            createdAt: Date,
            updatedAt: Date
        }, 
        { timestamps: true }
    );
    const contractor_payables = mongoose.model("contractor_payables", schema);

    return contractor_payables;
};