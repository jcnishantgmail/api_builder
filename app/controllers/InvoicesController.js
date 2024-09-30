const db = require("../models");
const constants = require("../utls/constants");
const invoiceEmails = require("../Emails/invoiceEmails")
const helpers = require('../utls/helper');
var mongoose = require("mongoose");

module.exports = {

  add: async (req, res) => {
    try {
      if (!req.body.jobId) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.INVOICES.PAYLOAD_MISSING
          },
        });
      }
      let data = req.body
      let job = await db.jobs.findById(mongoose.Types.ObjectId.createFromHexString(req.body.jobId))
      if(!job){
        return res.status(404).json({
            success:false,
            error:{code:400,message:"Job not found."}
        })
      }
      let invc = await db.invoices.findOne({jobId: req.body.jobId});
      if(invc) {
        return res.status(400).json({code:400, message: "Invoice for this job already exists!"});
      }
      data.client = job.client
      data.property = job.property
      req.body.addedBy = req.identity.id;
      data.invoiceNumber = "Invoice-" + (await db.invoices.countDocuments({}) + 1);  //Gernerating invoice number
      if(data.total)
        data.total = (Math.ceil(data.total * 100) / 100); //Rounding up to 2 decimals pound.pennies
      let created = await db.invoices.create(req.body);
      if (created) {
        const user = await db.users.findById(data.client);
        data.email = user["email"];
        data.fullName = user["fullName"] ? user["fullName"] : user["firstName"];
        data.creationTime = helpers.formatCreatedAt(created.createdAt);
        data.invoiceId = created["_id"];
        invoiceEmails.sendInvoiceMail(data);
        await db.invoices.updateOne({_id: created["_id"]},{status: "sent"});  //email sent
        console.log(data);
        return res.status(200).json({
          success: true,
          message: constants.INVOICES.CREATED
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Some issue exists",
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
            message: constants.INVOICES.ID_MISSING
          },
        });
      }
      const detail = await db.invoices.findById(id).populate('client').populate('property').populate('jobId')

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
      if(data.total)
        data.total = (Math.ceil(data.total * 100) / 100); //Rounding up to 2 decimals pound.pennies for stripe

      await db.invoices.updateOne({_id: id}, data);

      return res.status(200).json({
        success: true,
        message: constants.INVOICES.UPDATED,
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

      const updatedStatus = await db.invoices.updateOne({
        _id: id
      }, {
        isDeleted: true
      });
      if (updatedStatus) {
        return res.status(200).json({
          success: true,
          message: constants.INVOICES.DELETED,
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
        property,
        
      } = req.query;
      var query = {};

      if (search) {
        query.$or = [{
            invoiceNumber: {
            $regex: search,
            $options: "i"
          }
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
      if (property) {
        query.property = mongoose.Types.ObjectId.createFromHexString(property)
      }

      const pipeline = [{
        $match: query,
      },
      {
        $sort: sortquery,
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
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job_detail",
        },
      },

      {
        $unwind: {
          path: "$job_detail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$_id",
          job_detail: "$job_detail",
          sentDate: "$sentDate",     
          client_detail: "$client_detail",
          status: "$status",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          isDeleted: "$isDeleted",
          addedBy: "$addedBy",
          addedByName: "$addedByDetail.fullName",
          supplier_detail:"$supplier_detail",
          "paidDate":"$paidDate",
          paymentType:"$paymentType",
          invoiceNumber:"$invoiceNumber",
          total:"$total"
        },
      },
      ];

      const total = await db.invoices.aggregate([...pipeline]);

      if (page && count) {
        var skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({
          $skip: Number(skipNo),
        }, {
          $limit: Number(count),
        });
      }

      const result = await db.invoices.aggregate([...pipeline]);

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

      await db.invoices.updateOne({
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

  resendInvoice: async (req ,res) => {
    try {
      const { invoiceId } = req.body;
      const invoice = await db.invoices.findById(invoiceId);
      const user = await db.users.findById(invoice["client"]);
      invoice.fullName = user.fullName? user.fullName: user.firstName;
      invoice.email = user.email;
      invoice.creationTime = helpers.formatCreatedAt(invoice.createdAt);
      invoiceEmails.sendInvoiceMail(invoice);
      res.status(200).json({
        success: true,
        message: constants.INVOICES.SENT_AGAIN
      });

    } catch (err) {
      res.status(500).json({code: 500,message: "" + err});
    }
    
  }

};
