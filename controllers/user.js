const bcrypt = require("bcryptjs");
const prisma = require("../config/connection");
const messages = require("../helper/messages");
const { isEmail } = require("../helper/input_validation");

const HASH_COST_FACTOR = 12;

const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!isEmail(email.trim())) {
			return messages.badRequest(res, "Invalid email");
		} else if (!password) {
			return messages.badRequest(res, "Empty password");
		}


		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				full_name: true,
				email: true,
				password: true,
				role: {
					select: {
						id: true,
						name: true
					}
				}
			}
		});

		if (!user) {
			return messages.badRequest(res, "Invalid email or password");
		}

		const passwordMatches = await bcrypt.compare(password, user.password);

		if (!passwordMatches) {
			return messages.badRequest(res, "Invalid email or password");
		}

		// Regenerating session instead of updating existing one
		req.session.regenerate((error) => {
			if (error) {
				messages.serverError(res);
			}

			req.session.user_id = user.id;
			req.session.email = user.email;
			req.session.role = user.role ? user.role.name : null;

			req.session.save((error) => {
				if (error) {
					messages.serverError(res);
				}

				const csrfToken = generateToken(req, res, {
					overwrite: true
				});

				return res.json({
					message: "Login Successful",
					csrfToken
				});
			});
		});


	} catch (error) {
		console.error("login error:", error);

		return messages.serverError(res);
	}
};

const register = async (req, res) => {
	try {
		const { full_name, email, password } = req.body;

		if (!isEmail(email)) {
			return messages.badRequest(res, "Invalid email");
		} else if (!password) {
			return messages.badRequest(res, "Empty password");
		} else if () {

		}

		const existingUser = await prisma.user.findUnique({where: { email }});

		if (existingUser) {
			return messages.alreadyExists(res, "Email already exists");
		}

		const hashedPassword = await bcrypt.hash(password, HASH_COST_FACTOR); 

		const user = await prisma.user.create({
			data: {
				full_name,
				email,
				password: hashedPassword
			},
			select: {
				id: true,
				full_name: true,
				email: true
			}
		});

		return messages.createdSuccessfully(res, "Account created successfully");

	} catch (error) {
		console.error("Register error:", error);

		return messages.serverError(res);
	}
};

const profile = async (req, res) => {
	try {
		const user_id = req.session.user_id;	

		const user = await prisma.user.findUnique({
			where: {id: user_id},
			select: {
				full_name: true,
				email: true,
				phone: true,
				birthdate: true,
				bio: true,
				city: true
			}	
		});

		res.json(user);

	} catch (error) {
		console.error("Retrieving Profile error:", error);

		return messages.serverError(res);
	}
};

const logout = (req, res) => {
	req.session.destroy((error) => {
		if (error) {
			return messages.serverError(res, "Could not logout");
		}

		res.clearCookie("sid", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
		});

		return res.json({
			message: "Logged out successfully"
		});
	});
};

module.exports = {
	login,
	register,
	profile,
	logout
};
