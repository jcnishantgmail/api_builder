const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");

module.exports = {

    getContractorDashboardCount: async (req, res)=>{
        try{
            let totalJobAssignedQuery = {isDeleted:false,contractor:req.identity.id}
            let totalJobAssigned = await db.jobs.countDocuments(totalJobAssignedQuery)
            let selfAddedJobQuery = {isDeleted:false,addedBy:req.identity.id}
            let selfAddedJob = await db.jobs.countDocuments(selfAddedJobQuery)
            return res.status(200).json({
                success:true,
                totalJobAssigned:totalJobAssigned,
                selfAddedJob:selfAddedJob
            })
        }catch(err){
            return res.status(500).json({
                success:false,
                error:{code:500,message:""+err}
            })
        }
    }
}