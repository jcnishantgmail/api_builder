const blog = require("../controllers/BlogController")
var router = require("express").Router();
router.post("/add",blog.addBlog)
router.get("/detail",blog.blogDetails)
router.put("/update",blog.updateBlog)
router.delete("/delete",blog.deleteBlog)
router.get("/listing",blog.listing)
router.put("/status/change",blog.blogStatusUpdate)




module.exports = router;