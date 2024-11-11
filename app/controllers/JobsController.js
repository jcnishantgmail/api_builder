const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");
const jobEmails = require("../Emails/jobEmails");
const { computeTravelCost } = require("../services/jobServices");
const datelog = require("../models/datelog.model");



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
      let propertyDetail = await db.properties.findById(req.body.property);
      let formattedLocation = '';
      if(propertyDetail.address) {
        formattedLocation += propertyDetail.address;
      }
      if(propertyDetail.address2) {
        formattedLocation += ', ' + propertyDetail.address2;
      }
      if(propertyDetail.state) {
        formattedLocation += ', ' + propertyDetail.state;
      }
      if(propertyDetail.zipCode) {
        formattedLocation += ' ' + propertyDetail.zipCode;
      }
      if(propertyDetail.country) {
        formattedLocation += ', ' + propertyDetail.country;
      }
      formattedLocation += ".";
      console.log(formattedLocation);
      jobEmails.adminEmailForNewJob({id:created._id,clientName:client.fullName,jobTitle:created.title,description:created.description,location:formattedLocation})
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
      console.log("err",err)
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
      let detail = await db.jobs.findById(id).populate('addedBy' , 'id fullName email').populate('client' , 'id fullName email').populate('contractor' , 'id fullName email').populate('property').populate('category');
      
      return res.status(200).json({
        success: true,
        data: detail
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
      let {  search, page, count, sortBy, status, addedBy, client, contractor, property, startDate, endDate } = req.query;
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
      if(startDate && endDate){
         startDate = new Date(startDate).setUTCHours(0,0,0,0)
         endDate = new Date(endDate).setUTCHours(23,59,59,0)
         query.createdAt = {$gte:new Date(startDate),$lte:new Date(endDate)}
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
        $lookup: {
          from: "invoices",
          localField: "invoice",
          foreignField: "_id",
          as: "invoice"
        }
      },
      {
        $unwind: {
          path: "$invoice",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$_id",
          title: "$title",
          description:"$description",
          images: "$images",
          completed_images: "$completed_images",
          estimate: "$estimate",    
          status: "$status",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          isDeleted: "$isDeleted",
          property_detail:"$property_detail",
          urgency: "$urgency",
          special_instruction: "$special_instruction",
          addedBy: "$addedBy",
          addedByDetail: "$addedByDetail",
          addedByName: "$addedByDetail.fullName",
          addedByEmail: "$addedByDetail.email",
          isInvoiceGenerated:"$isInvoiceGenerated",
          clientDetail: "$client_detail",
          clientName:"$client_detail.fullName",
          clientEmail:"$client_detail.email",
          contractor:"$contractor",
          contractorName:"$contractor_detail.fullName",
          contractorEmail:"$contractor_detail.email",
          hourlyRate:"$contractor_detail.hourlyRate",
          preferedTime:"$preferedTime",
          material:"$material",
          hours:"$hours",
          minutes:"$minutes",
          materialCategory: "$materialCategory",
          materialDatelogs: "$materialDatelogs",
          serviceDatelogs: "$serviceDatelogs",
          isContractorPaid: 1,
          invoice: 1
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
      let {id , contractor, preferedTime} = req.body
      console.log(preferedTime);
      console.log(new Date(preferedTime));
      if(!contractor){
        contractor = null
      }
      
      let job = await db.jobs.findById(id).populate("property").populate('client');
      let location = [job.property.address, job.property.address2, job.property.state, job.property.zipCode,job.property.country];
      location = location.join(", ")
      let formattedLocation = '';
      if(job.property.address) {
        formattedLocation += job.property.address;
      }
      if(job.property.address2) {
        formattedLocation += ', ' + job.property.address2;
      }
      if(job.property.state) {
        formattedLocation += ', ' + job.property.state;
      }
      if(job.property.zipCode) {
        formattedLocation += ' ' + job.property.zipCode;
      }
      if(job.property.country) {
        formattedLocation += ', ' + job.property.country;
      }
      formattedLocation += ".";
      await db.jobs.updateOne({_id:id},{contractor:contractor});
      preferedTime = new Date(preferedTime);
      console.log(preferedTime);
      let timeChanged = false;
      if(job.preferedTime.getTime() != preferedTime.getTime()) {
        await db.jobs.updateOne({_id: id}, {preferedTime});
        //jobEmails.preferredTimeChangeToClient(job);
        timeChanged = true;
      }
      if(contractor){
        let contratorDetail = await db.users.findById(contractor)
        jobEmails.jobAssignToContractor({
          jobTitle:job.title,
          description:job.description,
          email:contratorDetail.email,
          fullName:contratorDetail.fullName,
          location:formattedLocation,
          id:job._id
        });
        let clientDetail = job.client;
        let ampm = preferedTime.getUTCHours()>12? 'PM': 'AM';
        let hours = preferedTime.getUTCHours()%12;
        if(hours === 0) {
          hours = '12';
        } else if(hours < 10) {
          hours = '0' + hours;
        }
        let minutes = preferedTime.getUTCMinutes();
        minutes = minutes < 10? '0'+ minutes: minutes;
        let preferredStartTime = hours + ":" + minutes + " " + ampm;
        jobEmails.assignContractorClientEmail({
          jobTitle: job.title,
          description: job.description,
          email: clientDetail.email,
          clientFullName: clientDetail.fullName,
          contractorFullName: contratorDetail.fullName,
          location: formattedLocation,
          timeChanged: true,
          preferredStartTime
        });
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
  },

  startJob: async (req, res)=>{
    try{
      let {id}= req.body
      if(!id){
        return res.status(400).json({
          success:false,
          error:{code:400,message:"Job id required"}
        })
      }
  
      await db.jobs.updateOne({_id:id},{status:"in-progress"})
  
      return res.status(200).json({
        success:true
      })
    }catch(err){
      return res.status(500).json({
        success:false,
        eror:{code:500, message:""+err}
      })
    }
   
  },

  pauseJob: async (req, res) => {
    try {
      let { jobId, date, serviceDatelogs, materialDatelogs, expenses } = req.body;
      if(!jobId || !date) {
        return res.status(400).json({message: "Job Id and date required!", code: 400, success: false});
      }
      const job = await db.jobs.findOne({_id: jobId}).populate('contractor');
      if(!job) {
        return res.status(404).json({message: "Job not found!", code: 404, success: false});
      }
      if(job.status !== 'in-progress') {
        return res.status(400).json({message: "Invalid input job status!", code: 400, success: false});
      }

      if(serviceDatelogs) {
        serviceDatelogs = serviceDatelogs.map(serviceDatelog => {
          serviceDatelog.job = jobId;
          serviceDatelog.date = date;
          serviceDatelog.servicefee = ((+job.contractor.hourlyRate)*((+serviceDatelog.hours)+((+serviceDatelog.minutes)/60))).toFixed(2);
          return serviceDatelog;
        });
        let insertedServiceDatelogs = await db.serviceDatelogs.insertMany(serviceDatelogs);
        for(let serviceDatelog of insertedServiceDatelogs) {
          job.completed_images = job.completed_images.concat(serviceDatelog.completed_images);
        }
        await db.jobs.updateOne({_id: jobId}, {completed_images: job.completed_images});
      }
      if(materialDatelogs) {
        materialDatelogs = materialDatelogs.map(materialDatelog => {
          materialDatelog.job = jobId;
          materialDatelog.date = date;
          return materialDatelog;
        });
        await db.materialDatelogs.insertMany(materialDatelogs);
      }

      if(expenses) {
        const contractor = await db.users.findOne({_id: job.contractor._id}).populate('cis_rate');
        expenses = await Promise.all(expenses.map(async (expense) => {
          expense.job = jobId;
          expense.contractor = job.contractor._id;
          expense.date = date;
          expense.status = "unpaid";
          expense.labour_charge = serviceDatelogs.reduce((tot, curServiceDatelog) => {
            return tot + curServiceDatelog.servicefee;
          }, 0);
          expense.travel_expense = await computeTravelCost(expense.distance_travelled);
          expense.other_expense_total = expense.other_expense.reduce((tot, cur)=>{
            return tot + cur.amount;
          }, 0);
          expense.cis_amt = (0.01) * (+contractor.cis_rate.rate) * (expense.labour_charge);
          expense.net_payable = expense.labour_charge + expense.travel_expense + expense.other_expense_total - expense.cis_amt;
          return expense;
        }));
        await db.contractor_payables.insertMany(expenses);
      }
      return res.status(200).json({success: true, message: "Job logged successfully", code: 200});

    } catch(err) {
      return res.status(500).json({success: false, message: err.message, code: 500});
    }
  },

  completejob: async (req, res) => {
    try {
      let { jobId, date, serviceDatelogs, materialDatelogs, expenses } = req.body;
      if(!jobId || !date) {
        return res.status(400).json({message: "Job Id and date required!", code: 400, success: false});
      }
      const job = await db.jobs.findOne({_id: jobId}).populate('contractor');
      if(!job) {
        return res.status(404).json({message: "Job not found!", code: 404, success: false});
      }
      if(job.status !== 'in-progress') {
        return res.status(400).json({message: "Invalid input job status!", code: 400, success: false});
      }

      if(serviceDatelogs) {
        serviceDatelogs = serviceDatelogs.map(serviceDatelog => {
          serviceDatelog.job = jobId;
          serviceDatelog.date = date;
          serviceDatelog.servicefee = ((+job.contractor.hourlyRate)*((+serviceDatelog.hours)+((+serviceDatelog.minutes)/60))).toFixed(2);
          return serviceDatelog;
        });
        let insertedServiceDatelogs = await db.serviceDatelogs.insertMany(serviceDatelogs);
        for(let serviceDatelog of insertedServiceDatelogs) {
          job.completed_images = job.completed_images.concat(serviceDatelog.completed_images);
        }
        await db.jobs.updateOne({_id: jobId}, {completed_images: job.completed_images, status: "completed"});
      }
      
      if(materialDatelogs) {
        materialDatelogs = materialDatelogs.map(materialDatelog => {
          materialDatelog.job = jobId;
          materialDatelog.date = date;
          return materialDatelog;
        });
        await db.materialDatelogs.insertMany(materialDatelogs);
      }

      if(expenses) {
        const contractor = await db.users.findOne({_id: job.contractor._id}).populate('cis_rate');
        expenses = await Promise.all(expenses.map(async (expense) => {
          expense.job = jobId;
          expense.contractor = job.contractor._id;
          expense.date = date;
          expense.status = "unpaid";
          expense.labour_charge = serviceDatelogs.reduce((tot, curServiceDatelog) => {
            return tot + curServiceDatelog.servicefee;
          }, 0);
          expense.travel_expense = await computeTravelCost(expense.distance_travelled);
          expense.other_expense_total = expense.other_expense.reduce((tot, cur)=>{
            return tot + cur.amount;
          }, 0);
          expense.cis_amt = (0.01) * (+contractor.cis_rate.rate) * (expense.labour_charge);
          expense.net_payable = expense.labour_charge + expense.travel_expense + expense.other_expense_total - expense.cis_amt;
          return expense;
        }));
        await db.contractor_payables.insertMany(expenses);
      }
      return res.status(200).json({message: "Job logged successfully", code: 200, success: true});
    } catch(err) {
      return res.status(500).json({message: err.message, code: 500, success: false});
    }
  },

};
