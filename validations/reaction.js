const { z } = require("zod");

const reactionSchema = z.preprocess(
	(value) => value === "" ? undefined : value,
	z.coerce
	.number({
		error: (issue) =>
		issue.input === undefined
			? "Reaction is required"
		        : "Reaction must be a number"
	})
	.int("Reaction must be an integer")
	.min(0, "Reaction must be at least 0")
	.max(100, "Reaction must be at most 100")
);

const create = z.object({
	reaction: reactionSchema
}).strict();

const update = z.object({
	reaction: reactionSchema
}).strict();

module.exports = {
	create,
        update
};
