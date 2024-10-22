var Mongoose = require("mongoose"),
    Schema = Mongoose.Schema;



module.exports = (mongoose) => {
    var otherExpenseSchema = mongoose.Schema({
        amount: {type: Number, default: 0},
        description: {type: String, default: ''}
    });
    var datelogSchema = mongoose.Schema({
        date: Date,
        distance_travelled: {type: Number, default: 0},
        travel_expense: {type: Number, default: 0},
        cis_amt: {type: Number, default: 0},
        labour_charges: {type: Number, default: 0},
        other_expense: [otherExpenseSchema],
        day_total_other_expense: {type: Number, default: 0},
        net_payable: {type: Number, default: 0},
    });
    var schema = mongoose.Schema(
        {
            job: {type: Schema.Types.ObjectId, ref: "jobs"},
            contractor: {type: Schema.Types.ObjectId, ref: "users"},
            total_distance_travelled: {type: Number, default: 0},
            total_travel_expense: {type: Number, default: 0},
            total_cis_amt: {type: Number, default: 0},
            total_labour_charge: {type: Number, default: 0},
            total_other_expense: {type: Number, default: 0},
            total_net_payable: {type: Number, default: 0},
            status: {type: String, enum: ["pending", "successful"]},
            isDeleted: {type: Boolean, default: false},
            datelog: [datelogSchema],
            createdAt: Date,
            updatedAt: Date
        }, 
        { timestamps: true }
    );
    const contractor_payables = mongoose.model("contractor_payables", schema);

    return contractor_payables;
};