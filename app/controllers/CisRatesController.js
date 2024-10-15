"use strict";
const db = require("../models");
var mongoose = require("mongoose");

async function cisRatesList(req, res) {
    try {
        const cis_rates = await db.cis_rates.find({});
        return res.status(200).json({cis_rates: cis_rates, success: true});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    }
}

async function cisRatesDelete(req, res) {
    const {cis_rate_id} = req.body;
    if(!cis_rate_id) {
        return res.status(400).json({message: "cis_rate_id required!", code: 400});
    }
    try {
        await db.cis_rates.deleteOne({_id: cis_rate_id});
        return res.status(200).json({message: "CIS rate deleted successfully", code: 200});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    } 
}

async function cisRatesDetail(req, res) {
    const { cis_rate_id } = req.query;
    console.log(cis_rate_id);
    if(!cis_rate_id) {
        return res.status(400).json({message: "cis_rate_id required!", code: 400});
    }
    try {
        const rate = await db.cis_rates.findOne({_id: cis_rate_id});
        return res.status(200).json({cis_rate: rate, success: true});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    }
}

async function cisRatesAdd(req, res) {
    const { cis_rate } = req.body;
    try {
        if(cis_rate === 0 || cis_rate > 0) {
            const created = await db.cis_rates.create({rate: cis_rate});
            return res.status(200).json({success: true});
        } else {
            return res.status(400).json({message: "Send valid cis rate!", success: false});
        }
    } catch(err) {
        return res.status(err.code).json({message: err.message, code: err.code});
    }
    
}
module.exports = {
    cisRatesList,
    cisRatesDelete,
    cisRatesDetail,
    cisRatesAdd
};