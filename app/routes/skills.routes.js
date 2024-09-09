const skills = require("../controllers/SkillsController")
var router = require("express").Router();
router.post("/add",skills.add)
router.get("/detail",skills.detail)
router.put("/update",skills.update)
router.delete("/delete",skills.delete)
router.get("/listing",skills.listing)
router.put("/status/change",skills.changeStatus)




module.exports = router;