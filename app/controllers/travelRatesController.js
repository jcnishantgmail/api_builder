"use strict";
const db = require("../models");
var mongoose = require("mongoose");

async function travelRatesList(req, res) {
    try {
        const travel_rates = await db.travel_rates.find({});
        return res.status(200).json({travel_rates: travel_rates, success: true});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    }
}

async function travelRatesDelete(req, res) {
    const {travel_rate_id} = req.query;
    if(!travel_rate_id) {
        return res.status(400).json({message: "travel_rate_id required!", code: 400});
    }
    try {
        await db.travel_rates.deleteOne({_id: travel_rate_id});
        return res.status(200).json({message: "travel rate deleted successfully", code: 200});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    } 
}

async function travelRatesDetail(req, res) {
    const { travel_rate_id } = req.query;
    if(!travel_rate_id) {
        return res.status(400).json({message: "travel_rate_id required!", code: 400});
    }
    try {
        const rate = await db.travel_rates.findOne({_id: travel_rate_id});
        return res.status(200).json({travel_rate: rate, success: true});
    } catch(err) {
        res.status(500).json({message: err.message, success: false});
    }
}

async function travelRatesAdd(req, res) {
    const { start, end, amount } = req.body;
    try {
        if((start === 0 || start > 0) && (end === 0 || end > 0) && (amount === 0 || amount > 0)) {
            const existing = await db.travel_rates.findOne({distance: distance});
            if(existing) {
                return res.status(400).json({message: "Already exists", success: false});
            }
            const created = await db.travel_rates.create({start: start, end: end, amount: amount});
            return res.status(200).json({success: true});
        } else {
            return res.status(400).json({success: false, message: "start or end or amount inappropriate!"});
        }
    } catch(err) {
        return res.status(500).json({message: err.message, code: 500});
    } 
}

module.exports = {
    travelRatesList,
    travelRatesDelete,
    travelRatesDetail,
    travelRatesAdd
};