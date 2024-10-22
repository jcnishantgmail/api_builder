const contactUsController = require("../controllers/ContactUsController")
var router = require("express").Router();
router.post("/add",contactUsController.contactUsAdd);
router.get("/detail",contactUsController.contactUsDetail);
router.delete("/delete",contactUsController.contactUsDelete);
router.get("/listing",contactUsController.contactUsList);


module.exports = router;