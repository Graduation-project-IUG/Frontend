const prisma = require("../config/connection");
const messages = require("./messages");

const create = async (req, res) => {
	try {
		const { category, title, description, rating } = req.body;	

		if (!category) {
			return messages.serverError(res, "Empty category");
		}

		if (!title) {
			return messages.serverError(res, "Empty title");
		}

		const post = await prisma.post.create({
			data: {
				category,
				title,
				description: description ? description : null,
				rating: rating ? rating : null
			}
		});

		messages.createdSuccessfully(res, "Post Created Successfully");

	} catch (error) {
		console.error("Creating post error: ", error);

		messages.serverError(res);
	}
};

const retrieve = async (req, res) => {
	try {
		const post_id = req.params.id;	

		const post = await prisma.post.findUnique({where: {id: post_id});

		res.json(post);

	} catch (error) {
		console.error("Retrieving post error: ", error);

		messages.serverError(res);
	}
};

const update = async (req, res) => {
	try {
		const post_id = req.params.id;	

		messages.notImplemented(res);

		//await prisma.post.update();
		
	} catch (error) {
		console.error("updating post error: ", error);

		messages.serverError(res);
	}
};

const delete = async (req, res) => {
	try {
		const post_id = req.params.id;	

		await prisma.post.delete({where: {id: post_id}});

		res.status(204).json({
			message: "Deleted post successfully"
		});
		messages.createdSuccessfully(res, "Post Created Successfully");

	} catch (error) {
		console.error("Deleting post error: ", error);

		messages.serverError(res);
	}
};

module.exports = {
	create,
	retrieve,
	update,
	delete
};
