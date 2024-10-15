var Mongoose = require("mongoose"),
    Schema = Mongoose.Schema;



module.exports = (mongoose) => {
    
    var schema = mongoose.Schema(
        {
            date: Date,
            job: {type: Schema.Types.ObjectId, ref: "jobs"},
            contractor: {type: Schema.Types.ObjectId, ref: "users"},
            distance_travelled: {type: Number, default: 0},
            travel_expense: {type: Number, default: 0},
            cis_amt: {type: Number, default: 0},
            labour_charges: {type: Number, default: 0},
            status: {type: String, enum: ["pending", "successful"]},
            net_payable: {type: Number, default: 0},
            createdAt: Date,
            updatedAt: Date
        },
        { timestamps: true }
    );
    const contractor_payables = mongoose.model("contractor_payables", schema);

    return contractor_payables;
};