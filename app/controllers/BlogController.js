const db = require("../models");
const constants = require("../utls/constants");
const helper = require("../utls/helper")


module.exports = {
  addBlog: async (req, res) => {
    try {
      const data = req.body;
      if (!data.title || !data.description) {
        return res.status(400).json({
          success: false,
          message: constants.Blog.PAYLOAD_MISSING
        });
      }
      data.title = data.title.toLowerCase();
      data.slug = await helper.slugify(req.body.title)
      const existingBlog = await db.blog.findOne({ title: data.title, isDeleted: false });

      if (existingBlog) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.Blog.ALREADY_EXIST },
        });
      }
      data.addedBy = req.identity.id;
      const createBlog = await db.blog.create(data);
      if (createBlog) {
        return res.status(200).json({
          success: true,
          message: constants.Blog.CREATED
        });
      }
    } catch (error) {
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },
  blogDetails: async (req, res) => {
    try {
      let { id } = req.query
      if (!id) {
        return res.status(404).json({
          success: false,
          code: 400,
          error: { code: 400, message: constants.Blog.ID_MISSING },
        });
      }
      let blogDetails = await db.blog.findById(id);
      return res.status(200).json({
        success: true,
        data: blogDetails,
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },

  updateBlog: async (req, res) => {
    try {
      let data = req.body;
      let id = req.body.id;
      if (!id) {
        return res.status(404).send({
          success: false,
          message: constants.Blog.ID_MISSING
        });
      }
      let blogExist = await db.blog.findById(id);
      if (!blogExist) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.Blog.BLOG_NOT_EXIST },
        });
      }
      let query = {}
      query.isDeleted = false
      query._id = { $ne: id }
      if (data.title) {
        data.title = data.title.toLowerCase()
        query.title = data.title
        const existingBlog = await db.blog.findOne(query);

        if (existingBlog) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: constants.Blog.ALREADY_EXIST },
          });
        }
      }

      let updateblog = await db.blog.updateOne({ _id: id }, data);
      return res.status(200).send({
        success: true,
        message: constants.Blog.UPDATED
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        error: { code: 500, message: "" + error },
      });
    }
  },

  deleteBlog: async (req, res) => {
    try {
      let id = req.query.id;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: { code: 404, message: constants.Blog.ID_MISSING },
        });
      }
      let updateStatus = await db.blog.updateOne(
        { _id: id },
        { $set: { isDeleted: true } }
      );
      return res.status(200).json({
        success: true,
        message: constants.Blog.DELETED,
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
          $lookup: {
            from: "blog",
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
      const total = await db.blog.aggregate([...pipeline]);
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
      const result = await db.blog.aggregate([...pipeline]);

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
  blogStatusUpdate: async (req, res) => {
    try {
      let data = req.body;
      let id = req.body.id;
      let status = req.body.status;
      if (!id) {
        return res.status(404).send({
          success: false,
          message: constants.Blog.ID_MISSING
        });
      }
      let blogExist = await db.blog.findById(id);
      if (!blogExist) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constants.Blog.BLOG_NOT_EXIST },
        });
      }

      let updateblog = await db.blog.updateOne({ _id: id }, { $set: { status: status } });
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














