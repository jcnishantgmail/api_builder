"use strict";
const db = require("../models");
var mongoose = require("mongoose");

async function contactUsList(req, res) {
    try {
        const contactMessages = await db.contactus.find({});
        return res.status(200).json({contact: contactMessages, success: true});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    }
}

async function contactUsList(req, res) {
    try {
        let {search, page, count, sortBy, startDate, endDate, email, firstName, lastName} = req.query;
        var query = {};

        if (search) {
            query.$or = [{
                firstName: {$regex: search,$options: "i" },
                lastName: {$regex: search,$options: "i" },
                email: {$regex: search,$options: "i" },
                message: {$regex: search,$options: "i" }
            },];
        }

        if(email) {
            query.email = email;
        }

        if(firstName) {
            query.firstName = firstName;
        }

        if(lastName) {
            query.lastName = lastName;
        }

        if(startDate && endDate){
            startDate = new Date(startDate).setUTCHours(0,0,0,0)
            endDate = new Date(endDate).setUTCHours(23,59,59,0)
            query.createdAt = {$gte:new Date(startDate),$lte:new Date(endDate)}
        }

        query.isDeleted = false;
        var sortquery = {};
        if (sortBy) {
          var order = sortBy.split(" ");
          var field = order[0];
          var sortType = order[1];
        }
  
        sortquery[field ? field : "createdAt"] = sortType
          ? sortType == "desc"
            ? -1
            : 1
          : -1;
        
        const pipeline = [
          {
            $match: query,
          },
          {
            $sort: sortquery,
          },   
          {
            $project: {
              id: "$_id",
              firstName: "$firstName",
              lastName: "$lastName",
              email: "$email",
              message: "$message",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
            },
          },
        ];
        const total = await db.contactus.aggregate([...pipeline]);
        if (page && count) {
          var skipNo = (Number(page) - 1) * Number(count);
  
          pipeline.push(
            {
              $skip: Number(skipNo),
            },
            {
              $limit: Number(count),
            }
          );
        }
        console.log(pipeline);
        const result = await db.contactus.aggregate([...pipeline]);
  
        return res.status(200).json({
          success: true,
          data: result,
          total: total.length,
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: { code: 500, message: "" + err },
        });
      }
}


async function contactUsDelete(req, res) {
    const { contactUsId } = req.query;
    if(!contactUsId) {
        return res.status(400).json({message: "contactUsId required!", code: 400});
    }
    try {
        const existing = await db.contactus.findOne({_id: contactUsId, isDeleted: false});
        if(!existing) {
            return res.status(404).json({message: "Message does not exist!", code: 404});
        }
        await db.contactus.updateOne({_id: contactUsId}, {isDeleted: true});
        return res.status(200).json({message: "Message deleted successfully", code: 200});
    } catch(err) {
        return res.status(err.code).json({message: err.message, success: false});
    } 
}

async function contactUsDetail(req, res) {
    const { contactUsId } = req.query;
    if(!contactUsId) {
        return res.status(400).json({message: "contactUsId required!", code: 400});
    }
    try {
        const detail = await db.contactus.findOne({_id: contactUsId, isDeleted: false});
        if(!detail) {
            return res.status(404).json({code: 404, message: "Message not found!"});
        }
        return res.status(200).json({detail: detail, code: 200});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    }
}

async function contactUsAdd(req, res) {
    const { firstName, lastName, email, message } = req.body;
    try {
        const created = await db.contactus.create({firstName, lastName, email, message});
        return res.status(200).json({code: 200, message: "Message sent successfully!"});
    } catch(err) {
        return res.status(err.code).json({message: err.message, code: err.code});
    }
    
}
module.exports = {
    contactUsList,
    contactUsDelete,
    contactUsDetail,
    contactUsAdd
};