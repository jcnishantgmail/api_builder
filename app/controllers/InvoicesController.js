const db = require("../models");
const constants = require("../utls/constants");
const invoiceEmails = require("../Emails/invoiceEmails")
const helpers = require('../utls/helper');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var mongoose = require("mongoose");
const { checkoutSessionHandler } = require('../services/paymentService');


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
      let job = await db.jobs.findById(mongoose.Types.ObjectId.createFromHexString(req.body.jobId)).populate('property');
      
      if(!job){
        return res.status(404).json({
            success:false,
            error:{code:400,message:"Job not found."}
        })
      }
      
      let invc = await db.invoices.findOne({jobId: req.body.jobId, isDeleted: false});
      if(invc) {
        return res.status(400).json({code:400, message: "Invoice for this job already exists!"});
      }
      data.client = job.client;
      req.body.addedBy = req.identity.id;
      data.invoiceNumber = (await db.invoices.countDocuments({}) + 1);  //Generating invoice number
      if(data.total)
        data.total = Number(data.total).toFixed(2); //Rounding up to 2 decimals pound.pennies
      let created = await db.invoices.create(req.body);
      const client = await db.users.findById(data.client);
      created.email = client["email"];
      await db.jobs.updateOne({_id: req.body.jobId}, {invoice: created._id, isInvoiceGenerated: true});
      console.log("created - ", created);
      invoiceEmails.sendInvoiceMail(created);
      await db.invoices.updateOne({_id: created["_id"]},{status: "sent", dueDate: created.dueDate.setUTCHours(23, 59, 59, 0)});  //email sent
      return res.status(200).json({
        success: true,
        message: constants.INVOICES.CREATED
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
      const detail = await db.invoices.findOne({_id: id, isDeleted: false}).populate('client').populate('addedBy').populate({
        path: 'jobId',
        populate: {
          path: "contractor"
        }});
      if(!detail) {
        return res.status(404).json({message: "Invoice not found!", code: 404});
      }
      return res.status(200).json({
        code: 200,
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
      const existing = await db.invoices.findOne({_id:id, isDeleted: false});
      if(!existing) {
        return res.status(404).json({message: "Invoice to be deleted doesn't exist!", code: 404});
      }
      const updatedStatus = await db.invoices.updateOne({
        _id: id
      }, {
        isDeleted: true
      });
      if (updatedStatus) {
        await db.jobs.updateOne({_id: existing.jobId}, {isInvoiceGenerated: false});
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
      let {
        search,
        page,
        count,
        sortBy,
        status,
        addedBy,
        client,
        jobId,
        startDate,
        endDate
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
      if(jobId) {
        query.jobId = mongoose.Types.ObjectId.createFromHexString(jobId);
      }
      if(startDate && endDate) {
        startDate = new Date(startDate).setUTCHours(0, 0, 0, 0);
        endDate = new Date(endDate).setUTCHours(23, 59, 59, 0);
        query.createdAt = {$gte:new Date(startDate),$lte:new Date(endDate)}
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
          isInvoiceGenerated:"$isInvoiceGenerated",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          isDeleted: "$isDeleted",
          addedBy: "$addedByDetail",
          addedByName: "$addedByDetail.fullName",
          "paidDate":"$paidDate",
          paymentType:"$paymentType",
          invoiceNumber:"$invoiceNumber",
          services: "$services",
          materials: "$materials",
          total:"$total",
          datelog: "$datelog",
          dueDate: "$dueDate",
          terms: "$terms",   
          labour_charge: "$labour_charge",
          subtotal: "$subtotal",
          vat_total: "$vat_total",
          total: "$total",
          balance_due: "$balance_due",
          createdAt: "$createdAt",
          logoURL: 1
        }
      },
      ];

      let grouped = await db.invoices.aggregate([...pipeline, {
        $group: {
          _id: null,
          vat_total_overall: {$sum: "$vat_total"}
        }
      }]);

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
        vat_total_overall: grouped[0]?grouped[0].vat_total_overall:0,
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
      let invoice = await db.invoices.findOne({_id: invoiceId}).populate('client');
      let data = Object.assign({}, invoice._doc);
      data.email = invoice.client.email;
      invoiceEmails.sendInvoiceMail(data);
      res.status(200).json({
        success: true,
        message: constants.INVOICES.SENT_AGAIN
      });

    } catch (err) {
      res.status(500).json({code: 500,message: "" + err});
    }
    
  },


  payInvoice: async function(req, res) {
    try {
      const {invoiceId} = req.body;
      const invoice = await db.invoices.findOne({_id: invoiceId}).populate('jobId');
      if(!invoice) {
        return res.status(404).json({message: "Invoice does not exist!", code: 404});
      }
      if(invoice.status === 'Completed') {
        return res.status(400).json({message: "The invoice has already been paid!", code: 400});
      }
      if(invoice.status === 'sent' && new Date() < invoice.dueDate) {
        const session = await checkoutSessionHandler(invoice);
        return res.redirect(session.url);
      } else {
        return res.redirect(process.env.FRONT_WEB_URL);
      }
    } catch(err) {
      return res.status(500).json({message: err.message, code: 500});
    }
  }

};
