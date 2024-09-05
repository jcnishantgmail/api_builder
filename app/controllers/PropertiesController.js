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
            message: constants.PROPERTY.PAYLOAD_MISSING
          },
        });
      }
      let query = {
        isDeleted: false,
        name: req.body.name
      };
   
      let existed = await db.properties.findOne(query);
      if (existed) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message:  constants.PROPERTY.ALREADY_EXIST
          },
        });
      }
      req.body.addedBy = req.identity.id;

      let created = await db.properties.create(req.body);
      if (created) {
        return res.status(200).json({
          success: true,
          message: constants.PROPERTY.CREATED
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Some issue exist",
        });
      }
    } catch (err) {
        console.log(err)
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
            message: constants.PROPERTY.ID_MISSING
          },
        });
      }
      const detail = await db.properties.findById(id).populate('addedBy')

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
      if(!id ){
        return res.status(400).json({
            success:false,
            error:{code:400, message:"Payload missing"}
        })
      }


      await db.properties.updateOne({_id: id}, data);

      return res.status(200).json({
        success: true,
        message: constants.PROPERTY.UPDATED,
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

      const updatedStatus = await db.properties.updateOne({
        _id: id
      }, {
        isDeleted: true
      });
      if (updatedStatus) {
        return res.status(200).json({
          success: true,
          message: constants.PROPERTY.DELETED,
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
        $project: {
          id: "$_id",
          name: "$name",
          image: "$image",
          address: "$address",
          state: "$state",
          city: "$city",
          country: "$country",
          zipCode: "$zipCode",
          status: "$status",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          isDeleted: "$isDeleted",
          addedBy: "$addedBy",
          addedByName: "$addedByDetail.fullName"
        },
      },
      ];

      const total = await db.properties.aggregate([...pipeline]);

      if (page && count) {
        var skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({
          $skip: Number(skipNo),
        }, {
          $limit: Number(count),
        });
      }

      const result = await db.properties.aggregate([...pipeline]);

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
      if(!id || !status){
        return res.status(400).json({
            success:false,
            error:{code:400, message:"Payload missing"}
        })
      }

      await db.properties.updateOne({
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
