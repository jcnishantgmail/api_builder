const jobs = require("../controllers/JobsController")
var router = require("express").Router();
router.post("/add",jobs.add)
router.get("/detail",jobs.detail)
router.put("/update",jobs.update)
router.delete("/delete",jobs.delete)
router.get("/listing",jobs.listing)
router.put("/status/change",jobs.changeStatus)




module.exports = router;