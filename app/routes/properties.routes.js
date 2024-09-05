const property = require("../controllers/PropertiesController");

var router = require("express").Router();
router.post("/add", property.add)
router.get("/detail", property.detail);
router.get("/listing", property.listing);
router.put("/update", property.update);
router.delete("/delete", property.delete);
router.put("/status/change", property.changeStatus);


module.exports = router;