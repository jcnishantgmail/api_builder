const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");


module.exports = {
  add: async (req, res) => {
    try {
      const data = req.body;
      if (!data.title) {
        return res.status(400).json({
          success: false,
          message: constants.SKILLS.PAYLOAD_MISSING
        });
      }
      data.title = data.title.toLowerCase();
      const existed = await db.skills.findOne({ title: data.title, isDeleted: false });

      if (existed) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.SKILLS.ALREADY_EXIST },
        });
      }
      data.addedBy = req.identity.id;
      const created = await db.skills.create(data);
      if (created) {
        return res.status(200).json({
          success: true,
          message: constants.SKILLS.CREATED
        });
      }
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },
  detail: async (req, res) => {
    try {
      let { id } = req.query
      if (!id) {
        return res.status(404).json({
          success: false,
          code: 400,
          error: { code: 400, message: constants.SKILLS.ID_MISSING },
        });
      }
      let detail = await db.skills.findById(id);
      return res.status(200).json({
        success: true,
        data: detail,
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
          message: constants.SKILLS.ID_MISSING
        });
      }
      let existed = await db.skills.findById(id);
      if (!existed) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.SKILLS.SKILL_NOT_EXIST },
        });
      }
      let query = {}
      query.isDeleted = false
      query._id = { $ne: id }
      if (data.title) {
        data.title = data.title.toLowerCase()
        query.title = data.title
        const existed = await db.skills.findOne(query);

        if (existed) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: constants.SKILLS.ALREADY_EXIST },
          });
        }
      }

      await db.skills.updateOne({ _id: id }, data);
      return res.status(200).send({
        success: true,
        message: constants.SKILLS.UPDATED
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
          error: { code: 404, message: constants.SKILLS.ID_MISSING },
        });
      }
        await db.skills.updateOne(
        { _id: id },
        { $set: { isDeleted: true } }
      );
      return res.status(200).json({
        success: true,
        message: constants.SKILLS.DELETED,
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error }
      });
    }
  },

  listing: async (req, res) => {
    try {
      const { search, page, count, sortBy, status, user_id } = req.query;
      var query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
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
            title: "$title",
            description: "$description",
            slug: "$slug",
            image: "$image",
            status: "$status",
            status: "$status",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
            isDeleted: "$isDeleted",
            addedBy: "$addedBy",
          },
        },
      ];
      const total = await db.skills.aggregate([...pipeline]);
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
      const result = await db.skills.aggregate([...pipeline]);

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
      let id = req.body.id;
      let status = req.body.status;
      if (!id) {
        return res.status(404).send({
          success: false,
          message: constants.SKILLS.ID_MISSING
        });
      }
      let existed = await db.skills.findById(id);
      if (!existed) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.SKILLS.SKILL_NOT_EXIST },
        });
      }

      await db.skills.updateOne({ _id: id }, { $set: { status: status } });
      return res.status(200).send({
        success: true,
        message: constants.COMMON.STATUS_CHANGED
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },

};














