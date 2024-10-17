"use strict";
const db = require("../models");
var mongoose = require("mongoose");


async function travelRatesList(req, res) {
    try {
        const {page, count, sortBy, travel_rate_id } = req.query;
        var query = {};
  
       
        query.isDeleted = false;
        var sortquery = {};
        if (sortBy) {
          var order = sortBy.split(" ");
          var field = order[0];
          var sortType = order[1];
        }
        if(travel_rate_id) {
            query._id = travel_rate_id;
        }
  
        sortquery[field ? field : "start"] = sortType
          ? sortType == "desc"
            ? -1
            : 1
          : -1;
        
        const pipeline = [
          {
            $match: query,
          },
          {
            $sort: sortquery,
          },   
          {
            $project: {
              id: "$_id",
              start: "$start",
              end: "$end",
              amount: "$amount",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
            },
          },
        ];
        const total = await db.travel_rates.aggregate([...pipeline]);
        if (page && count) {
          var skipNo = (Number(page) - 1) * Number(count);
  
          pipeline.push(
            {
              $skip: Number(skipNo),
            },
            {
              $limit: Number(count),
            }
          );
        }
        console.log(pipeline);
        const result = await db.travel_rates.aggregate([...pipeline]);
  
        return res.status(200).json({
          success: true,
          data: result,
          total: total.length,
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: { code: 500, message: "" + err },
        });
      }
}


async function travelRatesDelete(req, res) {
    const {travel_rate_id} = req.query;
    if(!travel_rate_id) {
        return res.status(400).json({message: "travel_rate_id required!", code: 400});
    }
    try {
        const existing = await db.travel_rates.findOne({_id: travel_rate_id, isDeleted: false});
        if(!existing) {
            return res.status(404).json({message: "Travel Range to be deleted not found!", code: 404});
        }
        await db.travel_rates.updateOne({_id: travel_rate_id},{ isDeleted: true});
        return res.status(200).json({message: "travel rate deleted successfully", code: 200});
    } catch(err) {
        return res.status(500).json({message: err.message, code: 500});
    } 
}

async function travelRatesDetail(req, res) {
    const { travel_rate_id } = req.query;
    if(!travel_rate_id) {
        return res.status(400).json({message: "travel_rate_id required!", code: 400});
    }
    try {
        const rate = await db.travel_rates.findOne({_id: travel_rate_id, isDeleted: false});
        if(!rate) {
            return res.status(404).json({message: "Travel rate not found!", code: 404});
        }
        return res.status(200).json({travel_rate: rate, code: 200});
    } catch(err) {
        res.status(500).json({message: err.message, code: 500});
    }
}

async function travelRatesAdd(req, res) {
    const { start, end, amount } = req.body;
    try {
        if((start === 0 || start > 0) && (end === 0 || end > 0) && (amount === 0 || amount > 0)) {
            const overlapping = await db.travel_rates.find({$or: [
                {start: {$gte: start, $lt: end}},
                {end: {$gt: start, $lte: end}},
                {start: {$lte: start}, end: {$gte: end}}
            ], isDeleted: false});
            if(overlapping && overlapping.length > 0) {
                return res.status(400).json({message: "Overlapping range(s) exist(s)!"})
            }
            const created = await db.travel_rates.create({start: start, end: end, amount: amount});
            return res.status(200).json({message: "Range added!", code: 200});
        } else {
            return res.status(400).json({code: 400, message: "start or end or amount inappropriate!"});
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