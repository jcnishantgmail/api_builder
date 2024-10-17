const vatController = require("../controllers/VatController");
var router = require("express").Router();
router.post("/add",vatController.vatAdd);
router.get("/detail",vatController.vatDetail);
router.delete("/delete",vatController.vatDelete);
router.get("/listing",vatController.vatList);


module.exports = router;