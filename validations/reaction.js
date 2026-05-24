const { z } = require("zod");

const create = z.object({
	reaction: z.coerce.number().int().min(0).max(100) // rating may come as a string
}).strict();

const update = z.object({
	reaction: z.coerce.number().int().min(0).max(100) // rating may come as a string
}).strict();

module.exports = {
	create,
        update
};
