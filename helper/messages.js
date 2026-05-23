exports.serverError = (res, message = "Server Error") => {
	res.status(500).json({
		message: message
	});
};

exports.notImplemented = (res) => {
	res.status(501).json({
		message: "Not Implemented"
	});
};

exports.badRequest = (res, message) => {
	res.status(400).json({
		message: message || "Bad Request"
	});
};

exports.Unauthenticated = (res) => {
	res.status(401).json({
		message: "Unauthenticated"
	});
};

exports.Unauthorized = (res) => {
	res.status(403).json({
		message: "Forbidden"
	});
};

exports.createdSuccessfully = (res, message) => {
	res.status(201).json({
		message: message || "Created successfully"
	});
};

exports.deletedSuccessfully = (res) => {
	res.status(204).send();
};

exports.alreadyExists = (res, message) => {
	res.status(409).json({
		message: message || "Already exists"
	});
};
