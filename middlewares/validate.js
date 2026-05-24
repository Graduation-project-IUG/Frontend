const messages = require("../helper/messages");
const paramsPattern = /^\d{1,9}$/

const validateBody = (schema) => {
	return (req, res, next) => {
		const parameter = Object.values(req.params)[0];

		if (parameter && !paramsPattern.test(parameter)) {
			return messages.badRequest(res, "Invalid parameter");
		}

		const result = schema.safeParse(req.body);

		if (!result.success) {
			return messages.badRequest(res, result.error.issues);
		}

		req.body = result.data;
		next();
	};
};

module.exports = {
	  validateBody
};
