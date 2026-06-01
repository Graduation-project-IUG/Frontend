const prisma = require("../config/connection");
const messages = require("../helper/messages");

const create = async (req, res) => {
	try {
		const post_id = req.params.post_id;
		const user_id = req.session.user_id;
		const { reaction } = req.body;	

		// upsert: create new or update existing record
		const response = await prisma.reaction.upsert({
			where: {
				userId_postId: { // compound key
					postId: post_id, 
					userId: user_id
				}
			},
			create: {
				postId: post_id,
				userId: user_id,
				reaction
			},
			update: {
				reaction
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
		const id = req.params.id;
		const { reaction } = req.body;

		await prisma.reaction.update({
			where: { id },
			data: {
				reaction
			}
		});

		return messages.success(res, "Reaction updated successfully");

		
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
