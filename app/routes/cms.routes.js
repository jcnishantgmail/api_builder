const content = require("../controllers/ContentController")
var router = require("express").Router();
router.post("/add",content.add)
router.get("/detail",content.detail)
router.put("/update",content.update)
router.delete("/delete",content.delete)
router.get("/listing",content.listing)




module.exports = router;