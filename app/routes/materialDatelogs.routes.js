const MaterialDatelogsController = require("../controllers/MaterialDatelogsController")
var router = require("express").Router();

router.get("/listing", MaterialDatelogsController.listing);



module.exports = router;