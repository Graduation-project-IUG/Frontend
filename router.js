const express = require("express");
const router = express.Router();

const userController = require("./controllers/user")
const postController = require("./controllers/post")

function requireAuth(req, res, next) {
	if (!req.session || !req.session.userId) {
		return res.status(401).json({
			message: "Unauthorized"
		});
	}

	next();
}

router.post("/auth/login", userController.login);
router.post("/auth/logout", requireAuth, userController.logout);
router.post("/user/register", userController.register);

router.get("/user/profile", requireAuth, userController.profile);

router.post("/post", requireAuth, postController.create);
router.get("/post/:id", requireAuth, postController.retrieve);
router.put("/post/:id", requireAuth, postController.update);
router.delete("/post/:id", requireAuth, postController.delete);

module.exports = router;
