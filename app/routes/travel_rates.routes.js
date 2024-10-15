const travelRatesController = require("../controllers/travelRatesController")
var router = require("express").Router();
router.post("/add",travelRatesController.travelRatesAdd);
router.get("/detail",travelRatesController.travelRatesDetail);
router.delete("/delete",travelRatesController.travelRatesDelete);
router.get("/listing",travelRatesController.travelRatesList);


module.exports = router;