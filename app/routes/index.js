const express = require("express");

const router = express();

router.use("/user", require("./users.routes"));
router.use("/upload", require("./upload.routes"));
router.use("/category", require("./categories.routes"));
router.use("/role", require("./roles.routes"));
router.use("/blog", require("./blog.routes"));
router.use("/cms", require("./cms.routes"));
router.use("/material", require("./materials.routes"));
router.use("/property", require("./properties.routes"));
router.use("/skill" , require("./skills.routes"))
router.use("/job" , require("./jobs.routes"))
router.use("/contractor", require("./contractorDashboard.routes"))
router.use("/invoice", require("./invoices.routes"));
router.use("/payment", require("./payments.routes"));
router.use("/contractorpayables", require("./contractor_payables.routes"));
module.exports = router;
