const messages = require("../helper/messages");
const paramsPattern = /^\d{1,9}$/

const validate = (schema = null) => {
	return (req, res, next) => {
		const parameter = Object.values(req.params)[0];

		if (parameter && !paramsPattern.test(parameter)) {
			return messages.badRequest(res, "Invalid parameter");
		}

		if (!schema) return;

		const result = schema.safeParse(req.body);

		if (!result.success) {
			return messages.badRequest(res, result.error.issues);
		}

		req.body = result.data;
		next();
	};
};

module.exports = { validate };
