const messages = require("../helper/messages");
const idPattern = /^\d{1,9}$/

const validate = (schema = null) => {
	return (req, res, next) => {
		const parameterKey = Object.keys(req.params)[0];
		if (parameterKey) {
			const id = req.params[parameterKey];

			if (id && !idPattern.test(id)) {
				return messages.badRequest(res, "Invalid parameter");
			}

			req.params[parameterKey] = Number(id);
		}

		if (!schema) {
			return next();
		}

		const result = schema.safeParse(req.body);

		if (!result.success) {
			return messages.badRequest(res, result.error.issues);
		}

		req.body = result.data;
		next();
	};
};

module.exports = { validate };
