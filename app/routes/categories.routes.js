const category = require("../controllers/CategoriesController");

var router = require("express").Router();

router.post("/add", category.addMultipleCategory);
router.get("/detail", category.detail);
router.get("/listing", category.listing);
router.put("/update", category.update);
router.delete("/delete", category.delete);
router.put("/status/change", category.changeStatus);
router.get("/sub-cat/listing", category.subCategorylisting);


module.exports = router;