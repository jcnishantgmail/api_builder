"use strict";
const db = require("../models");
var mongoose = require("mongoose");


async function cisRatesList(req, res) {
    try {
        const { page, count, sortBy, cis_rate_id } = req.query;
        var query = {};
  
       
        query.isDeleted = false;
        var sortquery = {};
        if (sortBy) {
          var order = sortBy.split(" ");
          var field = order[0];
          var sortType = order[1];
        }
        if(cis_rate_id) {
            query._id = cis_rate_id;
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
        const total = await db.cis_rates.aggregate([...pipeline]);
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
        const result = await db.cis_rates.aggregate([...pipeline]);
  
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



async function cisRatesDelete(req, res) {
    const {cis_rate_id} = req.query;
    if(!cis_rate_id) {
        return res.status(400).json({message: "cis_rate_id required!", code: 400});
    }
    try {
        const existing_cis = await db.cis_rates.findOne({_id: cis_rate_id, isDeleted: false});
        if(!existing_cis) {
            return res.status(404).json({message: "CIS rate not found!", code: 404});
        }
        let usersWithThisCIS = await db.users.find({cis_rate: cis_rate_id, isDeleted: false});
        if(usersWithThisCIS && usersWithThisCIS.length>0) {
            return res.status(403).json({message: "Users with this CIS rate exist. Deletion not allowed!", code: 403});
        }
        await db.cis_rates.updateOne({_id: cis_rate_id}, {isDeleted: true});
        return res.status(200).json({message: "CIS rate deleted successfully", code: 200});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    } 
}

async function cisRatesDetail(req, res) {
    const { cis_rate_id } = req.query;
    if(!cis_rate_id) {
        return res.status(400).json({message: "cis_rate_id required!", code: 400});
    }
    try {
        const rate = await db.cis_rates.findOne({_id: cis_rate_id, isDeleted: false});
        if(!rate) {
            return res.status(404).json({message: "CIS rate does not exist!", code: 404});
        }
        return res.status(200).json({cis_rate: rate, code: 200});
    } catch(err) {
        res.status(500).json({message: err.message, code: 500});
    }
}

async function cisRatesAdd(req, res) {
    const { cis_rate } = req.body;
    try {
        if(cis_rate === 0 || cis_rate > 0) {
            const existing = await db.cis_rates.findOne({rate: +cis_rate, isDeleted: false});
            if(existing) {
                return res.status(400).json({message: "CIS rate already exists!", code: 400});
            }
            const created = await db.cis_rates.create({rate: cis_rate});
            return res.status(200).json({code: 200, message: "CIS rate created!"});
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