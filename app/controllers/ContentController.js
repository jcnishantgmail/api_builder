const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");
const helper = require("../utls/helper");
const services = require("../services");

module.exports = {
  add: async (req, res) => {
    try {
      const data = req.body;
      if (!data.title || !data.description) {
        return res.status(400).json({
          success: false,
          message: constants.Blog.PAYLOAD_MISSING,
        });
      }
      data.title = data.title.toLowerCase();
      const existingCMS = await db.cms.findOne({
        title: data.title,
        isDeleted: false,
      });

      if (existingCMS) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.CMS.ALREADY_EXIST },
        });
      }
      data.addedBy = req.identity.id;
      data.slug = await helper.generateSlug(data.title);
      const createCMS = await db.cms.create(data);
      if (createCMS) {
        return res.status(200).json({
          success: true,
          message: constants.CMS.CREATED,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },
  detail: async (req, res) => {
    try {
      let { id, slug } = req.query;
      if (!id && !slug) {
        return res.status(404).json({
          success: false,
          code: 400,
          error: { code: 400, message: constants.CMS.ID_MISSING },
        });
      }

      let query = {isDeleted:false}
      
      if(slug){
        query.slug = slug
      }else{
        query._id = id
      }
      let cmsDetails = await db.cms.findOne(query);
      return res.status(200).json({
        success: true,
        data: cmsDetails,
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },

  update: async (req, res) => {
    try {
      let data = req.body;
      let id = req.body.id;
      if (!id) {
        return res.status(404).send({
          success: false,
          message: constants.CMS.ID_MISSING,
        });
      }
      let cmsExist = await db.cms.findById(id);
      if (!cmsExist) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.CMS.CMS_NOT_EXIST },
        });
      }
      let query = {};
      query.isDeleted = false;
      query._id = { $ne: id };
      if (data.title) {
        data.title = data.title.toLowerCase();
        query.title = data.title;
        const existingCMS = await db.cms.findOne(query);

        if (existingCMS) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: constants.CMS.ALREADY_EXIST },
          });
        }
        data.slug = await helper.generateSlug(data.title);
      }
      let updateCMS = await db.cms.updateOne({ _id: id }, data);
      return res.status(200).send({
        success: true,
        message: constants.CMS.UPDATED,
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },

  delete: async (req, res) => {
    try {
      let id = req.query.id;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: { code: 404, message: constants.CMS.ID_MISSING },
        });
      }
      let updateStatus = await db.cms.updateOne(
        { _id: id },
        { $set: { isDeleted: true } }
      );
      return res.status(200).json({
        success: true,
        message: constants.CMS.DELETED,
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },
  listing: async (req, res) => {
    try {
      const { search, page, count, sortBy, status, user_id } = req.query;
      let query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      query.isDeleted = false;

      let sortquery = {};
      if (sortBy) {
        const [field = "createdAt", sortType = "desc"] = sortBy.split(" ");
        sortquery[field] = sortType === "desc" ? -1 : 1;
      } else {
        sortquery.createdAt = -1;
      }

      if (status) {
        query.status = status;
      }

      const pipeline = [
        { $match: query },
        { $sort: sortquery },
        {
          $lookup: {
            from: "cms",
            localField: "addedBy",
            foreignField: "_id",
            as: "addedByDetail",
          },
        },
        {
          $unwind: { path: "$addedByDetail", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            id: "$_id",
            title: "$title",
            description: "$description",
            slug: "$slug",
            meta_title: "$meta_title",
            meta_description: "$meta_description",
            meta_keyword: "$meta_keyword",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
            isDeleted: "$isDeleted",
            status: "$status",
            addedBy: "$addedBy",
          },
        },
      ];

      const total = await db.cms.aggregate([...pipeline]);

      if (page && count) {
        const skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({ $skip: skipNo }, { $limit: Number(count) });
      }

      const result = await db.cms.aggregate([...pipeline]);

      return res.status(200).json({
        success: true,
        data: result,
        total: total.length,
      });
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({
        success: false,
        error: { code: 500, message: err.message },
      });
    }
  },

  statusUpdate: async (req, res) => {
    try {
      let id = req.body.id;
      let status = req.body.status;
      if (!id) {
        return res.status(404).send({
          success: false,
          message: constants.CMS.ID_MISSING,
        });
      }
      let cmsExist = await db.cms.findById(id);
      if (!cmsExist) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.CMS.CMS_NOT_EXIST },
        });
      }

      let updatecms = await db.cms.updateOne(
        { _id: id },
        { $set: { status: status } }
      );
      return res.status(200).send({
        success: true,
        message: constants.COMMON.STATUS_CHANGED,
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },
};
