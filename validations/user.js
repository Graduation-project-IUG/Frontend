const { z } = require("zod");

const register = z.object({
	full_name: z.string().min(3),
	email: z.email(),
	password: z.string().min(8)
});

const login = z.object({
	email: z.email(),
        password: z.string().min(8)
});

// Not implemented yet
const update = z.object({
	full_name: z.string().min(3),
	email: z.email(),
	password: z.string().min(8)
});

module.exports = {
	register,
        login
};
