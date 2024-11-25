const db = require("../models");
const constants = require("../utls/constants");
var mongoose = require("mongoose");

module.exports = {

  add: async (req, res) => {
    try {
      if (!req.body.name) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.MATERIAL.PAYLOAD_MISSING
          },
        });
      }
      let query = {
        isDeleted: false,
        name: req.body.name
      };
   
      let existed = await db.materials.findOne(query);
      if (existed) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message:  constants.MATERIAL.ALREADY_EXIST
          },
        });
      }
      req.body.addedBy = req.identity.id;

      let created = await db.materials.create(req.body);
      if (created) {
        return res.status(200).json({
          success: true,
          message: constants.MATERIAL.CREATED
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
            message: constants.MATERIAL.ID_MISSING
          },
        });
      }
      const detail = await db.materials.findById(id).populate('category').populate('supplier').populate('supplier').populate('vat');

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


      await db.materials.updateOne({_id: id}, data);

      return res.status(200).json({
        success: true,
        message: constants.MATERIAL.UPDATED,
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

      const updatedStatus = await db.materials.updateOne({
        _id: id
      }, {
        isDeleted: true
      });
      if (updatedStatus) {
        return res.status(200).json({
          success: true,
          message: constants.MATERIAL.DELETED,
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
        supplier,
        category,
        
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
      if (addedBy) {
        query.addedBy = mongoose.Types.ObjectId.createFromHexString(addedBy);
      }
      if (supplier) {
        query.supplier = mongoose.Types.ObjectId.createFromHexString(supplier);
      }
      if (category) {
        let categoryList = category.split(",");
        categoryList = categoryList.map((category)=> mongoose.Types.ObjectId.createFromHexString(category));
        query.category = {$in: categoryList} 
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
          localField: "supplier",
          foreignField: "_id",
          as: "supplier_detail",
        },
      },

      {
        $unwind: {
          path: "$supplier_detail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
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
        $lookup: {
          from: "vats",
          localField: "vat",
          foreignField: "_id",
          as: "vat"
        }
      },
      {
        $unwind: {
          path: "$vat",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          id: "$_id",
          name: "$name",
          image: "$image",
          category: "$category",
          price: "$price",
          quantity: "$quantity",
          unit: "$unit",
          vat_included: "$vat_included",
          vat: "$vat",
          category_detail: "$category_detail",
          status: "$status",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          isDeleted: "$isDeleted",
          addedBy: "$addedBy",
          addedByName: "$addedByDetail.fullName",
          supplier_detail:"$supplier_detail",
          description: "$description"
        },
      },
      ];

      const total = await db.materials.aggregate([...pipeline]);

      if (page && count) {
        var skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({
          $skip: Number(skipNo),
        }, {
          $limit: Number(count),
        });
      }

      const result = await db.materials.aggregate([...pipeline]);

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

      await db.materials.updateOne({
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

};
