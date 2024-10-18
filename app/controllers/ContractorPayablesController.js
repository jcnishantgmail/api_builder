"use strict";
const db = require("../models");
var mongoose = require("mongoose");

async function contractorPayablesList(req, res) {
    const {contractorId, jobId} = req.query;
    if(!contractorId || !jobId) {
        return res.status(400).json({message: "contractorId or jobId missing!", code: 400});
    }
    try { 
        const payables = await db.contractor_payables.find({contractor: contractorId, job: jobId});
        return res.status(200).json({payables: payables, success: true});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    }
}

async function contractorPayablesDelete(req, res) {
    const {jobId} = req.body;
    if(!jobId) {
        return res.status(400).json({message: "jobId required!", code: 400});
    }
    try {
        await db.contractor_payables.deleteOne({contractor: contractorId, job: jobId});
        return res.status(200).json({message: "Payable deleted successfully", code: 200});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    } 
}

async function contractorPayablesDetail(req, res) {
    const { jobId } = req.body;
    if(!jobId) {
        return res.status(400).json({message: "jobId required!", code: 400});
    }
    try {
        const payable = await db.contractor_payables.findOne({job: jobId});
        return payable;
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    }
}
module.exports = {
    contractorPayablesList,
    contractorPayablesDelete,
    contractorPayablesDetail
};