var Mongoose = require("mongoose"),
    Schema = Mongoose.Schema;



module.exports = (mongoose) => {
    const categoryDetailSchema = mongoose.Schema({
        _id: { type: Schema.Types.ObjectId },
        name: { type: String },
        slug: { type: String },
        image: { type: String },
        type: { type: String },
        status: { type: String },
        addedBy: { type: Schema.Types.ObjectId },
        isDeleted: { type: Boolean, default: false },
        createdAt: { type: Date },
        updatedAt: { type: Date }
      });
      
    const supplierDetailSchema = mongoose.Schema({
    _id: { type: Schema.Types.ObjectId },
    firstName: { type: String },
    lastName: { type: String },
    fullName: { type: String },
    email: { type: String },
    mobileNo: { type: String },
    address: { type: String },
    address2: { type: String },
    company: { type: String },
    zipCode: { type: String },
    state: { type: String },
    country: { type: String },
    skills: [ {type: Schema.Types.ObjectId} ],
    isVerified: { type: String},
    status: { type: String },
    addedBy: { type: Schema.Types.ObjectId },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date },
    updatedAt: { type: Date }
    });
    
    const materialSchema = mongoose.Schema({
    _id: { type: Schema.Types.ObjectId },
    id: { type: String},
    name: { type: String },
    image: { type: String },
    category: { type: Schema.Types.ObjectId },
    price: { type: Number },
    quantity: { type: Number },
    unit: { type: String },
    vat_included: { type: Boolean },
    vat: { type: Number },
    status: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date},
    isDeleted: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId },
    addedByName: { type: String },
    category_detail: categoryDetailSchema, 
    supplier_detail: supplierDetailSchema 
    });


    var schema = mongoose.Schema(
        {
            jobId: { type: Schema.Types.ObjectId, ref: "jobs", },
            client: { type: Schema.Types.ObjectId, ref: "users", },
            addedBy: { type: Schema.Types.ObjectId, ref: "users", },
            totalAmount: { type: Number, defult: 0 },
            property: { type: Schema.Types.ObjectId, ref: "properties", },
            sentDate: { type: Date },
            paidDate: { type: Date },
            paymentType: { type: String, enum: ["manual", "stripe"], default: "manual" },
            proofs: { type: Array, defults: [] },
            invoiceNumber: { type: String },
            paymentId: { type: String },
            status: { type: String, enum: ["pending", "sent", "completed", "cancelled"], default: "pending" },
            isDeleted: { type: Boolean, default: false },
            createdAt: Date,
            updatedAt: Date,
            material: [materialSchema],
            servicefee: { type: Number, default: 0 }
        },
        { timestamps: true }
    );
    const invoices = mongoose.model("invoices", schema);

    return invoices;
};






