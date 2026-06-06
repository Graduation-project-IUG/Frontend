const { doubleCsrf } = require("csrf-csrf");

const cookieName = process.env.NODE_ENV === "production" ? "__Host-psifi.x-csrf-token" : "psifi.x-csrf-token";
const cookieOptions = {
	httpOnly: true,
	sameSite: "lax",
	secure: true,
	maxAge: 1000 * 60 * 60 * 24 * 7,
	path: "/"
};



const {
	generateToken,
	doubleCsrfProtection
} = doubleCsrf({
	getSecret: () => process.env.CSRF_SECRET,
	getSessionIdentifier: (req) => req.sessionID, //Bind CSRF token to current session ID
	cookieName,
	cookieOptions,
        size: 64,
        ignoredMethods: ["GET", "HEAD", "OPTIONS"],
	getTokenFromRequest: (req) => req.headers["x-csrf-token"]
});
	
module.exports = {
	generateToken,
	doubleCsrfProtection,
	cookieName,
	cookieOptions
};
