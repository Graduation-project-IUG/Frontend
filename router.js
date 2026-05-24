const express = require("express");
const router = express.Router();

// middlewares
const userValidation = require("./validations/user");
const postValidation = require("./validations/post");
const commentValidation = require("./validations/comment");
const reportValidation = require("./validations/report");
const reactionValidation = require("./validations/reaction");
const { authenticate } = require("./middlewares/authenticate");
const { authorize } = require("./middlewares/authorize");
const { validate } = require("./middlewares/validate");
const { 
	loadPost,
	loadComment,
	loadReport,
	loadReaction
} = require("./middlewares/loadResources");

// Controllers
const userController = require("./controllers/user")
const postController = require("./controllers/post")
const commentController = require("./controllers/comment")
const reportController = require("./controllers/report")
const reactionController = require("./controllers/reaction")


// Routes

router.post("/auth/login", validate(userValidation.login), userController.login);
router.post("/user/register", validate(userValidation.register), userController.register);
router.post("/auth/logout", authenticate, userController.logout);
router.get("/user/profile", authenticate, userController.profile);

router.post("/post", validate(postValidation.create), authenticate, authorize("posts", "create"), postController.create);
router.get("/post/:id", authenticate, loadPost, authorize("posts", "view"), postController.retrieve);
router.put("/post/:id", validate(postValidation.update), authenticate, loadPost, authorize("posts", "update"), postController.update);
router.delete("/post/:id", authenticate, loadPost, authorize("posts", "remove"), postController.remove);

router.post("/comment/:post_id", validate(commentValidation.create), authenticate, authorize("comments", "create"), commentController.create);
router.get("/comment/:id", authenticate, loadComment, authorize("comments", "view"), commentController.retrieve);
router.put("/comment/:id", validate(commentValidation.update), authenticate, loadComment, authorize("comments", "update"), commentController.update);
router.delete("/comment/:id", authenticate, loadComment, authorize("comments", "remove"), commentController.remove);

router.post("/report/:post_id", validate(reportValidation.create), authenticate, authorize("reports", "create"), reportController.create);
router.get("/report/:id", authenticate, loadReport, authorize("reports", "view"), reportController.retrieve);
router.put("/report/:id", validate(reportValidation.update), authenticate, loadReport, authorize("reports", "update"), reportController.update);
router.delete("/report/:id", authenticate, loadReport, authorize("reports", "remove"), reportController.remove);

router.post("/reaction/:post_id", validate(reactionValidation.create), authenticate, authorize("reactions", "create"), reactionController.create);
router.get("/reaction/:id", authenticate, loadReaction, authorize("reactions", "view"), reactionController.retrieve);
router.put("/reaction/:id", validate(reactionValidation.update), authenticate, loadReaction, authorize("reactions", "update"), reactionController.update);
router.delete("/reaction/:id", authenticate, loadReaction, authorize("reactions", "remove"), reactionController.remove);



module.exports = router;
