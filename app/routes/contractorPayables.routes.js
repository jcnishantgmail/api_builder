const ContractorPayablesController = require("../controllers/ContractorPayablesController");
var router = require("express").Router();
router.get("/detail",ContractorPayablesController.contractorPayablesDetail)
router.delete("/delete",ContractorPayablesController.contractorPayablesDelete)
router.get("/listing",ContractorPayablesController.contractorPayablesList)
router.put('/update', ContractorPayablesController.contractorPayablesUpdate);
router.get('/report', ContractorPayablesController.contractorPayablesReport);


module.exports = router;