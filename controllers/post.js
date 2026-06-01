const prisma = require("../config/connection");
const messages = require("../helper/messages");

const create = async (req, res) => {
	try {
		const { category, title, description } = req.body;	

		const user_id = req.session.user_id;

		const post = await prisma.post.create({
			data: {
				category,
				title,
				userId: user_id,
				description: description ?? null
			}
		});

		return messages.createdSuccessfully(res, "Post Created Successfully");

	} catch (error) {
		console.error("Creating post error: ", error);

		return messages.serverError(res);
	}
};

const retrieve = async (req, res) => {
	const post = req.data;

	res.json(post);
};

const update = async (req, res) => {
	try {
		const id = req.params.id;

		const { category, title, description } = req.data;

		await prisma.post.update({
			where: {id},
			data: {
				category,
				title,
				description
			}
		});

		return messages.success(res, "Post updated successfully");
		
	} catch (error) {
		console.error("updating post error: ", error);

		return messages.serverError(res);
	}
};

const remove = async (req, res) => {
	try {
		const id = req.params.id;	

		await prisma.post.delete({where: {id}});

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
