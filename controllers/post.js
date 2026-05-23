const prisma = require("../config/connection");
const messages = require("./messages");
const { hasPermission } = require("../permissions/engine");

const create = async (req, res) => {
	try {
		const { category, title, description, rating } = req.body;	

		if (!category) {
			return messages.badRequest(res, "Empty category");
		}

		if (!title) {
			return messages.badRequest(res, "Empty title");
		}

		const post = await prisma.post.create({
			data: {
				category,
				title,
				description: description ?? null,
				rating: rating ?? 0
			}
		});

		return messages.createdSuccessfully(res, "Post Created Successfully");

	} catch (error) {
		console.error("Creating post error: ", error);

		return messages.serverError(res);
	}
};

const retrieve = async (req, res) => {
	try {
		const post_id = Number(req.params.id);	

		const post = await prisma.post.findUnique({where: {id: post_id}});

		const user_id = post.userId;

		if (req.session.user_id != user_id) {
			return res.status(401).json({message: "Unauthorized"});	
		}

		//const user = {id: req.session.user_id, role: req.session.role};

		//if(!hasPermission(user, "posts", "retrieve", post)) {
		//	return res.status(403).json({message: "Forbidden"});	
		//}

		res.json(post);

	} catch (error) {
		console.error("Retrieving post error: ", error);

		return messages.serverError(res);
	}
};

const update = async (req, res) => {
	try {
		const post_id = req.params.id;	

		return messages.notImplemented(res);

		//await prisma.post.update();
		
	} catch (error) {
		console.error("updating post error: ", error);

		return messages.serverError(res);
	}
};

const remove = async (req, res) => {
	try {
		const post_id = req.params.id;	

		const post = await prisma.post.findUnique({where: {id: post_id}});

		const user_id = post.userId;

		if (req.session.user_id != user_id) {
			return res.status(401).json({message: "Unauthorized"});	
		}

		await prisma.post.delete({where: {id: post_id}});

		return messages.deletedSuccessfully(res, "Post deleted Successfully");

	} catch (error) {
		console.error("Deleting post error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	create,
	retrieve,
	update,
	remove
};
