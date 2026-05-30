const prisma = require("../config/connection");
const messages = require("../helper/messages");

const create = async (req, res) => {
	try {
		const post_id = req.params.post_id;
		const user_id = req.session.user_id;
		const { content, rating } = req.body;	

		const comment = await prisma.comment.create({
			data: {
				postId: post_id,
				userId: user_id,
				content, 
				rating 
			}
		});

		return messages.createdSuccessfully(res, "Comment Saved Successfully");

	} catch (error) {
		console.error("Saving comment error: ", error);

		return messages.serverError(res);
	}
};

const retrieve = async (req, res) => {
	try {
		const comment = req.data;

		res.json(comment);

	} catch (error) {
		console.error("Retrieving comment error: ", error);

		return messages.serverError(res);
	}
};

const update = async (req, res) => {
	try {
		const id = req.params.id;
		
		const { content, rating } = req.data;

		await prisma.comment.update({
			where: { id },
			data: {
				content,
				rating
			}
		});
		
	} catch (error) {
		console.error("Updating comment error: ", error);

		return messages.serverError(res);
	}
};

const remove = async (req, res) => {
	try {
		const id = req.params.id;

		await prisma.comment.delete({where: {id}});

		return messages.deletedSuccessfully(res, "Comment deleted Successfully");

	} catch (error) {
		console.error("Deleting comment error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	create,
	retrieve,
	update,
	remove
};
