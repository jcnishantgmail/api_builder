"use strict";
const db = require("../models");
var mongoose = require("mongoose");


async function contractorPayablesUpdate(req, res) {
  try {
    const { id } = req.body;
    console.log(req.body);
    if(!id) {
      return res.status(400).json({success: false, message: "id missing!"});
    }
    const payable = await db.contractor_payables.findOne({_id: id, isDeleted: false});
    if(!payable) {
      return res.status(404).json({success: false, message: "Payable not found!"});
    }
    const updated = await db.contractor_payables.updateOne({_id:id}, req.body);
    return res.status(200).json({success: true, message: "Payable updated!", job: payable.job});
  } catch(err) {
    console.log(err);
    return res.status(500).json({success: false, message: err.message});
  }
}


async function contractorPayablesList(req, res) {
    try {
        let { page, count, sortBy, status, contractor, job, startDate, endDate} = req.query;
        let query = {};
  
        // if (search) {
        //   query.$or = [
        //     { title: { $regex: search, $options: "i" } },
        //     { description: { $regex: search, $options: "i" } },
        //   ];
        // }
  
        query.isDeleted = false;
  
        let sortquery = {};
        if (sortBy) {
          const [field = "createdAt", sortType = "desc"] = sortBy.split(" ");
          sortquery[field] = sortType === "desc" ? -1 : 1;
        } else {
          sortquery.createdAt = -1;
        }
        
        if(contractor) {
            query.contractor = mongoose.Types.ObjectId.createFromHexString(contractor);
        }

        if(job) {
            query.job = mongoose.Types.ObjectId.createFromHexString(job);
        }

        if(status) {
          query.status = status;
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
            $lookup: {
              from: "invoices",
              localField: "job.invoice",
              foreignField: "_id",
              as: "job.invoice"
            }
          },
          {
            $unwind: {path: "$job.invoice", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "users",
              localField: "job.invoice.client",
              foreignField: "_id",
              as: "job.invoice.client"
            }
          },
          {
            $unwind: {path: "$job.invoice.client", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "users",
              localField: "job.invoice.addedBy",
              foreignField: "_id",
              as: "job.invoice.addedBy"
            }
          },
          {
            $unwind: {path: "$job.invoice.addedBy", preserveNullAndEmptyArrays: true}
          },
          {
            $addFields: {
                formattedDate: {
                    $dateToString: {
                        format: "%Y-%m-%d", 
                        date: "$date"
                    }
                }
            }
          },
          {
            $project: {
              date: "$formattedDate",
              job: "$job",
              contractor: "$contractor",
              id: "$_id",
              status: "$status",
              distance_travelled: 1,
              travel_expense: 1,
              cis_amt: 1,
              labour_charge: 1,
              other_expense: 1,
              other_expense_total: 1,
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
        return res.status(500).json({
          success: false,
          error: { code: 500, message: err.message },
        });
      }
}

async function contractorPayablesReport(req, res) {
  try {
    let { page, count, sortBy, status, contractor, job, startDate, endDate} = req.query;
        let query = {};
  
        // if (search) {
        //   query.$or = [
        //     { title: { $regex: search, $options: "i" } },
        //     { description: { $regex: search, $options: "i" } },
        //   ];
        // }
  
        query.isDeleted = false;
  
        let sortquery = {};
        if (sortBy) {
          const [field = "createdAt", sortType = "desc"] = sortBy.split(" ");
          sortquery[field] = sortType === "desc" ? -1 : 1;
        } else {
          sortquery.createdAt = -1;
        }
        
        if(contractor) {
          query.contractor = mongoose.Types.ObjectId.createFromHexString(contractor);
        }

        if(job) {
            query.job = mongoose.Types.ObjectId.createFromHexString(job);
        }

        if(status) {
          query.status = status;
        } else {
          query.status = 'unpaid';
        }

        if(startDate && endDate){
            startDate = new Date(startDate).setUTCHours(0,0,0,0)
            endDate = new Date(endDate).setUTCHours(23,59,59,0)
            query.date = {$gte: startDate,$lte: endDate}
         }

        query.isDeleted = false;

        const pipeline = [
          { $match: query },
          { $sort: sortquery },
          {
            $group: {
              _id: {
                contractor: "$contractor",
                job: "$job"
              },
              status: {$first: "$status"},
              distance_travelled: {$sum: "$distance_travelled"},
              travel_expense: {$sum: "$travel_expense"},
              cis_amt: {$sum: "$cis_amt"},
              labour_charge: {$sum: "$labour_charge"},
              other_expense_total: {$sum: "$other_expense_total"},
              net_payable: {$sum: "$net_payable"},
            }
          },
          {
            $lookup: {
              from: "jobs",
              localField: "_id.job",
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
              localField: "_id.contractor",
              foreignField: "_id",
              as: "contractor",
            },
          },
          {
            $unwind: { path: "$contractor", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "invoices",
              localField: "job.invoice",
              foreignField: "_id",
              as: "job.invoice"
            }
          },
          {
            $unwind: {path: "$job.invoice", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "users",
              localField: "job.invoice.client",
              foreignField: "_id",
              as: "job.invoice.client"
            }
          },
          {
            $unwind: {path: "$job.invoice.client", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "users",
              localField: "job.invoice.addedBy",
              foreignField: "_id",
              as: "job.invoice.addedBy"
            }
          },
          {
            $unwind: {path: "$job.invoice.addedBy", preserveNullAndEmptyArrays: true}
          },
          {
            $addFields: {
                formattedDate: {
                    $dateToString: {
                        format: "%Y-%m-%d", 
                        date: "$date"
                    }
                }
            }
          },
          
          {
            $project: {
              _id: 0,
              job: "$job",
              contractor: "$contractor",
              status: "$status",
              distance_travelled: 1,
              travel_expense: 1,
              cis_amt: 1,
              labour_charge: 1,
              other_expense_total: 1,
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
  } catch(err) {
    return res.status(500).json({
      success: false,
      error: { code: 500, message: err.message },
    });
  }
}

async function contractorPayablesDelete(req, res) {
    const {jobId, contractorId} = req.body;
    if(!jobId || !contractorId || !date) { 
        return res.status(400).json({message: "jobId or contractorId required!", code: 400});
    }
    try {
        const existing = db.contractor_payables.findOne({contractor: contractorId, job: jobId, isDeleted: false});
        if(!existing) {
          return res.status(404).json({code: 404, message: "Payable you are deleting doesn't exist!"});
        }
        await db.contractor_payables.updateOne({contractor: contractorId, job: jobId, isDeleted: false}, {isDeleted: true});
        return res.status(200).json({message: "Payable deleted successfully", code: 200});
    } catch(err) {
        res.status(500).json({message: err.message, success: false});
    } 
}

async function contractorPayablesDetail(req, res) {
    const { jobId, contractorId} = req.query;
    if(!jobId || !contractorId) {
        return res.status(400).json({message: "jobId or contractorId missing!", code: 400});
    }
    try {
        const payable = await db.contractor_payables.findOne({job: jobId, contractor: contractorId, isDeleted: false})
        .populate({
            path: 'job',
            model: "jobs",
            populate: [
              {
                path: "contractor",
                model: "users"
              },
              {
                path: "invoice",
                populate: [
                  {
                    path: "client",
                    model: "users"
                  },
                  {
                    path: "addedBy",
                    model: "users"
                  }
                ]
              }
            ]
          }).populate('contractor');
        if(!payable) {
          return res.status(404).json({message: "Payable to contractor not found!", code: 404});
        }
        return res.status(200).json({code: 200, detail: payable});
    } catch(err) {
        res.status(500).json({message: err.message, success: false});
    }
}
module.exports = {
    contractorPayablesUpdate,
    contractorPayablesList,
    contractorPayablesDelete,
    contractorPayablesDetail,
    contractorPayablesReport
};