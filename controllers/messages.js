exports.serverError = (res) => {
	res.status(500).json({
		message: "Server Error"
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

exports.createdSuccessfully = (res, message) => {
	res.status(201).json({
		message: message || "Created successfully"
	});
};

exports.deletedSuccessfully = (res, message) => {
	// 204 is for No content
	res.status(204).json({
		message: message || "Deleted successfully"
	});
};

exports.alreadyExists = (res, message) => {
	res.status(409).json({
		message: message || "Already exists"
	});
};
