const prisma = require("../config/connection");
const messages = require('../helper/messages');

function authenticate(req, res, next) {
	const userId = req.session?.user_id;	

	if (!userId) {
		return messages.Unauthenticated(res);
	}

	// Handles user deletion and roles changing after authentication
	const user = prisma.user.findUnique({
		where: {id: userId}
	});

	if (!user) {
		return messages.Unauthenticated(res);
	}

	req.user = user;

	next();
}

module.exports = { authenticate };
