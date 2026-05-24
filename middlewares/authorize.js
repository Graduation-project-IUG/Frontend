const messages = require('../helper/messages');
const { hasPermission } = require("../permissions/engine");

function authorize(resource, action) {
	return function (req, res, next) {

		const user = req.user;
		const data = req.data || null;
	
		const allowed = hasPermission(user, resource, action, data);

		if (!allowed) {
			return messages.Unauthorized(res);
		}

		next();
	}

}

module.exports = { authorize };
