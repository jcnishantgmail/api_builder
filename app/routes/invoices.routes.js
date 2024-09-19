const invoices = require("../controllers/InvoicesController")
var router = require("express").Router();
router.post("/create",invoices.add)
router.get("/detail",invoices.detail)
router.put("/update",invoices.update)
router.delete("/delete",invoices.delete)
router.get("/listing",invoices.listing)




module.exports = router;