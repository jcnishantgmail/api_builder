const db = require("../models");
var mongoose = require("mongoose");

module.exports = {
    listing: async function(req, res) {
        try {
            let {  page, count, sortBy, contractor, job, startDate, endDate } = req.query;
            var query = {};
      
            query.isDeleted = false;
            var sortquery = {};
            if (sortBy) {
              var order = sortBy.split(" ");
              var field = order[0];
              var sortType = order[1];
            }
      
            sortquery[field ? field : "startDate"] = sortType ?
              sortType == "desc" ?
                -1 :
                1 :
              -1;
            if (contractor) {
              query.contractor = mongoose.Types.ObjectId.createFromHexString(contractor)
            }

            if(job) {
              query.job = mongoose.Types.ObjectId.createFromHexString(job);
            }

            if(startDate && endDate){
               startDate = new Date(startDate).setUTCHours(0,0,0,0)
               endDate = new Date(endDate).setUTCHours(23,59,59,0)
               query.startDate = {$gte:new startDate,$lte: endDate}
            } 

            query.isDeleted = false;
            console.log(query);
            const pipeline = [{
              $match: query,
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
              $unwind: {
                path: "$contractor",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
                $lookup: {
                  from: "jobs",
                  localField: "job",
                  foreignField: "_id",
                  as: "job",
                },
            },
        
            {
                $unwind: {
                  path: "$job",
                  preserveNullAndEmptyArrays: true,
                },
            },
            {
              $project: {
                jobStatus: "$job.status",
                jobName: "$job.title",
                contractorName: "$contractor.fullName",
                startDate: 1,
                endDate: 1,
                totalHours: 1
              },
            },
            {
              $sort: sortquery,
            },
            ];
      
            const total = await db.schedules.aggregate([...pipeline]);
      
            if (page && count) {
              var skipNo = (Number(page) - 1) * Number(count);
      
              pipeline.push({
                $skip: Number(skipNo),
              }, {
                $limit: Number(count),
              });
            }
      
            const result = await db.schedules.aggregate([...pipeline]);
      
            return res.status(200).json({
              success: true,
              data: result,
              total: total.length,
            });
          } catch (err) {
            console.log(err);
            return res.status(500).json({
              success: false,
              error: {
                code: 500,
                message: "" + err
              },
            });
          }
    }
}