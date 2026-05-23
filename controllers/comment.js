const prisma = require("../config/connection");
const messages = require("./messages");

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
				rating: rating ?? 0
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
		const comment_id = Number(req.params.id);	

		const comment = await prisma.comment.findUnique({
			where: {id: comment_id},
			select: {
				content: true,
				postId: true,
				rating: true
			}
		});

		if(!comment) {
			return res.status(404).json({message: "Comment not found"});	
		}

		const user_id = comment.userId;

		if (req.session.user_id != user_id) {
			return res.status(401).json({message: "Unauthorized"});	
		}

		res.json(comment);

	} catch (error) {
		console.error("Retrieving comment error: ", error);

		return messages.serverError(res);
	}
};

const update = async (req, res) => {
	try {
		const comment = req.params.id;	

		return messages.notImplemented(res);

		//await prisma.post.update();
		
	} catch (error) {
		console.error("Updating comment error: ", error);

		return messages.serverError(res);
	}
};

const remove = async (req, res) => {
	try {
		const comment_id = req.params.id;	

		const comment = await prisma.comment.findUnique({where: {id: comment_id}})

		if(!comment) {
			return res.status(404).json({message: "Comment not found"});	
		}

		const user_id = comment.userId;

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
