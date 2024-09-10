const contractorDashboard = require("../controllers/ContractorDashboard")
var router = require("express").Router();
router.get("/dashboard/count",contractorDashboard.getContractorDashboardCount)




module.exports = router;