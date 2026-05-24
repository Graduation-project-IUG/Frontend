const { doubleCsrf } = require("csrf-csrf");

const {
	generateToken,
	doubleCsrfProtection
} = doubleCsrf({
	getSecret: () => process.env.CSRF_SECRET,
	   
	getSessionIdentifier: (req) => req.sessionID, //Bind CSRF token to current session ID
	cookieName: process.env.NODE_ENV === "production" ? "__Host-psifi.x-csrf-token" : "psifi.x-csrf-token",	
        cookieOptions: {
		httpOnly: true,
	        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	        secure: process.env.NODE_ENV === "production",
	        path: "/"
	},
        size: 64,
        ignoredMethods: ["GET", "HEAD", "OPTIONS"],
	getTokenFromRequest: (req) => req.headers["x-csrf-token"]
});
	
module.exports = {
	generateToken,
	doubleCsrfProtection
};
