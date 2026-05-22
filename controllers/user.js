const bcrypt = require("bcryptjs");
const prisma = require("../config/connection");


const login = async (req, res) => {
	try {
		const { email, password } = req.body;

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
			return res.status(401).json({
				message: "Invalid email or password"
			});
		}

		const passwordMatches = await bcrypt.compare(password, user.password);

		if (!passwordMatches) {
			return res.status(401).json({
				message: "Invalid email or password"
			});
		}

		// Regenerating session instead of updating existing one
		req.session.regenerate((error) => {
			if (error) {
				return res.status(500).json({
					message: "Could not create session"
				});
			}

			// Storing session data server-side, client can't edit session data
			req.session.user_id = user.id;
			req.session.email = user.email;
			req.session.role = user.role ? user.role.name : null;

			return res.json({
				message: "Login Successful"
			});
		});

	} catch (error) {
		console.error("login error:", error);

		res.status(500).json({
			message: "Server error"
		});
	}
};

const register = async (req, res) => {
	try {
		const { full_name, email, password } = req.body;

		const existingUser = await prisma.user.findUnique({where: { email }});

		if (existingUser) {
			return res.status(409).json({
				message: "Email already exists"
			});
		}

		const hashedPassword = await bcrypt.hash(password, 12); // 12 is the cost factor

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

		res.status(201).json({
			message: "Account created successfully",
			user
		});
	} catch (error) {
		console.error("Register error:", error);

		res.status(500).json({
			message: "Server error"
		});
	}
});

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

		res.status(500).json({
			message: "Server error"
		});
	}
};

const logout = (req, res) => {
	req.session.destroy((error) => {
		if (error) {
			return res.status(500).json({
				message: "Could not logout"
			});
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
});

module.exports = {
	login,
	register,
	profile,
	logout
};
