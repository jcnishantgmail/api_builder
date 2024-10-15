const cis_rates = require("../controllers/CisRatesController")
var router = require("express").Router();
router.post("/add",cis_rates.cisRatesAdd);
router.get("/detail",cis_rates.cisRatesDetail);
router.delete("/delete",cis_rates.cisRatesDelete);
router.get("/listing",cis_rates.cisRatesList);


module.exports = router;