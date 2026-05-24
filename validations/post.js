const { z } = require("zod");

const create = z.object({
	category: z.string().min(3).max(20),
	title: z.string().min(5).max(100),
	description: z.string().min(8).max(1000),
	rating: z.coerce.number().min(0).max(5) // rating may come as a string
});

const update = z.object({
	category: z.string().min(3).max(20),
	title: z.string().min(5).max(100),
	description: z.string().min(8).max(1000),
	rating: z.coerce.number().min(0).max(5) // rating may come as a string
});

module.exports = {
	create,
        update
};
