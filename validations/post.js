const { z } = require("zod");

const create = z.object({
	category: z.string().min(3).max(20),
	title: z.string().min(5).max(100),
	description: z.string().min(8).max(1000).optional()
}).strict();

const update = z.object({
	category: z.string().min(3).max(20),
	title: z.string().min(5).max(100),
	description: z.string().min(8).max(1000).optional()
}).strict();

module.exports = {
	create,
        update
};
