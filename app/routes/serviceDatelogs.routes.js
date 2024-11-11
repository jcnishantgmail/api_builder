const ServiceDatelogsController = require("../controllers/ServiceDatelogsController");
var router = require("express").Router();

router.get("/listing", ServiceDatelogsController.listing);

module.exports = router;