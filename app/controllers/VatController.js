"use strict";
const db = require("../models");
var mongoose = require("mongoose");


async function vatList(req, res) {
    try {
        const { search, page, count, sortBy, vat_id } = req.query;
        var query = {};
  
        if (search) {
          query.$or = [
            { rate: { $regex: search, $options: "i" } }
          ];
        }
        query.isDeleted = false;
        var sortquery = {};
        if (sortBy) {
          var order = sortBy.split(" ");
          var field = order[0];
          var sortType = order[1];
        }
        if(vat_id) {
            query._id = vat_id;
        }
  
        sortquery[field ? field : "rate"] = sortType
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
              rate: "$rate",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
            },
          },
        ];
        const total = await db.vats.aggregate([...pipeline]);
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
        const result = await db.vats.aggregate([...pipeline]);
  
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


async function vatDelete(req, res) {
    const {vat_id} = req.query;
    if(!vat_id) {
        return res.status(400).json({message: "vat_id required!", code: 400});
    }
    try {
        const existing = await db.vats.findOne({_id: vat_id, isDeleted: false});
        if(!existing) {
            return res.status(404).json({message: "VAT rate not found!", code: 404});
        }
        await db.vats.updateOne({_id: vat_id}, {isDeleted: true});
        return res.status(200).json({message: "vat rate deleted successfully", code: 200});
    } catch(err) {
        res.status(500).json({message: err.message, code: 500});
    } 
}

async function vatDetail(req, res) {
    const { vat_id } = req.query;
    if(!vat_id) {
        return res.status(400).json({message: "vat_id required!", code: 400});
    }
    try {
        const vat = await db.vats.findOne({_id: vat_id, isDeleted: false});
        if(!vat) {
            return res.status(404).json({code: 404, message: "VAT not found!"});
        }
        return res.status(200).json({vat: vat, code: 200});
    } catch(err) {
        res.status(500).json({message: err.message, code: 500});
    }
}

async function vatAdd(req, res) {
    const { rate } = req.body;
    try {
        if(!isNaN(+rate) && +rate >= 0) {
            const existing = await db.vats.findOne({rate: +rate});
            console.log(existing);
            if(existing) {
                return res.status(400).json({code: 400, message: "VAT rate already exists!"});
            }
            const created = await db.vats.create({rate: +rate});
            return res.status(200).json({code: 200, message: "New VAT rate added"});
        } else {
            console.log(rate);
            return res.status(400).json({code: 400, message: "invalid input!"});
        }
    } catch(err) {
        return res.status(500).json({message: err.message, code: 500});
    } 
}

module.exports = {
    vatList,
    vatDelete,
    vatDetail,
    vatAdd
};