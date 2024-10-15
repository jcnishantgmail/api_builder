const jobs = require("../controllers/JobsController")
var router = require("express").Router();
router.post("/add",jobs.add)
router.get("/detail",jobs.detail)
router.put("/update",jobs.update)
router.delete("/delete",jobs.delete)
router.get("/listing",jobs.listing)
router.put("/status/change",jobs.changeStatus)
router.put('/assign/contractor', jobs.assignContractor)
router.put("/start/job", jobs.startJob)
router.put("/pause",jobs.pauseJob);
router.put("/complete/job", jobs.completeJob);
router.get("/daysWorkedList", jobs.daysWorkedList);
router.post("/addExpense", jobs.addExpense);


module.exports = router;