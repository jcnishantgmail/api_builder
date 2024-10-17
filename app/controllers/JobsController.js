const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");
const jobEmails = require("../Emails/jobEmails")
const { combineJobDateLogs}  = require("../utls/helper");
const datelog = require("../models/datelog.model");

async function computeTravelCost(distance_travelled) {
  const travel_rates = await db.travel_rates.find({});
  console.log(travel_rates);
  for(let i = 0;i<travel_rates.length;i++) {
    if(+distance_travelled >= +travel_rates[i].start && +distance_travelled <= +travel_rates[i].end) {
      return travel_rates[i].amount;
    }
  }
  return 0;
}

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
      let detail = await db.jobs.findById(id).populate('addedBy' , 'id fullName email').populate('client' , 'id fullName email').populate('contractor' , 'id fullName email').populate('property').populate('category').populate('datelog');
      
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
          from: "datelogs",
          localField: "datelog",
          foreignField: "_id",
          as: "datelog_detail"
        }
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
          addedByName: "$addedByDetail.fullName",
          addedByEmail: "$addedByDetail.email",
          client:"$client",
          isInvoiceGenerated:"$isInvoiceGenerated",
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
          datelogLastUpdated: "$datelogLastUpdated",
          expenseAdded: "$expenseAdded",
          datelog: "$datelog_detail"
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
      if(!contractor){
        contractor = null
      }
      
      let job = await db.jobs.findById(id).populate("property");
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
      if(job.preferedTime != preferedTime) {
        await db.jobs.updateOne({_id: id}, {preferedTime});
        //jobEmails.preferredTimeChangeToClient(job);
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
    try{
      let {jobId}= req.body;
      let inputDatelog = req.body.datelog;
      if(!jobId){
        return res.status(400).json({
          success:false,
          error:{code:400,message:"Job id required"}
        })
      }
      if(!datelog){
        return res.status(400).json({
          success:false,
          error:{code:400,message:"datelog required"}
        })
      }
      
      let job = await db.jobs.findById(jobId);
      if(!job) {
        return res.status(400).json({message: "Invalid job!", code: 400});
      }
      if(job.status !== 'in-progress') {
        return res.status(400).json({message: "Invalid input job status!", code: 400});
      }

      if(inputDatelog.material) {
        for(let material of inputDatelog.material) {
          const inventoryMaterial = await db.materials.findById(material._id);
          if(material.quantity > inventoryMaterial.quantity) {
            return res.status(400).json({message: "Not enough materials", code: 400});
          }
        }
        for(let material of inputDatelog.material) {
          await db.materials.updateOne({_id: material._id}, {$dec: {quantity: Number(material.quantity)}});
        }
      }
      

      const datelogObj = await db.datelogs.findOne({job: jobId, date: inputDatelog.date});
      if(datelogObj) {
        if(inputDatelog.hours) {
          datelogObj.hours += Number(inputDatelog.hours);
        }
        if(inputDatelog.minutes) {
          datelogObj.minutes += Number(inputDatelog.minutes);
        }
        datelogObj.hours = Number(datelogObj.hours) + Number(datelogObj.minutes)/60;
        datelogObj.hours = Math.floor(datelogObj.hours);
        datelogObj.minutes = Number(datelogObj.minutes) % 60;
        datelogObj.minutes = Math.floor(datelogObj.minutes);
        if(inputDatelog.material) {
          datelogObj.material = datelogObj.material.concat(inputDatelog.material);
        }
        if(inputDatelog.completed_images) {
          datelogObj.completed_images = datelogObj.completed_images.concat(inputDatelog.completed_images);
        }
        await db.datelogs.updateOne({_id: datelogObj._id}, datelogObj);
        

      }
      else {
        const created = await db.datelogs.create({
          job: jobId,
          contractor: job.contractor,
          date: inputDatelog.date,
          hours:inputDatelog.hours,
          minutes:inputDatelog.minutes,
          material:inputDatelog.material,
          completed_images: inputDatelog.completed_images          
        });
        await db.jobs.updateOne({_id: jobId}, {
          $push: {datelog: created._id},
          datelogLastUpdated: inputDatelog.date
        });
      }

      return res.status(200).json({
        success:true
      })
    }catch(err){
      return res.status(500).json({
        success:false,
        eror:{code:500, message:""+err}
      });
    }
  },

  // continueJob: async (req, res) => {
  //   try{
  //     let {id, date}= req.body
  //     if(!id){
  //       return res.status(400).json({
  //         success:false,
  //         error:{code:400,message:"Job id required"}
  //       })
  //     }
  //     let job = await db.jobs.findById(id);
  //     if(job.status !== 'paused') {
  //       return res.status(403).json({message: "Invalid job status!", code: 403});
  //     }
  //     let original_datelog = job.datelog;
  //     let maxDate = original_datelog.reduce((max, cur) => new Date(max) > new Date(cur.date)? max:cur.date, original_datelog[0].date);
  //     if(maxDate === date) {
  //       return res.status(403).json({"message": "Cannot continue job on the same day it was paused!", code: 403});  
  //     }
  //     await db.jobs.updateOne({_id:id},{status: "in-progress"});
  
  //     return res.status(200).json({
  //       success:true,
  //       message: "Job continued!"
  //     })
  //   }catch(err){
  //     return res.status(500).json({
  //       success:false,
  //       eror:{code:500, message:""+err}
  //     })
  //   }
  // },

  completeJob: async (req, res) => {
    try {
      let {jobId}= req.body;
      let inputDatelog = req.body.datelog;
      if(!jobId){
        return res.status(400).json({
          success:false,
          error:{code:400,message:"Job id required"}
        })
      }
      if(!datelog){
        return res.status(400).json({
          success:false,
          error:{code:400,message:"datelog required"}
        })
      }
      
      let job = await db.jobs.findById(jobId);
      if(!job) {
        return res.status(400).json({message: "Invalid job!", code: 400});
      }
      if(job.status !== 'in-progress') {
        return res.status(400).json({message: "Invalid input job status!", code: 400});
      }

      if(inputDatelog.material) {
        for(let material of inputDatelog.material) {
          const inventoryMaterial = await db.materials.findById(material._id);
          if(material.quantity > inventoryMaterial.quantity) {
            return res.status(400).json({message: "Not enough materials", code: 400});
          }
        }
        for(let material of inputDatelog.material) {
          await db.materials.updateOne({_id: material._id}, {$dec: {quantity: Number(material.quantity)}});
        }
      }

      const datelogObj = await db.datelogs.findOne({job: jobId, date: inputDatelog.date});
      if(datelogObj) {
        if(inputDatelog.hours) {
          datelogObj.hours += Number(inputDatelog.hours);
        }
        if(inputDatelog.minutes) {
          datelogObj.minutes += Number(inputDatelog.minutes);
        }
        datelogObj.hours = Number(datelogObj.hours) + Number(datelogObj.minutes)/60;
        datelogObj.hours = Math.floor(datelogObj.hours);
        datelogObj.minutes = Number(datelogObj.minutes) % 60;
        datelogObj.minutes = Math.floor(datelogObj.minutes);
        if(inputDatelog.material) {
          datelogObj.material = datelogObj.material.concat(inputDatelog.material);
        }
        if(inputDatelog.completed_images) {
          datelogObj.completed_images = datelogObj.completed_images.concat(inputDatelog.completed_images);
        }
        await db.datelogs.updateOne({_id: datelogObj._id}, datelogObj);
      }
      else {
        const created = await db.datelogs.create({
          job: jobId,
          contractor: job.client,
          date: inputDatelog.date,
          hours:inputDatelog.hours,
          minutes:inputDatelog.minutes,
          material:inputDatelog.material,
          completed_images: inputDatelog.completed_images          
        });
        await db.jobs.updateOne({_id: jobId}, {
          $push: {datelog: created._id},
          datelogLastUpdated: inputDatelog.date
        });
      }
      const updateQuery = await combineJobDateLogs(job);
      await db.jobs.updateOne({_id: job._id}, updateQuery);
      return res.status(200).json({message: "Job marked completed successfully", code: 200}); 
    } catch(err) {
      return res.status(500).json({
        success:false,
        eror:{code:500, message:""+err}
      });
    }
  },
  daysWorkedList: async (req, res) => {
    const {jobId} = req.query;
    if(!jobId) {
      return res.status(400).json({message: "jobId required!", success: false});
    }
    try {
      const job = await db.jobs.findOne({_id: jobId}).populate('datelog');
      console.log(job);
      if(!job) {
        return res.status(400).json({message: "Job does not exist!", code: 400});
      } else {
        let {datelog} = job;
        return res.status(200).json({datelogs: datelog, success: true});
      }
    } catch(err) {
      return res.status(500).json({message: err.message, success: false});
    }
    
  },

  addExpense: async (req, res) => {
    let {travel_log, jobId, contractorId} = req.body;
    if(!travel_log || !jobId || !contractorId) {
      res.status(400).json({message: "travel_log or jobId or contractorId missing", success: false});
    }
    try {
      const job = await db.jobs.findById(jobId).populate('datelog');
      const contractor = await db.users.findById(contractorId).populate('cis_rate');
      console.log(contractor);
      const date_log = job.datelog;
      let hourlyRate = +contractor.hourlyRate;
      travel_log.sort((a, b) => new Date(a.date) - new Date(b.date));
      if(travel_log.length != date_log.length) {
        return res.status(400).json({message: "invalid travel log", success: false});
      }
      for(let i = 0;i<date_log.length; i++) {
        let payableDoc = {};
        payableDoc.date = new Date(date_log[i].date);
        payableDoc.job = jobId;
        payableDoc.contractor = contractorId;
        payableDoc.distance_travelled = travel_log[i].distance_travelled;
        payableDoc.labour_charges = (+hourlyRate)*(date_log[i].hours + date_log[i].minutes/60);
        payableDoc.status = "pending";
        payableDoc.cis_amt = (+contractor.cis_rate.rate) * (0.01) * (+payableDoc.labour_charges);
        payableDoc.travel_expense = await computeTravelCost(payableDoc.distance_travelled);
        payableDoc.other_expense = travel_log[i]?.other_expense;
        let total_other_expense = 0;
        total_other_expense = payableDoc.other_expense.reduce((tot, cur)=>tot + (+cur.amount), 0);
        console.log(payableDoc.labour_charges, payableDoc.cis_amt, payableDoc.travel_expense);
        payableDoc.net_payable =  payableDoc.labour_charges - payableDoc.cis_amt + payableDoc.travel_expense + total_other_expense;
        await db.contractor_payables.create(payableDoc);
      }
      
      await db.jobs.updateOne({_id:jobId}, {expenseAdded: true});
      return res.status(200).json({message: "expense added successfully", code: 200});
    }catch(err) {
      return res.status(500).json({message: err.message, success: false});
    }
    
  },
/*
  completeJob: async (req, res)=>{
    try{
      let {id}= req.body
      if(!id){
        return res.status(400).json({
          success:false,
          error:{code:400,message:"Job id required"}
        })
      }
      req.body.status = "completed"
      let job = await db.jobs.findById(id)
      let adminEmailPayload= {
        id:id,
        jobTitle:job?.title,
        contractorName:req.identity.fullName
      }
      jobEmails.jobCompleteEmailToAdmin(adminEmailPayload)
      let serviceTime = 0
      if(req.body.hours){
        serviceTime += Number(req.body.hours)*60 //Converting hours into minutes
      }

      if(req.body.minutes){
        serviceTime += Number(req.body.minutes)
      }

      if(serviceTime > 0){
        req.body.serviceTime = serviceTime
      }
      await db.jobs.updateOne({_id:id},req.body)
  
      return res.status(200).json({
        success:true
      })
    }catch(err){
      return res.status(500).json({
        success:false,
        eror:{code:500, message:""+err}
      })
    }
   
  }
*/
};
