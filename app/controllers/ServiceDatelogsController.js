var mongoose = require("mongoose");
const db = require("../models");

module.exports = {
    listing: async function (req, res) {
        let { jobId, startDate, isDeleted,endDate, sortBy, page, count } = req;
        let query = {};
        try {
            if(jobId) {
                query.job = mongoose.Types.ObjectId.createFromHexString(jobId);
            }

            if(startDate && endDate) {
                startDate = new Date(startDate).setUTCHours(0, 0, 0, 0);
                endDate = new Date(endDate).setUTCHours(23, 59, 59, 0);
                query.date = {$gte: startDate, $lte: endDate};
            }

            if(isDeleted) {
                query.isDeleted = isDeleted;
            } else query.isDeleted = false;

            let sortquery = {};
            if (sortBy) {
                var order = sortBy.split(" ");
                var field = order[0];
                var sortType = order[1];
            }
    
            sortquery[field ? field : "date"] = sortType ?
                sortType == "desc" ?
                -1 :
                1 :
                -1;
            
            let pipeline = [
                {
                    $match: query
                },
                {
                    $sort: sortquery
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
                        _id: 1,
                        job: 1,
                        date: "$formattedDate",
                        hours: 1,
                        minutes: 1,
                        completed_images: 1,
                        labour_charge: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ];
            const total = await db.serviceDatelogs.aggregate(pipeline);
            if(page && count) {
                page = +page;
                count = +count;
                let skipNo = (page - 1) * count;
                pipeline.push({$skip: skipNo}, {$limit: count});
            }
            const result = await db.serviceDatelogs.aggregate(pipeline);
    
            return res.status(200).json({
                success: true,
                data: result,
                total: total.length,
              });
        } catch(err) {
            return res.status(500).json({message: err.message, code: 500});
        }
        
    }
}