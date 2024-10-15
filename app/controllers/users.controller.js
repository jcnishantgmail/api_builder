"use strict";

const db = require("../models");

const Users = db.users;
var bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const constants = require("../utls/constants");
const Emails = require("../Emails/onBoarding");
const helper = require("../utls/helper");
var mongoose = require("mongoose");
const services = require('../services/index')


module.exports = {
  /**
   * @authenticated
   *
   */
  registerUser: async (req, res) => {
    try {
      const data = req.body;

      if (!req.body.email || !req.body.password || !data.firstName || !data.lastName) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.PAYLOAD_MISSING
          },
        });
      }
      let findRole = await db.roles.findOne({
        name: "Client"
      })
      if (findRole) {
        data["role"] = findRole ? findRole._id : "66d6bdf107668a7723efdf9a";
      }else{
        data["role"] = "66d6bdf107668a7723efdf9a"
      }
      data["status"] = "active";
     
      data.password = await bcrypt.hashSync(
        data.password,
        bcrypt.genSaltSync(10)
      );
      data.isVerified = "N";
      data.createdAt = new Date();
      data.updatedAt = new Date();
      data.isDeleted = false;
      data.email = data.email.toLowerCase();
     
      if (req.body.firstName && req.body.lastName) {
        data["fullName"] = req.body.firstName + " " + req.body.lastName;
      }
      data.fullName = data.fullName.toLowerCase()
      var query = {};
      query.isDeleted = false;
      query.email = data.email;
      const existedUser = await db.users.findOne(query);

      if (existedUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: "Email already exists in the application.",
          },
        });
      }

      // Save user in the database
      if (data.country) {
        data["country"] = data.country.toLowerCase();
      }
      if (data.email) {
        data["email"] = data.email.toLowerCase();
      }

      let createdUSer = await db.users.create(data)
      if (createdUSer) {
        let verificationOtp =  helper.generateOTP(4)
        await db.users.updateOne({
          _id: createdUSer.id
        }, {
          verification_otp: verificationOtp
        })
    
        await Emails.userVerifyLink({ email: createdUSer.email,
          id:createdUSer._id,
          firstName: createdUSer.fullName,
          otp: verificationOtp
        })
        return res.status(200).json({
          success: true,
          "data":createdUSer._id || createdUSer.id,
          message: "User register successfully."
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

  /**Verify email */

  verifyEmail: async (req, res)=>{
    try{
      let {id} = req.query

      let user = await db.users.findById(id)

      if(user && user.isVerified == 'N'){
        await db.users.updateOne({_id:id},{isVerified:'Y'})
        return res.redirect(`${process.env.FRONT_WEB_URL}/login?id=${id}`);
      }else{
        return res.redirect(`${process.env.FRONT_WEB_URL}/login`);
      }
    }catch(err){
      return res.status(500).json({
        success:false,
        error:{code:400, message:""+err}
      })
    }
  },

  /***Admin Login */

  adminLogin: async (req, res) => {
    try {
      console.log("admin login")
      const data = req.body;
      if (!req.body.email || typeof req.body.email == undefined) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.EMAIL_REQUIRED
          },
        });
      }

      if (!req.body.password || typeof req.body.password == undefined) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.PASSWORD_REQUIRED
          },
        });
      }

      var query = {};
      query.email = data.email.toLowerCase();
      query.isDeleted = false;

      var user = await Users.findOne(query).populate("role");

      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: "Invalid credentials."
          },
        });
      }

      if (user && user.status == "deactive") {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.USERNAME_INACTIVE,
          },
        });
      }


      if (user.role.loginPortal != "admin") {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: "You are not authorized user for this portal.",
          },
        });
      }

      if (user && user.status != "active" && user.isVerified != "Y") {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.USERNAME_INACTIVE,
          },
        });
      }

      if (!bcrypt.compareSync(req.body.password, user.password)) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.WRONG_PASSWORD,
          },
        });
      } else {
        const token = jwt.sign({
            id: user.id,
            role: user.role._id
          },
          process.env.JWT_SECRET, {
            expiresIn: "200h",
          }
        );
        var admindata;
        admindata = Object.assign({}, user._doc);
        admindata["access_token"] = token;

        return res.status(200).json({
          success: true,
          message: constants.onBoarding.LOGIN_SUCCESS,
          data: admindata,
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

  /***User Login */
  userLogin: async (req, res) => {
    try {
      const data = req.body;
      if (!req.body.email || typeof req.body.email == undefined) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.EMAIL_REQUIRED
          },
        });
      }

      if (!req.body.password || typeof req.body.password == undefined) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.PASSWORD_REQUIRED
          },
        });
      }

      var query = {};
      query.email = data.email.toLowerCase();

      query.isDeleted = false;
      var user = await Users.findOne(query).populate('role');
      if (user && user.role.name === 'Admin') {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.ONLY_USER_LOGIN
          }
        })
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.NO_USER_EXIST
          },
        });
      }

      if (user && user.status == "deactive") {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.USERNAME_INACTIVE,
          },
        });
      }

      if (user && user.isVerified != "Y") {
        return res.status(404).json({
          success: false,
          id: user.id,
          error: {
            code: 404,
            message: constants.onBoarding.NOT_VERIFIED,
          },
        });
      }

      if (!bcrypt.compareSync(req.body.password, user.password)) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.WRONG_PASSWORD,
          },
        });
      } else {
        const token = jwt.sign({
            id: user._id,
            role: user.role._id
          },
          process.env.JWT_SECRET, {
            expiresIn: "10h",
          }
        );
        // user["access_token"] = token

        let userData = Object.assign({}, user._doc);

        userData["access_token"] = token;
        userData['isVerified']=user.isVerified
        delete userData.password
        return res.status(200).json({
          success: true,
          message: constants.onBoarding.LOGIN_SUCCESS,
          data: userData,
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

  /***Auto Login */
  autoLogin: async (req, res) => {
    try {
      const id = req.body.id;
      var user = await Users.findById(id).populate('role')
      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: "Invalid credentials."
          },
        });
      }

      if (user && user.status == "deactive") {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constants.onBoarding.USERNAME_INACTIVE,
          },
        });
      }
      const token = jwt.sign({
          id: user.id,
          role: user.role._id
        },
        process.env.JWT_SECRET, {
          expiresIn: "100h",
        }
      );
      var admindata;
      admindata = Object.assign({}, user._doc);
      admindata["access_token"] = token;
      delete admindata.password
      await db.users.updateOne({
        _id: admindata.id
      }, {
        lastLogin: new Date()
      });
      return res.status(200).json({
        success: true,
        message: constants.onBoarding.LOGIN_SUCCESS,
        data: admindata,
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
  /**Getting user profile data using id */
  profileData: async (req, res) => {
    try {
      const id = mongoose.Types.ObjectId.createFromHexString(req.query.id);

      const user_data = await Users.findOne({
        _id: id
      }).populate("role", 'id name permissions').populate("skills")
      console.log(user_data)
      const token = jwt.sign({
        id: user_data.id,
        role: user_data.role._id
      },
      process.env.JWT_SECRET, {
        expiresIn: "10h",
      }
    );
    var prodileData;
    prodileData = Object.assign({}, user_data._doc);
    prodileData["access_token"] = token;

      if (user_data) {
        return res.status(200).json({
          success: true,
          data: prodileData,
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

  /**Getting user profile data using id */
  userDetail: async (req, res) => {
    try {
      const id = mongoose.Types.ObjectId.createFromHexString(req.query.id);

      const user_data = await Users.findOne({
        _id: id
      }).populate("role", 'id name').populate('cis_rate');
      let user = Object.assign({}, user_data._doc);

      if (user) {
        return res.status(200).json({
          success: true,
          data: user,
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

  /**Updating user profile */
  /**
   * @queryParam id
   * @param {*} req
   * @param {*} res
   * @returns
   */
  updateProfile: async (req, res) => {
    try {
      let id = req.body.id
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.PAYLOAD_MISSING
          },
        });
      }
      if (req.body.firstName && req.body.lastName) {
        req.body.fullName = req.body.firstName + " " + req.body.lastName;
      }
      if ((req.body.firstName) && !(req.body.lastName)) {
        req.body.fullName = req.body.firstName
      }
      const user = await Users.findOne({
        _id: id
      });
      var password;
      /**Updating password if present in payload */
      if (req.body.password) {
        password = req.body.password;
        req.body.password = await bcrypt.hashSync(
          req.body.password,
          bcrypt.genSaltSync(10)
        );

        let emailPayload = {
          email: user.email,
          fullName: user.fullName,
          password: password,
        };

        await Emails.updatePasswordEmail(emailPayload);
      }
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase()
      }
      // console.log(req.body,"++++++++++++++updatedUser")
      const requestingUser = await req.identity.populate('role');
      console.log(requestingUser);
      if(requestingUser.role.name === 'Contractor') {
        if(requestingUser._id.toString() === id) {
          let { hourlyRate } = req.body;
          console.log(hourlyRate);
          if(hourlyRate) {
            return res.status(400).json({message: "You are not allowed to modify hourly rate", code: 400});
          }
        }
        else {
          return res.status(400).json({message:"You are not allowed to update profile of another contractor", code: 400});
        }
      }
      const updatedUser = await Users.updateOne({
        _id: id
      }, req.body);


      return res.status(200).json({
        success: true,
        message: constants.onBoarding.PROFILE_UPDATED,
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

  getAllUsers: async (req, res) => {
    try {

      let {
        search, sortBy, page, count, status, role, country, skills  } = req.query
      var query = {};
      if (search) {
        query.$or = [{
            fullName: {
              $regex: search,
              $options: "i"
            }
          },
          {
            email: {
              $regex: search,
              $options: "i"
            }
          },
        ];
      }

      query.isDeleted = false;
    
      if (role) {
        query.role = mongoose.Types.ObjectId.createFromHexString(role);
      } 

      if(skills){
        let skillIds = []
        let splittedSkills = skills.split(",")
        for await (let itm of splittedSkills){
          skillIds.push(mongoose.Types.ObjectId.createFromHexString(itm))
        }
        query.skills = {$in:skillIds}
      }
    

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
      if (country) {
        query.country = country;
      }
      const pipeline = [
        {
          $match: query,
        },

        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleDetails"
          }
        },
        {
          $unwind: {
            path: '$roleDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "skills",
            localField: "skills",
            foreignField: "_id",
            as: "skills_detail"
          }
        },
        {
          $lookup: {
            from: "cis_rates",
            localField: "cis_rate",
            foreignField: "_id",
            as: "cis_rate"
          }
        },
        {
          $unwind: {
            path: '$cis_rate',
            preserveNullAndEmptyArrays: true,
          },
        },    
        {
          $project: {
            id: "$_id",
            email: "$email",
            city: "$city",
            state: "state",
            dialCode: "$dialCode",
            mobileNo: "$mobileNo",
            fullName: "$fullName",
            address: "$address",
            image: "$image",
            country: "$country",
            email: "$email",
            pinCode: "$pinCode",
            status: "$status",
            role: "$roleDetails.name",
            roleId: "$roleDetails._id",
            loginPortal: "$roleDetails.loginPortal",
            currency: "$currency",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
            addedBy: "$addedBy",
            isDeleted: "$isDeleted",
            previous_experience_desc: "$previous_experience_desc",
            experience_level: "$experience_level",
            skills_detail:"$skills_detail",
            certificate: "$certificate",
            cis_rate: "$cis_rate"
          },
        },
        
        {
          $sort: sortquery,
        },
      ];

      const total = await Users.aggregate([...pipeline]);

      if (page && count) {
        var skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({
          $skip: Number(skipNo),
        }, {
          $limit: Number(count),
        });
      }

      const result = await Users.aggregate([...pipeline]);


      return res.status(200).json({
        success: true,
        data: result,
        total: total.length,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 400,
          message: "" + err
        },
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const newPassword = req.body.newPassword;
      const currentPassword = req.body.currentPassword;
      const user = await Users.findById({
        _id: req.identity.id
      });
      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.CURRENT_PASSWORD
          },
        });
      } else {
        const password = await bcrypt.hashSync(
          newPassword,
          bcrypt.genSaltSync(10)
        );
        await Users.findByIdAndUpdate(user._id, {
          password: password
        });

        return res.status(200).json({
          success: true,
          message: constants.onBoarding.PASSWORD_CHANGED,
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

  forgotPasswordAdmin: async (req, res) => {
    try {
      if (!req.body.email || req.body.email == undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.PAYLOAD_MISSING
          },
        });
      }
      var query = {};
      query.email = req.body.email.toLowerCase();
      query.isDeleted = false;
      const user = await Users.findOne(query).populate('role');

      console.log(user)
      if (user && user.role.loginPortal == 'admin') {
        const verificationCode = await helper.generateVerificationCode(6);

        await Users.updateOne({
          _id: user.id
        }, {
          verificationCode: verificationCode
        });
        let currentTime = new Date();
        let email_payload = {
          email: user.email,
          verificationCode: verificationCode,
          fullName: user.fullName,
          id: user.id,
          userId: user.id,
          time: currentTime,
          role: user.role.name,
          loginPortal: user.role.loginPortal
        };
        await Emails.forgotPasswordEmail(email_payload);
        return res.status(200).json({
          success: true,
          message: constants.onBoarding.VERIFICATION_CODE_SENT,
          id: user.id,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.ACCOUNT_NOT_FOUND
          },
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: err.toString()
        },
      });
    }
  },

  forgotPasswordUser: async (req, res) => {
    try {
      if (!req.body.email || req.body.email == undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.PAYLOAD_MISSING
          },
        });
      }

      var query = {};
      query.email = req.body.email.toLowerCase();
      query.isDeleted = false;


      const user = await Users.findOne(query).populate('role');

      if (user) {
        const verificationCode = await helper.generateVerificationCode(4);

        await Users.updateOne({
          _id: user.id
        }, {
          verificationCode: verificationCode
        });
        let currentTime = new Date();
        let email_payload = {
          email: user.email,
          verificationCode: verificationCode,
          firstName: user.fullName,
          id: user.id,
          userId: user.id,
          time: currentTime,
          role: user.role.name,
        };
        await Emails.forgotPasswordEmail(email_payload);
        return res.status(200).json({
          success: true,
          message: req.body.isResend ? constants.onBoarding.VERIFICATION_CODE_SENT : constants.onBoarding.VERIFICATION_CODE_SENT,
          id: user.id,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.ACCOUNT_NOT_FOUND
          },
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: err.toString()
        },
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const id = req.body.id;

      if (!req.body.password || !req.body.verificationCode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.PAYLOAD_MISSING
          },
        });
      }

      const user = await Users.findById(id);

      if (user.verificationCode && user.verificationCode != req.body.verificationCode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.WRONG_VERIFICATION_CODE,
          },
        });
      }else if (!user.verificationCode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.LINK_EXPIRED,
          },
        });
      }else{
        
      }

      const password = await bcrypt.hashSync(
        req.body.password,
        bcrypt.genSaltSync(10)
      );
      await Users.updateOne({
        _id: user.id
      }, {
        password: password,
        verificationCode: ""
      });

      return res.status(200).json({
        success: true,
        message: constants.onBoarding.PASSWORD_RESET,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: err.toString()
        },
      });
    }
  },

  userResetPassword: async (req, res) => {
    try {
      const id = req.body.id;

      if (!req.body.password || !req.body.id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.PAYLOAD_MISSING
          },
        });
      }

      const user = await Users.findById(id);
      if (user) {
        const password = await bcrypt.hashSync(
          req.body.password,
          bcrypt.genSaltSync(10)
        );
        await Users.updateOne({
          _id: user.id
        }, {
          password: password
        });
        return res.status(200).json({
          success: true,
          message: constants.onBoarding.PASSWORD_RESET,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.INVALID_ID
          },
        });
      }


    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: err.toString()
        },
      });
    }
  },
  addUser: async (req, res) => {
    var date = new Date();
    try {
      const data = req.body;
      data.email = data.email.toLowerCase()

      if (!req.body.email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.PAYLOAD_MISSING
          },
        });
      }
      let query = {};
      query.isDeleted = false;
      query.email = req.body.email.toLowerCase();
      var user = await Users.findOne(query);

      if (user) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.EMAIL_EXIST,
          },
        });
      } else {
        data["date_registered"] = date;
        data["createdAt"] = date;
        data["updatedAt"] = date;
        data["status"] = "active";
        data["addedBy"] = req.identity.id;
        data['addedType'] = "admin"
        var password = req.body.password;
        if (req.body.password) {
          data.password = await bcrypt.hashSync(
            req.body.password,
            bcrypt.genSaltSync(10)
          );
        } else {
          password = await helper.generatePassword();
          data.password = await bcrypt.hashSync(
            password,
            bcrypt.genSaltSync(10)
          );
        }

        data.isVerified = "Y";
        data.email = data.email.toLowerCase();

        if (req.body.firstName && req.body.lastName) {
          data["fullName"] = req.body.firstName + " " + req.body.lastName;
        }
        data.addedBy = req.identity.id ? req.identity.id : req.identity._id
        // Create a user
        const user = new Users(data);

        // Save user in the database
        let newUser = await user.save(user);

        let findRole = await db.roles.findById(newUser.role)

        let email_payload = {
          email: newUser.email,
          fullName: newUser.fullName,
          password: password,
          role: findRole.name,
          loginPortal: findRole.loginPortal
        };
        await Emails.add_user_email(email_payload);

        return res.status(200).json({
          success: true,
          message: constants.onBoarding.USER_ADDED,
        });
      }
    } catch (err) {
      return res
        .status(400)
        .json({
          success: false,
          code: 400,
          message: "" + err
        });
    }
  },

  changeStatus: async (req, res) => {
    try {
      const id = req.body.id;
      const status = req.body.status;

     await Users.updateOne({
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

  deleteUser: async (req, res) => {
    try {
      const id = req.query.id;

      const deletedUser = await db.users.updateOne({
        _id: id
      }, {
        isDeleted: true
      });
      if (deletedUser) {
        return res.status(200).json({
          success: true,
          message: constants.onBoarding.USER_DELETED,
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



  checkEmail: async function (req, res) {
    var email = req.query.email;
    if (!email || typeof email == undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: constants.onBoarding.PAYLOAD_MISSING
        },
      });
    }
    const user = await Users.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
    if (user) {
      return res.status(200).json({
        success: false,
        error: {
          code: 400,
          message: constants.onBoarding.EMAIL_TAKEN
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        message: constants.onBoarding.EMAIL_AVAILABLE,
      });
    }
  },

  inviteUser: async (req, res) => {
    var date = new Date();
    try {
      const data = req.body;

      if (!req.body.email || !req.body.fullName) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.PAYLOAD_MISSING
          },
        });
      }
      let query = {};
      query.isDeleted = false;
      query.email = req.body.email.toLowerCase();
      var user = await Users.findOne(query);
      // let role = req.body.role ;

      if (user) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.EMAIL_EXIST,
          },
        });
      } else {
        data["date_registered"] = date;
        data["createdAt"] = date;
        data["updatedAt"] = date;
        data["status"] = "active";
        data["role"] = req.body.role;
        data["type"] = req.body.type;
        data["addedBy"] = req.identity.id;
        var password = req.body.password;
        if (req.body.password) {
          data.password = await bcrypt.hashSync(
            req.body.password,
            bcrypt.genSaltSync(10)
          );
        } else {
          password = await generatePassword();
          data.password = await bcrypt.hashSync(
            password,
            bcrypt.genSaltSync(10)
          );
        }

        data.isVerified = "Y";
        data.email = data.email.toLowerCase();

        // if (req.body.firstName && req.body.lastName) {
        //   data["fullName"] = req.body.firstName + " " + req.body.lastName;
        // }
        data.addedBy = req.identity.id;
        // Create a user
        const user = new Users(data);

        // Save user in the database
        const newUser = await user.save(user);
        let findRole
        if (newUser && newUser.role) {
          findRole = await db.roles.findById(newUser.role);
        }

        let email_payload = {
          email: newUser.email,
          fullName: newUser.fullName,
          password: password,
          role: findRole.name ? findRole.name : "",
          id: newUser.id,
          type: newUser.type
        };
        await Emails.invite_user_email(email_payload);

        return res.status(200).json({
          success: true,
          data: newUser,
          message: constants.onBoarding.USER_INVITED,
        });
      }
    } catch (err) {
      return res
        .status(400)
        .json({
          success: false,
          code: 400,
          message: "" + err
        });
    }
  },

  logInSignUpSocialMedia: async (req, res) => {

    if (!req.body.email || typeof req.body.email == undefined) {
      return res
        .status(400)
        .json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.EMAIL_REQUIRED
          },
        });
    }
    let userData = req.body;
    // //(userData);
    var query = {};
    query.email = userData.email;
    query.isDeleted = false;
    let user = await Users.findOne(query);

    if (user != undefined) {
      if (user.isVerified == "N") {
        return res
          .status(404)
          .json({
            success: false,
            error: {
              code: 400,
              message: constants.onBoarding.USERNAME_VERIFIED,
            },
          });
      }
      var token = jwt.sign({
          id: user.id,
          fullName: user.fullName
        },
        process.env.JWT_SECRET, {
          expiresIn: "200h",
        }
      );
      const refreshToken = jwt.sign({
          id: user.id
        },
        process.env.JWT_SECRET, {
          expiresIn: "200h",
        }

      );
      var userInfo;
      userInfo = Object.assign({}, user._doc);
      userInfo.alreadyRegistered = true;
      userInfo.role = user.role
      userInfo.access_token = token;
      userInfo.refresh_token = refreshToken;

      return res.status(200).json({
        success: true,
        message: constants.onBoarding.LOGIN_SUCCESS,
        data: userInfo,
      });
    } else {
      let data = req.body;
      data.email = data.email.toLowerCase();
      var date = new Date();
      // data["roles"] = "user";
      data["date_registered"] = date;
      data["date_verified"] = date;
      data["status"] = "active";
      data["mobileNo"] = data.mobileNo ? data.mobileNo : "";
      data["domain"] = "web";

      data["isVerified"] = "Y";
      // data["socialimage"] = data.image;
      data["image"] = data.image;

      data["firstName"] = data.firstName;
      data["lastName"] = data.lastName;
      data["fullName"] = data.firstName + " " + data.lastName;

      var query = {};
      query.email = data.email;
      query.isDeleted = false;

      var email = data.email;
      if (data.email == "" || data.email == undefined) {
        throw "Email Id is missing";
      }
      data.password = generatePassword();
      delete data["id"];

      //(data, "data");
      var userRegistered = await Users.create(data);
      if (userRegistered.firstName && userRegistered.lastName) {
        userRegistered.fullName = userRegistered.firstName + " " + userRegistered.lastName
      }
      var token = jwt.sign({
          id: userRegistered._id,
          fullName: userRegistered.fullName
        },
        process.env.JWT_SECRET, {
          expiresIn: "200h",
        }
      );
      const refreshToken = jwt.sign({
          id: userRegistered._id
        },
        process.env.JWT_SECRET, {
          expiresIn: "200h",
        }

      );
      let userInfo;
      userInfo = Object.assign({}, userRegistered._doc);

      userInfo.alreadyRegistered = false;
      userInfo.access_token = token;
      userInfo.role = ""

      //.log(userRegistered, "===================query");

      return res.status(200).json({
        success: true,
        message: constants.onBoarding.SUCCESSFULLY_REGISTERED,
        data: userInfo,
      });
    }
  },

  googleLoginAuthentication: async (req, res) => {
    try {
      let oAuth2Client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: req.header("Referer") ?
          req.header("Referer") + "company" :
          process.env.GOOGLE_LOGIN_REDIRECT,
      });
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email",
        ],
        prompt: "consent",
      });
      return res.status(200).json({
        success: true,
        data: authUrl,
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

  googleLogin: async (req, res) => {
    try {
      let oAuth2Client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: req.header("Referer") ?
          req.header("Referer") + "company" :
          process.env.GOOGLE_LOGIN_REDIRECT,
      });
      const {
        tokens
      } = await oAuth2Client.getToken(req.query.authCode);
      const accessToken = tokens.access_token;
      // Set the access token obtained from the authorization step
      let oauth2Client = new google.auth.OAuth2(); // create new auth client
      oauth2Client.setCredentials({
        access_token: accessToken
      }); // use the new auth client with the access_token
      let oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
      });

      let {
        data
      } = await oauth2.userinfo.get();
      let userQuery = {};
      userQuery.isDeleted = false;
      userQuery.$or = [{
          googleLoginId: {
            $regex: data.id,
            $options: "i"
          }
        },
        {
          email: {
            $regex: data.email,
            $options: "i"
          }
        },
        // Add more fields as needed
      ];

      let user = await db.users
        .findOne(userQuery)
        .populate("role")
        .populate("subRole");

      if (user) {
        const token = jwt.sign({
            id: user.id,
            role: user.role._id
          },
          process.env.JWT_SECRET, {
            expiresIn: "3000h",
          }
        );
        var userdata;
        userdata = Object.assign({}, user._doc);
        userdata["access_token"] = token;
        const updatedUser = await db.users.updateOne({
          _id: userdata.id
        }, {
          lastLogin: new Date()
        });
        return res.status(200).json({
          success: true,
          message: constants.onBoarding.LOGIN_SUCCESS,
          data: userdata,
        });
      } else {
        let newUser = {};
        const date = new Date();
        newUser["status"] = "active";
        newUser["role"] = "64b15102b14de6c28838f7d2";
        newUser.firstName = data.given_name;
        newUser.lastName = data.family_name;
        if (data.name) {
          newUser.fullName = data.name;
        }
        const password = data.id;
        newUser.password = await bcrypt.hashSync(
          password,
          bcrypt.genSaltSync(10)
        );
        newUser.isVerified = "Y";
        newUser.createdAt = new Date();
        newUser.updatedAt = new Date();
        newUser.isDeleted = false;
        newUser.email = data.email.toLowerCase();
        newUser.googleLoginId = data.id;

        let createdUser = await db.users.create(newUser);
        var registeredUser = await Users.findById(
            createdUser.id ? createdUser.id : createdUser._id
          )
          .populate("role")
          .populate("subRole");
        const token = jwt.sign({
            id: registeredUser.id,
            role: registeredUser.role._id
          },
          process.env.JWT_SECRET, {
            expiresIn: "3000h",
          }
        );
        var userdata;
        userdata = Object.assign({}, registeredUser._doc);
        userdata["access_token"] = token;
        userdata["social_login"] = true;
        const updatedUser = await db.users.updateOne({
          _id: userdata.id
        }, {
          lastLogin: new Date()
        });
        return res.status(200).json({
          success: true,
          message: constants.onBoarding.LOGIN_SUCCESS,
          data: userdata,
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
/* resend otp for email verification */
  sendVerificationOtp: async (req, res) => {
    try {
     
      let verificationOtp = await helper.generateOTP(4)
      let updatedUser
      if(req.body.isSms == true){
         updatedUser = await db.users.updateOne({
          email: req.body.email
        }, {
          verification_otp: verificationOtp,
          mobileNo:req.body.mobileNo
        })
      }else{
         updatedUser = await db.users.updateOne({
          email: req.body.email
        }, {
          verification_otp: verificationOtp
        })

      }
     
      await Emails.verificationOtp({
        email: req.body.email,
        firstName: "",
        otp: verificationOtp
      })

      return res.status(200).json({
        success: true,
        message: "Verification otp sent of registered email."
      })

    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: "" + err
        }
      })
    }
  },

  verifyOtp: async (req, res) => {
    try {
      let data = req.body
      let user = await db.users.findOne({email:data.email});
      if (user) {
        if (user.verification_otp != data.otp) {
          return res.status(400).json({
            success: false,
            error: {
              code: 400,
              message: "Otp is incorrect."
            }
          })
        } else {
          let updatedUser = await db.users.updateOne({
            _id: user.id
          }, {
            isVerified: "Y",
            verification_otp: null
          })
          var token = jwt.sign({
            id: user.id,
            fullName: user.fullName
          },
          process.env.JWT_SECRET, {
            expiresIn: "200h",
          }
        );
        const refreshToken = jwt.sign({
            id: user.id
          },
          process.env.JWT_SECRET, {
            expiresIn: "200h",
          }
  
        );
        var userInfo;
        userInfo = Object.assign({}, user._doc);
        userInfo.access_token = token;
        userInfo.verification_otp=null
        userInfo.isVerified="Y"
        userInfo.refresh_token = refreshToken;
          return res.status(200).json({
            success: true,
            message: "Account verified successfully.",
            data:userInfo
          })
        }
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: "Invalid user."
          }
        })
      }


    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: "" + err
        }
      })
    }
  },
  verifyForgotOtp: async (req, res) => {
    try {
      let data = req.body
      let user = await db.users.findById(data.id);
      if (user) {
        if (user.verificationCode && user.verificationCode != data.otp) {
          return res.status(400).json({
            success: false,
            error: {
              code: 400,
              message: "Otp is incorrect."
            }
          })
        }else if (!user.verificationCode) {
          return res.status(400).json({
            success: false,
            error: {
              code: 400,
              message: "Otp is expired."
            }
          })
        } else {
          let updatedUser = await db.users.updateOne({
            _id: data.id
          }, {
            verificationCode: null
          })

          return res.status(200).json({
            success: true,
            id: user.id,
            message: "Otp verified successfully."
          })
        }
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: "Invalid user."
          }
        })
      }


    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: "" + err
        }
      })
    }
  },

  getAdminUsers: async (req, res) => {
    try {

      let {
        search,
        sortBy,
        page,
        count,
        status,
        role,
        country
      } = req.query

      var query = {};
      if (search) {
        query.$or = [{
            fullName: {
              $regex: search,
              $options: "i"
            }
          },
          {
            email: {
              $regex: search,
              $options: "i"
            }
          },

          // Add more fields as needed
        ];
      }


      query.isDeleted = false;

      query.id = {
        $ne: mongoose.Types.ObjectId.createFromHexString(req.identity._id)
      }
      // // query.userType = "addByAdmin"
      query.loginPortal = {
        $eq: "admin"
      }
      if (role) {
        query.role = mongoose.Types.ObjectId.createFromHexString(role)
      }

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
      if (country) {
        query.country = country;
      }
      console.log(query)
      const pipeline = [

        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleDetails"
          }
        },
        {
          $unwind: {
            path: '$roleDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: "$_id",
            userType: "$userType",
            email: "$email",
            city: "$city",
            state: "state",
            dialCode: "$dialCode",
            mobileNo: "$mobileNo",
            fullName: "$fullName",
            address: "$address",
            image: "$image",
            country: "$country",
            email: "$email",
            pinCode: "$pinCode",
            status: "$status",
            // role: "$role",
            role: "$roleDetails.name",
            roleId: "$roleDetails._id",
            loginPortal: "$roleDetails.loginPortal",
            currency: "$currency",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
            addedBy: "$addedBy",
            isDeleted: "$isDeleted",
            previous_experience_desc: "$previous_experience_desc",
            certificate: "$certificate"

          },
        },
        {
          $match: query,
        },
        {
          $sort: sortquery,
        },
      ];

      const total = await Users.aggregate([...pipeline]);

      if (page && count) {
        var skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({
          $skip: Number(skipNo),
        }, {
          $limit: Number(count),
        });
      }

      const result = await Users.aggregate([...pipeline]);

      return res.status(200).json({
        success: true,
        data: result,
        total: total.length,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 400,
          message: "" + err
        },
      });
    }
  },

  getfrontEndUsers: async (req, res) => {
    try {

      let {
        search,
        sortBy,
        page,
        count,
        status,
        role,
        country
      } = req.query

      var query = {};
      if (search) {
        query.$or = [{
            fullName: {
              $regex: search,
              $options: "i"
            }
          },
          {
            email: {
              $regex: search,
              $options: "i"
            }
          },

          // Add more fields as needed
        ];
      }

      query.isDeleted = false;

      query.id = {
        $ne: new mongoose.Types.ObjectId(req.identity._id)
      }
      // query.userType = "signup"
      query.loginPortal = {
        $eq: "front"
      }

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
      if (country) {
        query.country = country;
      }
      if (role) {
        query.role = new mongoose.Types.ObjectId(role)
      }

      const pipeline = [

        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleDetails"
          }
        },
        {
          $unwind: {
            path: '$roleDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: "$_id",
            userType: "$userType",
            email: "$email",
            city: "$city",
            state: "state",
            dialCode: "$dialCode",
            mobileNo: "$mobileNo",
            fullName: "$fullName",
            address: "$address",
            image: "$image",
            country: "$country",
            email: "$email",
            pinCode: "$pinCode",
            status: "$status",
            role: "$roleDetails.name",
            roleId: "$roleDetails._id",
            loginPortal: "$roleDetails.loginPortal",
            currency: "$currency",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
            addedBy: "$addedBy",
            isDeleted: "$isDeleted",
            previous_experience_desc: "$previous_experience_desc",
            experience_level: "$experience_level",
            certificate: "$certificate"
          },
        },
        {
          $match: query,
        },
        {
          $sort: sortquery,
        },
      ];

      const total = await Users.aggregate([...pipeline]);

      if (page && count) {
        var skipNo = (Number(page) - 1) * Number(count);

        pipeline.push({
          $skip: Number(skipNo),
        }, {
          $limit: Number(count),
        });
      }

      const result = await Users.aggregate([...pipeline]);

      return res.status(200).json({
        success: true,
        data: result,
        total: total.length,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 400,
          message: "" + err
        },
      });
    }
  },

  VerificationOtp: async (req, res) => {
    try {
      let verificationOtp = await helper.generateOTP(4)
     await client.messages
    .create({
        body: `your otp is ${verificationOtp} `,
        from: '+19093233103',
        to: `+${req.body.mobileNo}`
    })
    var updatedUser = await db.users.updateOne({
      email: req.body.email
    }, {
      verification_otp: verificationOtp,
      mobileNo:`+${req.body.mobileNo}`
    })

    return res.status(200).json({  // Return an error response
      success: true,
      code: 200,
      message: "Verification code send to your number successfully"
    }); 
    } catch (err) {
      console.log(err, "++++++++++++++++++++++++++++err");
      return res.status(500).json({  // Return an error response
        success: false,
        code: 500,
        message: "Verification failed",
        error: err.message
      });
    }
  },

  addSupplier: async (req, res) => {
    var date = new Date();
    try {
      const data = req.body;
      data.email = data.email.toLowerCase()

      if (!req.body.email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.PAYLOAD_MISSING
          },
        });
      }
      let query = {};
      query.isDeleted = false;
      query.email = req.body.email.toLowerCase();
      var user = await Users.findOne(query);

      if (user) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constants.onBoarding.EMAIL_EXIST,
          },
        });
      } else {
        data["date_registered"] = date;
        data["createdAt"] = date;
        data["updatedAt"] = date;
        data["status"] = "active";
        data["addedBy"] = req.identity.id;
        data['addedType'] = "admin"
        var password = req.body.password;
        if (req.body.password) {
          data.password = await bcrypt.hashSync(
            req.body.password,
            bcrypt.genSaltSync(10)
          );
        } else {
          password = await helper.generatePassword();
          data.password = await bcrypt.hashSync(
            password,
            bcrypt.genSaltSync(10)
          );
        }

        data.isVerified = "Y";
        data.email = data.email.toLowerCase();

        if (req.body.firstName && req.body.lastName) {
          data["fullName"] = req.body.firstName + " " + req.body.lastName;
        }
        data.addedBy = req.identity.id ? req.identity.id : req.identity._id
        let createdUser = await db.users.create(data)

        if(data.material && data.material.length > 0){
          for await (let itm of data.material){
            itm.supplier = createdUser._id || createdUser.id
            itm.addedBy = createdUser._id || createdUser.id
            itm.standAlone = false
            services.materialService.addMaterial(itm)
          }
        }

        return res.status(200).json({
          success: true
        });
      }
    } catch (err) {
      return res
        .status(400)
        .json({
          success: false,
          code: 400,
          message: "" + err
        });
    }
  },
  


};





