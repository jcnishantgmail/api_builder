"use strict";
const db = require("../models");
var mongoose = require("mongoose");


async function contractorPayablesList(req, res) {
    try {
        const { page, count, sortBy, contractor, job, startDate, endDate} = req.query;
        let query = {};

        query.isDeleted = false;
  
        let sortquery = {};
        if (sortBy) {
          const [field = "date", sortType = "asc"] = sortBy.split(" ");
          sortquery[field] = sortType === "desc" ? -1 : 1;
        } else {
          sortquery.createdAt = -1;
        }
  
        
        if(contractor) {
            query.contractor = contractor;
        }

        if(job) {
            query.job = job;
        }

        if(startDate && endDate){
            startDate = new Date(startDate).setUTCHours(0,0,0,0)
            endDate = new Date(endDate).setUTCHours(23,59,59,0)
            query.date = {$gte: startDate,$lte: endDate}
         }

        const pipeline = [
          { $match: query },
          { $sort: sortquery },
          {
            $lookup: {
              from: "jobs",
              localField: "job",
              foreignField: "_id",
              as: "job",
            },
          },
          {
            $unwind: { path: "$job", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "users",
              localField: "contractor",
              foreignField: "_id",
              as: "contractor",
            },
          },
          {
            $unwind: { path: "$contractor", preserveNullAndEmptyArrays: true },
          },
          {
            $project: {
              id: "$_id",
              date: 1,
              job: 1,
              contractor: 1,
              distance_travelled: 1,
              travel_expense: 1,
              cis_amt: 1,
              labour_charges: 1,
              status: 1,
              other_expense: 1,
              net_payable: 1,
              isDeleted: 1,
              createdAt: 1,
              updatedAt: 1
            },
          }
        ];
  
        const total = await db.contractor_payables.aggregate([...pipeline]);
  
        if (page && count) {
          const skipNo = (Number(page) - 1) * Number(count);
  
          pipeline.push({ $skip: skipNo }, { $limit: Number(count) });
        }
  
        const result = await db.contractor_payables.aggregate([...pipeline]);
  
        return res.status(200).json({
          success: true,
          data: result,
          total: total.length,
        });
      } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
          success: false,
          error: { code: 500, message: err.message },
        });
      }
}

async function contractorPayablesDelete(req, res) {
    const {jobId, contractorId, date} = req.body;
    if(!jobId || !contractorId || !date) { 
        return res.status(400).json({message: "jobId or contractorId or date required!", code: 400});
    }
    try {
        const existing = db.contractor_payables.findOne({contractor: contractorId, job: jobId, date: date, isDeleted: false});
        if(!existing) {
          return res.status(404).json({code: 404, message: "Payable you are deleting doesn't exist!"});
        }
        await db.contractor_payables.updateOne({contractor: contractorId, job: jobId, date: date, isDeleted: false}, {isDeleted: true});
        return res.status(200).json({message: "Payable deleted successfully", code: 200});
    } catch(err) {
        res.status(500).json({message: err.message, success: false});
    } 
}

async function contractorPayablesDetail(req, res) {
    const { jobId, contractorId, date } = req.body;
    if(!jobId || !contractorId || !date) {
        return res.status(400).json({message: "jobId, contractorId or date missing!", code: 400});
    }
    try {
        const payable = await db.contractor_payables.findOne({job: jobId, contractor: contractorId, date: date, isDeleted: false});
        if(!payable) {
          return res.status(404).json({message: "Payable to contractor not found!", code: 404});
        }
        return res.status(200).json({code: 200, detail: payable});
    } catch(err) {
        res.status(500).json({message: err.message, success: false});
    }
}
module.exports = {
    contractorPayablesList,
    contractorPayablesDelete,
    contractorPayablesDetail
};