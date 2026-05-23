const messages = require('../helper/messages');

function authenticate(req, res, next) {
	const userId = req.session?.user_id;	

	if (!userId) {
		return messages.Unauthenticated(res);
	}

	const user_role = req.session.role;
	
	req.user = {id: userId, role: user_role}

	next();
}

exports.module = authenticate;
