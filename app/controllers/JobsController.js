const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");
const jobEmails = require("../Emails/jobEmails")
module.exports = {

  add: async (req, res) => {
    try {
      if (!req.body.title) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.JOBS.PAYLOAD_MISSING
          },
        });
      }
      req.body.addedBy = req.identity.id;
      if(!req.body.client){ req.body.client = req.identity.id}
      let client = await db.users.findById(req.body.client)
      let created = await db.jobs.create(req.body);
      let propertyDetail = await db.properties.findById(req.body.property)
      jobEmails.adminEmailForNewJob({id:created._id,clientName:client.fullName,jobTitle:created.title,description:created.description,location:propertyDetail.address})
      if (created) {
        return res.status(200).json({
          success: true,
          message: constants.JOBS.CREATED
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Some issue exist",
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: "" + err
        },
      });
    }
  },

  detail: async (req, res) => {
    try {
      let {
        id
      } = req.query;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.JOBS.ID_MISSING
          },
        });
      }
      const detail = await db.jobs.findById(id).populate('addedBy' , 'id fullName email').populate('client' , 'id fullName email').populate('contractor' , 'id fullName email').populate('property')

      return res.status(200).json({
        success: true,
        data: detail
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: "" + err
        },
      });
    }
  },

  update: async (req, res) => {
    try {
      const id = req.body.id;
      const data = req.body;


      await db.jobs.updateOne({_id: id}, data);

      return res.status(200).json({
        success: true,
        message: constants.JOBS.UPDATED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: "" + err
        },
      });
    }
  },

  delete: async (req, res) => {
    try {
      const id = req.query.id;

      const updatedStatus = await db.jobs.updateOne({
        _id: id
      }, {
        isDeleted: true
      });
      if (updatedStatus) {
        return res.status(200).json({
          success: true,
          message: constants.JOBS.DELETED,
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: "" + err
        },
      });
    }
  },

  listing: async (req, res) => {
    try {
      const {
        search,
        page,
        count,
        sortBy,
        status,
        addedBy,
        client,
        contractor,
        property
        
      } = req.query;
      var query = {};

      if (search) {
        query.$or = [{
          title: {$regex: search,$options: "i" }
        },];
      }
      query.isDeleted = false;
      var sortquery = {};
      if (sortBy) {
        var order = sortBy.split(" ");
        var field = order[0];
        var sortType = order[1];
      }

      sortquery[field ? field : "createdAt"] = sortType ?
        sortType == "desc" ?
          -1 :
          1 :
        -1;
      if (status) {
        query.status = status;
      }
      if (addedBy) {
        query.addedBy = mongoose.Types.ObjectId.createFromHexString(addedBy);
      }
      if (client) {
        query.client = mongoose.Types.ObjectId.createFromHexString(client);
      }
      if (contractor) {
        query.contractor = mongoose.Types.ObjectId.createFromHexString(contractor)
      }
      if (property) {
        query.property = mongoose.Types.ObjectId.createFromHexString(property)
      }
      const pipeline = [{
        $match: query,
      },
     
      {
        $lookup: {
          from: "users",
          localField: "addedBy",
          foreignField: "_id",
          as: "addedByDetail",
        },
      },

      {
        $unwind: {
          path: "$addedByDetail",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "client_detail",
        },
      },

      {
        $unwind: {
          path: "$client_detail",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "contractor",
          foreignField: "_id",
          as: "contractor_detail",
        },
      },

      {
        $unwind: {
          path: "$contractor_detail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property_detail",
        },
      },

      {
        $unwind: {
          path: "$property_detail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$_id",
          title: "$title",
          description:"$description",
          images: "$images",
          estimate: "$estimate",    
          status: "$status",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          isDeleted: "$isDeleted",
          property_detail:"$property_detail",
          addedBy: "$addedBy",
          addedByName: "$addedByDetail.fullName",
          addedByEmail: "$addedByDetail.email",
          client:"$client",
          clientName:"$client_detail.fullName",
          clientEmail:"$client_detail.email",
          contractor:"$contractor",
          contractorName:"$contractor_detail.fullName",
          contractorEmail:"$contractor_detail.email"
        },
      },
      {
        $sort: sortquery,
      },
      ];

      const total = await db.jobs.aggregate([...pipeline]);

      if (page && count) {
        var skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({
          $skip: Number(skipNo),
        }, {
          $limit: Number(count),
        });
      }

      const result = await db.jobs.aggregate([...pipeline]);

      return res.status(200).json({
        success: true,
        data: result,
        total: total.length,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: "" + err
        },
      });
    }
  },



  changeStatus: async (req, res) => {
    try {
      const id = req.body.id;
      const status = req.body.status;

      await db.jobs.updateOne({
        _id: id
      }, {
        status: status
      });

      return res.status(200).json({
        success: true,
        message: constants.onBoarding.STATUS_CHANGED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: "" + err
        },
      });
    }
  },

  assignContractor: async (req, res)=>{
    try{
      let {id , contractor} = req.body
      if(!contractor){
        contractor = null
      }
     
      let job = await db.jobs.findById(id).populate("property")
      await db.jobs.updateOne({_id:id},{contractor:contractor})
      if(contractor){
        let contratorDetail = await db.users.findById(contractor)
        jobEmails.jobAssignToContractor({
          jobTitle:job.title,
          description:job.description,
          email:contratorDetail.email,
          fullName:contratorDetail.fullName,
          location:job?.property?.address,
          id:job._id
        })
      }
      
      return res.status(200).json({
        success:true
      })
    }catch(err){
      return res.status(500).json({
        success:false,
        error:{code:500, message:""+err}
      })
    }
  }

};
