const { z } = require("zod");

const create = z.object({
	content: z.string().min(3).max(500),
	rating: z.coerce.number().min(0).max(5) // rating may come as a string
});

const update = z.object({
	content: z.string().min(3).max(500),
	rating: z.coerce.number().min(0).max(5) // rating may come as a string
});

module.exports = {
	create,
        update
};
