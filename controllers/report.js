const prisma = require("../config/connection");
const messages = require("../helper/messages");

const create = async (req, res) => {
	try {
		const post_id = req.params.post_id;	
		const user_id = req.session.user_id;
		const { reason } = req.body;	

		const report = await prisma.report.create({
			data: {
				postId: post_id,
				userId: user_id,
				reason, 
			}
		});

		return messages.createdSuccessfully(res, "Report Saved Successfully");

	} catch (error) {
		console.error("Saving report error: ", error);

		return messages.serverError(res);
	}
};

const retrieve = async (req, res) => {
	try {
		const report = req.data;

		res.json(report);

	} catch (error) {
		console.error("Retrieving report error: ", error);

		return messages.serverError(res);
	}
};

const update = async (req, res) => {
	try {
		const id = req.params.id;	

		const { reason } = req.body;

		await prisma.report.update({
			where: { id },
			data: {
				reason
			}
		});

		return messages.success(res, "Report updated successfully");
		
	} catch (error) {
		console.error("Updating report error: ", error);

		return messages.serverError(res);
	}
};

const remove = async (req, res) => {
	try {
		const id = req.params.id;	

		await prisma.report.delete({where: {id}});

		return messages.deletedSuccessfully(res, "Report deleted Successfully");

	} catch (error) {
		console.error("Deleting report error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	create,
	retrieve,
	update,
	remove
};
