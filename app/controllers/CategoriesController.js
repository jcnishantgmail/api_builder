const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");
const response = require('../services/Response');
const helper = require("../utls/helper")

module.exports = {

  add: async (req, res) => {
    try {
      if (!req.body.name) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.CATEGORY.PAYLOAD_MISSING
          },
        });
      }
      let query = {
        isDeleted: false,
        name: req.body.name
      };
      if (req.body.categoryId) {
        query['categoryId'] = req.body.categoryId
      }
      query.slug = await helper.slugify(req.body.name)
      req.body.slug = await helper.slugify(req.body.name)
      let existed = await db.categories.findOne(query);
      if (existed) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: req.body.categoryId ? constants.CATEGORY.SUB_ALREADY_EXIST : constants.CATEGORY.ALREADY_EXIST
          },
        });
      }
      req.body.addedBy = req.identity.id;

      let created = await db.categories.create(req.body);
      if (created) {
        return res.status(200).json({
          success: true,
          message: req.body.categoryId ? constants.CATEGORY.SUB_CREATED : constants.CATEGORY.CREATED
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
            message: constants.CATEGORY.ID_MISSING
          },
        });
      }
      const detail = await db.categories.findById(id).populate('categoryId')

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
      if(data.name){
        data.name = data.name.toLowerCase();
        data.slug = await helper.generateSlug(data.name)
      }

      const updatedStatus = await db.categories.updateOne({
        _id: id
      }, data);

      return res.status(200).json({
        success: true,
        message: data.categoryId ? constants.CATEGORY.SUB_UPDATED : constants.CATEGORY.UPDATED,
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

      const updatedStatus = await db.categories.updateOne({
        _id: id
      }, {
        isDeleted: true
      });
      if (updatedStatus) {
        return res.status(200).json({
          success: true,
          message: constants.CATEGORY.DELETED,
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
        type,
        categoryId,
        category_type
      } = req.query;
      var query = {};

      if (search) {
        query.$or = [{
          name: {
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
      query.type = "parent"
      if (addedBy) {
        query.addedBy = mongoose.Types.ObjectId.createFromHexString(addedBy);
      }

      if (categoryId) {
        query.categoryId = mongoose.Types.ObjectId.createFromHexString(categoryId)
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
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category_detail",
        },
      },

      {
        $unwind: {
          path: "$category_detail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$_id",
          name: "$name",
          image: "$image",
          type: "$type",
          slug: "$slug",
          categoryId: "$categoryId",
          category_detail: "$category_detail",
          status: "$status",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          isDeleted: "$isDeleted",
          addedBy: "$addedBy",
          addedByName: "$addedByDetail.fullName",
        },
      },
      ];

      const total = await db.categories.aggregate([...pipeline]);

      if (page && count) {
        var skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({
          $skip: Number(skipNo),
        }, {
          $limit: Number(count),
        });
      }

      const result = await db.categories.aggregate([...pipeline]);

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

  subCategorylisting: async (req, res) => {
    try {
      const {
        search,
        page,
        count,
        sortBy,
        status,
        addedBy,
        type,
        categoryId,
        category_type
      } = req.query;
      var query = {};

      if (search) {
        query.$or = [{
          name: {
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
      query.type = "child"
      if (addedBy) {
        query.addedBy = mongoose.Types.ObjectId.createFromHexString(addedBy);
      }

      // query.categoryId = { $exists: true }
      if (categoryId) {
        query.categoryId = mongoose.Types.ObjectId.createFromHexString(categoryId)
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
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category_detail",
        },
      },

      {
        $unwind: {
          path: "$category_detail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$_id",
          name: "$name",
          image: "$image",
          type: "$type",
          categoryId: "$categoryId",
          categoryName: "$category_detail.name",
          status: "$status",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          isDeleted: "$isDeleted",
          addedBy: "$addedBy",
          addedByName: "$addedByDetail.fullName"
        },
      },
      ];

      const total = await db.categories.aggregate([...pipeline]);

      if (page && count) {
        var skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({
          $skip: Number(skipNo),
        }, {
          $limit: Number(count),
        });
      }

      const result = await db.categories.aggregate([...pipeline]);

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

      const updatedStatus = await db.categories.updateOne({
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

  addMultipleCategory: async (req, res) => {
    try {

      let { categories } = req.body;

      for await (let categoryObj of categories) {
        categoryObj.addedBy = req.identity.id;
        categoryObj.updatedBy = req.identity.id;
        categoryObj.name = categoryObj.name.toLowerCase();
        categoryObj.slug = await helper.slugify(categoryObj.name)
        let query = {}
        query.isDeleted = false;
        query.name = categoryObj.name
        query.slug = categoryObj.slug
        if (categoryObj.categoryId) {
          query['categoryId'] = req.body.categoryId
        }

        let existed = await db.categories.findOne(query);
        if (existed) {

        } else {
          let created = await db.categories.create(categoryObj);
        }
      }

      return response.success(null, constants.CATEGORY.CREATED, req, res);
    }
    catch (error) {
      return response.failed(null, `${error}`, req, res);
    }
  },
};
