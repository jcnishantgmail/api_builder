var jwt = require("jsonwebtoken");
const unprotectedRoutes =require("../utls/unprotectedRoutes").unprotectedroutes;
const db = require("../models");
const Users = db.users;
module.exports = async (req, res, next) => {
  /*
   * Check if authorization header is set
   */
  const url = req.url.split("?");
  if (unprotectedRoutes.includes(url[0]) || url[0].startsWith("/img")) {
    next();
    return;
  }

  
  if (req.headers && req.headers.authorization) {
    try {
      var parts = req.headers.authorization.split(" ");
      if (parts.length == 2) {
        var scheme = parts[0],
          credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
          token = credentials;
        }
      } else {
        return res.status(401).json({
          success: false,
          error: { code: 401, message: "Invalid token" },
        });
      }
      /*
       * Try to decode & verify the JWT token
       * The token contains user's id ( it can contain more informations )
       * and this is saved in req.user object
       */
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const user = await Users.findOne({ _id: decodedToken.id, isDeleted: false });
      if (user.isDeleted == true) {
        return res.status(401).json({
          success: false,
          error: {
            code: 401,
            message:
              "Your account is no longer active. Please conatct to site owner.",
          },
        });
      }
      if (user.status == "deactive") {
        return res.status(401).json({
          success: false,
          error: {
            code: 401,
            message:
              "Your account is no longer active. Please conatct to site owner.",
          },
        });
      }
      if (user) {
        req.identity = user;
      }
    } catch (err) {
      /*
       * If the authorization header is corrupted, it throws exception
       * So return 401 status code with JSON error message
       */
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: "Session expired. Please login again.",
        },
      });
    }
  } else {
    /*
     * If there is no autorization header, return 401 status code with JSON
     * error message
     */
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: "Authentication required.",
      },
    });
  }
  next();
  return;
};
