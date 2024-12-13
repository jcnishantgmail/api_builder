const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");
const jobEmails = require("../Emails/jobEmails");
const { computeTravelCost, computeHourlyRate, computeCISRate } = require("../services/jobServices");


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
      let client = await db.users.findOne({_id: req.body.client, isDeleted: false});
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
      jobEmails.adminEmailForNewJob({id:created._id,clientName:client.fullName,jobTitle:created.title,description:created.description,location:formattedLocation})
      if (created) {
        let adder = await db.users.findOne({_id: req.identity.id, isDeleted: false}).populate('role');
        if(adder.role.name === "Admin" && created.contractor && created.expectedTime) {
          let endDate = new Date(new Date(created.preferedTime).setUTCHours(0, 0, 0, 0));
          endDate.setDate(endDate.getDate() - 1 + Math.floor(created.expectedTime/8) + (created.expectedTime%8 === 0? 0: 1));
          // await db.schedules.create({
          //   contractor: created.contractor,
          //   job: created._id,
          //   startDate: created.preferedTime,
          //   endDate: endDate,
          //   totalHours: created.expectedTime
          // });

          await Promise.all(
            created.contractor.map((contractorId) =>
              db.schedules.create({
                contractor: contractorId,
                job: created._id,
                startDate: created.preferedTime,
                endDate: endDate,
                totalHours: created.expectedTime,
              })
            )
          );
          
        }

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
      let detail = await db.jobs.findById(id).populate('addedBy' , 'id fullName email').populate('client' , 'id fullName email hourlyRate').populate('contractor' , 'id fullName email').populate('property').populate('category');
      detail = detail.toObject();
      detail.expense = await db.contractor_payables.find({job: id, isDeleted: false}).populate('contractor');
      
      if(detail.expense) {
        detail.expense = detail.expense.sort((a, b) => {
          return a.date - b.date;
        });

        detail.serviceDatelogs = detail.expense.filter((expenseLog)=>{
          return !(expenseLog.hours === 0);
        }).map((expenseLog)=>{
          let hours = +Math.floor(expenseLog.hours);
          let minutes = Math.floor((+expenseLog.hours - hours)*60);
          return {
            job: id,
            client: detail.client,
            contractor: expenseLog.contractor,
            date: expenseLog.date,
            hours:hours,
            minutes:minutes,
            completed_images: expenseLog.completed_images
          };
        });
      }
      detail.materialsDatelogs = await db.materialDatelogs.find({job: id}).populate('material').populate('contractor');
      
      if(detail.materialDatelogs) {
        detail.materialDatelogs = detail.materialDatelogs.sort((a, b) => {
          return a.date - b.date;
        });
      }

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
      let data = req.body;
      let {expectedTime} = req.body;
      let job = await db.jobs.findOne({_id: id});
      if(expectedTime) {
        let endDate = new Date(new Date(job.preferedTime).setUTCHours(0, 0, 0, 0));
        endDate.setDate(endDate.getDate() - 1 + Math.floor(expectedTime/8) + (expectedTime%8 === 0? 0: 1));
        await db.schedules.updateMany({job: id}, {expectedTime: expectedTime, endDate: endDate});
      }

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
        $lookup: {
          from: "contractor_payables",
          localField: "_id",
          foreignField: "job",
          as: "serviceDatelogs"
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
          addedByDetail: "$addedByDetail",
          addedByName: "$addedByDetail.fullName",
          addedByEmail: "$addedByDetail.email",
          isInvoiceGenerated:"$isInvoiceGenerated",
          clientDetail: "$client_detail",
          clientName:"$client_detail.fullName",
          clientEmail:"$client_detail.email",
          contractor:"$contractor",
          contractorDetail: "$contractor_detail",
          preferedTime:"$preferedTime",
          hours:"$hours",
          minutes:"$minutes",
          serviceDatelogs: "$serviceDatelogs",
          invoice: 1,
          expectedTime: 1
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
      let {id , contractor, preferedTime, expectedTime} = req.body
      if(!contractor){
        contractor = [];
      }
      if(expectedTime) {
        await db.jobs.updateOne({_id: id}, {expectedTime: expectedTime});
        let jobSchedule = await db.schedules.find({job: id});
        let endDate = new Date(new Date(preferedTime).setUTCHours(0, 0, 0, 0));
        endDate.setDate(endDate.getDate() - 1 + Math.floor(expectedTime/8) + (expectedTime%8 === 0? 0: 1));
        if(jobSchedule) {
          await db.schedules.updateMany({
            job: id
          },
          {
            isDeleted: true
          }
        );
          await Promise.all(
            contractor.map((contractorId) =>
              db.schedules.create({
                contractor: contractorId,
                job: id,
                startDate: preferedTime,
                endDate: endDate,
                totalHours: expectedTime
              })
            )
          );
        }
        else {
          await Promise.all(
            contractor.map((contractorId) =>
              db.schedules.create({
                contractor: contractorId,
                job: id,
                startDate: preferedTime,
                endDate: endDate,
                totalHours: expectedTime,
              })
            )
          );
        }
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
      let timeChanged = false;
      if(job.preferedTime.getTime() != preferedTime.getTime()) {
        await db.jobs.updateOne({_id: id}, {preferedTime});
        timeChanged = true;
      }
      let description = String(job.description);
      if(contractor){
        let contractorDetail = await db.users.find({_id: {$in: contractor}, isDeleted: false});
        for(let individualContractor of contractorDetail) {
          jobEmails.jobAssignToContractor({
            jobTitle:job.title,
            description:job.description.slice(3, -4),
            email:individualContractor.email,
            fullName:individualContractor.fullName,
            location:formattedLocation,
            id:job._id
          });
        }
        
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
          description: description.slice(3, -4),
          email: clientDetail.email,
          clientFullName: clientDetail.fullName,
          contractorDetail: contractorDetail,
          location: formattedLocation,
          timeChanged,
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
      let { jobId, contractorId, date, materialDatelogs, expense } = req.body;
      if(!jobId || !date || !contractorId) {
        return res.status(400).json({message: "Job Id, contractor Id and date required!", code: 400, success: false});
      }
      const contractor = await db.users.findOne({_id: contractorId, isDeleted: false}).populate('cis_rate');
      if(!contractor) {
        return res.status(404).json({message: "Contractor not found!", success: false});
      }
      const job = await db.jobs.findOne({_id: jobId});
      if(!job) {
        return res.status(404).json({message: "Job not found!", code: 404, success: false});
      }
      if(job.status !== 'in-progress') {
        return res.status(400).json({message: "Job is not in progress!", code: 400, success: false});
      }
      if(expense) {
        let hours = (+expense.hours + (+expense.minutes)/60);
        let labour_charge = ((+contractor.hourlyRate)*(hours)).toFixed(2);
        let cis_amt = (0.01) * (+contractor.cis_rate.rate) * (+labour_charge);
        let travel_expense = await computeTravelCost(+expense.distance_travelled);
        travel_expense = +travel_expense;
        let other_expense_total_self = expense.other_expense.filter((cur)=>cur.source === "self").reduce((tot, cur)=>{
          return (+tot) + (+cur.amount);
        }, 0);
        other_expense_total_self = +other_expense_total_self.toFixed(2);
        let other_expense_total_company = expense.other_expense.filter((cur)=>cur.source === "company").reduce((tot, cur)=>{
          return (+tot) + (+cur.amount);
        }, 0);
        other_expense_total_company = +other_expense_total_company.toFixed(2);
        let net_payable = (+labour_charge) + (+travel_expense) + (+other_expense_total_self) - (+cis_amt);
        net_payable = +net_payable.toFixed(2);
        let expenseObj = {
          job: jobId,
          date: date,
          contractor: contractorId,
          hours: hours,
          status: "unpaid",
          completed_images: expense.completed_images,
          distance_travelled: expense.distance_travelled,
          labour_charge: labour_charge,
          cis_amt: cis_amt,
          travel_expense: travel_expense,
          other_expense: expense.other_expense,
          other_expense_total_self: other_expense_total_self,
          other_expense_total_company: other_expense_total_company,
          net_payable: net_payable
        }
        job.completed_images = expense.completed_images.concat(expense.completed_images);
        await db.jobs.updateOne({_id: jobId}, {completed_images: job.completed_images});
        //create a contractor payable for this
        let createdPayable = await db.contractor_payables.create(expenseObj);
        if(!job.hasMultipleExpenseEntries) {
          let expenseRecords = await db.contractor_payables.find({job: jobId});
          if(expenseRecords.length > 1) {
            await db.jobs.updateOne({_id: jobId}, {hasMultipleExpenseEntries: true});
          }
        }
        jobEmails.expenseAddedEmailToAdmin({
          contractorFullName: contractor.fullName,
          jobTitle: job.title,
          expenseDate: date
        });
      }
      if(materialDatelogs) {
        materialDatelogs = materialDatelogs.map(materialDatelog => {
          materialDatelog.job = jobId;
          materialDatelog.contractor = contractorId;
          materialDatelog.date = date;
          return materialDatelog;
        });
        await db.materialDatelogs.insertMany(materialDatelogs);
      }

      return res.status(200).json({success: true, message: "Job logged successfully", code: 200});

    } catch(err) {
      return res.status(500).json({success: false, message: err.message, code: 500});
    }
  },

  completejob: async (req, res) => {
    try {
      let { jobId, contractorId, date, materialDatelogs, expense } = req.body;
      if(!jobId || !date || !contractorId) {
        return res.status(400).json({message: "Job Id, contractor Id and date required!", code: 400, success: false});
      }
      const contractor = await db.users.findOne({_id: contractorId, isDeleted: false}).populate('cis_rate');
      const job = await db.jobs.findOne({_id: jobId});
      if(!job) {
        return res.status(404).json({message: "Job not found!", code: 404, success: false});
      }
      if(job.status !== 'in-progress') {
        return res.status(400).json({message: "Job is not in progress!", code: 400, success: false});
      }

      if(expense) {
        let hours = (+expense.hours + (+expense.minutes)/60);
        let labour_charge = ((+contractor.hourlyRate)*(hours)).toFixed(2);
        let cis_amt = (0.01) * (+contractor.cis_rate.rate) * (+labour_charge);
        let travel_expense = await computeTravelCost(+expense.distance_travelled);
        travel_expense = +travel_expense;
        let other_expense_total_self = expense.other_expense.filter((cur)=>cur.source === "self").reduce((tot, cur)=>{
          return (+tot) + (+cur.amount);
        }, 0);
        other_expense_total_self = +other_expense_total_self.toFixed(2);
        let other_expense_total_company = expense.other_expense.filter((cur)=>cur.source === "company").reduce((tot, cur)=>{
          return (+tot) + (+cur.amount);
        }, 0);
        other_expense_total_company = +other_expense_total_company.toFixed(2);
        let net_payable = (+labour_charge) + (+travel_expense) + (+other_expense_total_self) - (+cis_amt);
        net_payable = +net_payable.toFixed(2);
        let expenseObj = {
          job: jobId,
          date: date,
          contractor: contractorId,
          hours: hours,
          status: "unpaid",
          completed_images: expense.completed_images,
          distance_travelled: expense.distance_travelled,
          labour_charge: labour_charge,
          cis_amt: cis_amt,
          travel_expense: travel_expense,
          other_expense: expense.other_expense,
          other_expense_total_self: other_expense_total_self,
          other_expense_total_company: other_expense_total_company,
          net_payable: net_payable
        }

        if(materialDatelogs) {
          materialDatelogs = materialDatelogs.map(materialDatelog => {
            materialDatelog.job = jobId;
            materialDatelog.contractor = contractorId;
            materialDatelog.date = date;
            return materialDatelog;
          });
          await db.materialDatelogs.insertMany(materialDatelogs);
        }
        
        job.completed_images = expense.completed_images.concat(expense.completed_images);
        await db.jobs.updateOne({_id: jobId}, {completed_images: job.completed_images});
        //create a contractor payable for this
        let createdPayable = await db.contractor_payables.create(expenseObj);
        if(!job.hasMultipleExpenseEntries) {
          let expenseRecords = await db.contractor_payables.find({job: jobId});
          if(expenseRecords.length > 1) {
            await db.jobs.updateOne({_id: jobId}, {hasMultipleExpenseEntries: true});
          }
        }
        jobEmails.expenseAddedEmailToAdmin({
          contractorFullName: contractor.fullName,
          jobTitle: job.title,
          expenseDate: date
        });
      }

      let service_logs = await db.contractor_payables.find({job: jobId});
      let actualHours = 0;
      for(let log of service_logs) {
        actualHours += +(log.hours);
      }
      actualHours = +actualHours.toFixed(2);
      await db.schedules.updateMany({job: jobId}, {endDate: new Date(date).setUTCHours(0, 0 , 0, 0), actualHours});
      await db.jobs.updateOne({_id: jobId}, {status: "completed"});
      return res.status(200).json({message: "Job logged successfully", code: 200, success: true});
    } catch(err) {
      return res.status(500).json({message: err.message, code: 500, success: false});
    }
  },

  editJob: async (req, res) => {
    try {
      const id = req.body.id;
      let data = req.body;
      let {expectedTime, expense, materialDatelogs} = req.body;
      let job = await db.jobs.findOne({_id: id});
      if(expectedTime) {
        let endDate = new Date(new Date(job.preferedTime).setUTCHours(0, 0, 0, 0));
        endDate.setDate(endDate.getDate() - 1 + Math.floor(expectedTime/8) + (expectedTime%8 === 0? 0: 1));
        await db.schedules.updateMany({job: id}, {expectedTime: expectedTime, endDate: endDate});
      }

      if(materialDatelogs) {
        let materialDatelogsWithoutId = materialDatelogs.filter((datelog) => {
          return !("_id" in datelog);
        });
        let materialDatelogsWithId = materialDatelogs.filter((datelog) => {
          return ("_id" in datelog);
        });
        let inputIds = materialDatelogsWithId.map((datelog) => {
          return mongoose.Types.ObjectId.createFromHexString(datelog._id);
        });
        // Delete materialDatelogs that are not in input
        await db.materialDatelogs.deleteMany({
          job: id,
          _id: {
            $nin: inputIds
          }
        });

        //Update material datelogs that have that have _id
        const operations = materialDatelogsWithId.map((datelog) => ({
          updateOne: {
            filter: { _id: datelog._id },
            update: { $set: datelog },
          },
        }));

        let result = await db.materialDatelogs.bulkWrite(operations);
        let materialDatelogsToBeInserted = materialDatelogsWithoutId.map(materialDatelog => {
          materialDatelog.job = id;
          return materialDatelog;
        });
        if(materialDatelogsToBeInserted)
          await db.materialDatelogs.insertMany(materialDatelogsToBeInserted);
      }

      if(expense) { 
        let contractorRoleId = await db.roles.findOne({name: "Contractor"});
        let contractorsList = await db.users.find({role: contractorRoleId, isDeleted: false}).populate('cis_rate');
        expense = await Promise.all(
          expense.map(async (expenseLog) => {
            // Calculate hours including minutes
            expenseLog.job = id;
            expenseLog.hours = +expenseLog.hours + (+expenseLog.minutes) / 60;
            // Compute hourly rate and CIS rate
            let hourlyRate = computeHourlyRate(contractorsList, expenseLog.contractor, expenseLog.date);
            let cisRate = computeCISRate(contractorsList, expenseLog.contractor, expenseLog.date);
            // Calculate labor charge
            expenseLog.labour_charge = (+hourlyRate * expenseLog.hours).toFixed(2);
            // Calculate CIS amount
            const cisAmt = (0.01 * +cisRate * +expenseLog.labour_charge).toFixed(2);
            expenseLog.cis_amt = +cisAmt;
            // Compute travel expense (awaited)
            expenseLog.travel_expense = await computeTravelCost(+expenseLog.distance_travelled);
            // Calculate other expenses total
            expenseLog.other_expense_total_company = expenseLog.other_expense.filter((cur)=>cur.source === "company").reduce(
              (tot, cur) => +tot + +cur.amount,
              0
            );
            expenseLog.other_expense_total_company = +expenseLog.other_expense_total_company.toFixed(2);
            expenseLog.other_expense_total_self = expenseLog.other_expense.filter((cur)=>cur.source === "self").reduce(
              (tot, cur) => +tot + +cur.amount,
              0
            );
            expenseLog.other_expense_total_self = +expenseLog.other_expense_total_self.toFixed(2);
            // Compute net payable
            expenseLog.net_payable = (
              +expenseLog.labour_charge +
              +expenseLog.travel_expense +
              +expenseLog.other_expense_total_self -
              +expenseLog.cis_amt
            ).toFixed(2);
      
            return expenseLog;
          }));
        let expenselogsWithoutId = expense.filter((expenseLog) => {
          return !("_id" in expenseLog);
        });
        let expenselogsWithId = expense.filter((expenseLog) => {
          return ("_id" in expenseLog);
        });
        let inputIds = expenselogsWithId.map((expenseLog) => {
          return mongoose.Types.ObjectId.createFromHexString(expenseLog._id);
        });
        // Delete materialDatelogs that are not in input
        await db.contractor_payables.deleteMany({
          job: id,
          _id: {
            $nin: inputIds
          }
        });
        //update existing expense logs
        const operations = expenselogsWithId.map((expenseLog) => ({
          updateOne: {
            filter: { _id: expenseLog._id },
            update: { $set: expenseLog },
          },
        }));

        let result = await db.contractor_payables.bulkWrite(operations);
        //Insert new expense logs
        if(expenselogsWithoutId)
          await db.contractor_payables.insertMany(expenselogsWithoutId);
      }

      await db.jobs.updateOne({_id: id}, data);

      return res.status(200).json({
        success: true,
        message: constants.JOBS.UPDATED,
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
  }

};

