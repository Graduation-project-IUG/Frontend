const { z } = require("zod");

const create = z.object({
	reaction: z.coerce.number().min(0).max(100) // rating may come as a string
});

const update = z.object({
	reaction: z.coerce.number().min(0).max(100) // rating may come as a string
});

module.exports = {
	create,
        update
};
