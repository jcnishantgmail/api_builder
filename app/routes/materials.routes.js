const material = require("../controllers/MaterialsController");

var router = require("express").Router();
router.post("/add", material.add)
router.get("/detail", material.detail);
router.get("/listing", material.listing);
router.put("/update", material.update);
router.delete("/delete", material.delete);
router.put("/status/change", material.changeStatus);


module.exports = router;