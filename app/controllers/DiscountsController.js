const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");

module.exports = {
  add: async (req, res) => {
    try {
     
      let query = { isDeleted: false, name: req.body.name };
      let existed = await db.discounts.findOne(query);
      
      req.body.addedBy = req.identity.id;
      let created = await db.discounts.create(req.body);
      if (created) {
        return res.status(200).json({
          success: true,
        //   message: constants.discounts.CREATED
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
        error: { code: 500, message: "" + err },
      });
    }
  },

  detail: async (req, res) => {
    try {
      let { id } = req.query;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.discounts.ID_MISSING },
        });
      }
      const detail = await db.discounts.findById(id)

      return res.status(200).json({
        success: true,
        data: detail
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 500, message: "" + err },
      });
    }
  },

  update: async (req, res) => {
    try {
      const id = req.body.id;
      const data = req.body;

      const updatedStatus = await db.discounts.updateOne({ _id: id }, data);

      return res.status(200).json({
        success: true,
        message: constants.discounts.UPDATED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: "" + err },
      });
    }
  },

  delete: async (req, res) => {
    try {
      const id = req.query.id;
      
      const updatedStatus = await db.discounts.updateOne(
        { _id: id },
        { isDeleted: true }
      );

      return res.status(200).json({
        success: true,
        message: constants.discounts.DELETED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: "" + err },
      });
    }
  },

  listing: async (req, res) => {
    try {
      const { search, page, count, sortBy, status, addedBy, type, parent_discounts, discounts_type } = req.query;
      var query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
        ];
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
      if (status) {
        query.status = status;
      }
      if (type) { query.type = type }
      if (addedBy) {
        query.addedBy = new mongoose.Types.ObjectId(addedBy);
      }

      if (discounts_type == 'master') {
        query.parent_discounts = { $eq: null }
      }
      if (discounts_type == 'child') {
        query.parent_discounts = { $exists: true }
      }

      if (parent_discounts) { query.parent_discounts = new mongoose.Types.ObjectId(parent_discounts) }

      const pipeline = [
        {
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
          $project: {
            id: "$_id",
            name: "$name",
            discount_type: "$discount_type",
            amount_type: "$amount_type",
            discount_duration: "$discount_duration",
            amount_value: "$amount_value",
            user_id: "$user_id",
            discount_status: "$discount_status",
            addedByDetail: "$addedByDetail",
            status: "$status",

            
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
            isDeleted: "$isDeleted",
            addedBy: "$addedBy",
          },
        },
      ];

      const total = await db.discounts.aggregate([...pipeline]);

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

      const result = await db.discounts.aggregate([...pipeline]);

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
  },
  changeStatus: async (req, res) => {
    try {
      const id = req.body.id;
      const status = req.body.status;

      const updatedStatus = await db.discounts.updateOne(
        { _id: id },
        { status: status }
      );

      return res.status(200).json({
        success: true,
        message: constants.onBoarding.STATUS_CHANGED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: "" + err },
      });
    }
  },
};
