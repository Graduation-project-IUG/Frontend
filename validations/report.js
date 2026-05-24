const { z } = require("zod");

const create = z.object({
	reason: z.string().min(8).max(1000)
});

const update = z.object({
	reason: z.string().min(8).max(1000)
});

module.exports = {
	create,
        update
};
