const contractor_payables = require("../controllers/contractorPayablesController");
var router = require("express").Router();
router.get("/detail",contractor_payables.contractorPayablesDetail)
router.delete("/delete",contractor_payables.contractorPayablesDelete)
router.get("/listing",contractor_payables.contractorPayablesList)




module.exports = router;