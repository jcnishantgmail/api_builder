const express = require("express");

const router = express();

router.use("/user", require("./users.routes"));
router.use("/upload", require("./upload.routes"));
router.use("/category", require("./categories.routes"));
router.use("/role", require("./roles.routes"));
router.use("/blog", require("./blog.routes"));
// router.use("/cms", require("./cms.routes"));
router.use("/material", require("./materials.routes"));
router.use("/property", require("./properties.routes"));
router.use("/skill" , require("./skills.routes"))
module.exports = router;
