const { z } = require("zod");

const create = z.object({
	content: z.string().min(3).max(500),
	rating: z.coerce.number().int().min(0).max(5).default(0) // rating may come as a string
}).strict();

const update = z.object({
	content: z.string().min(3).max(500),
	rating: z.coerce.number().int().min(0).max(5).default(0) // rating may come as a string
}).strict();

module.exports = {
	create,
        update
};
