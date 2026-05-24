const prisma = require("../config/connection");
const messages = require("../helper/messages");

const create = async (req, res) => {
	try {
		const post_id = req.params.post_id;	
		const user_id = req.session.user_id;
		const { reaction } = req.body;	

		const reaction = await prisma.reaction.create({
			data: {
				postId: post_id,
				userId: user_id,
				reaction, 
			}
		});

		return messages.createdSuccessfully(res, "Reaction Saved Successfully");

	} catch (error) {
		console.error("Saving reaction error: ", error);

		return messages.serverError(res);
	}
};

const retrieve = async (req, res) => {
	try {
		const reaction = req.data;

		res.json(reaction);

	} catch (error) {
		console.error("Retrieving reaction error: ", error);

		return messages.serverError(res);
	}
};

const update = async (req, res) => {
	try {

		return messages.notImplemented(res);

		//await prisma.reaction.update();
		
	} catch (error) {
		console.error("Updating reaction error: ", error);

		return messages.serverError(res);
	}
};

const remove = async (req, res) => {
	try {
		const id = req.params.id;	

		await prisma.reaction.delete({where: {id}});

		return messages.deletedSuccessfully(res, "Reaction deleted Successfully");

	} catch (error) {
		console.error("Deleting reaction error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	create,
	retrieve,
	update,
	remove
};
