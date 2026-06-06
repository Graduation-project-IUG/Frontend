const { doubleCsrf } = require("csrf-csrf");

const cookieName = process.env.NODE_ENV === "production" ? "__Host-psifi.x-csrf-token" : "psifi.x-csrf-token";
const cookieOptions = {
	httpOnly: true,
	sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	secure: process.env.NODE_ENV === "production",
	path: "/",
	partitioned: true
};


const fetchCsrf = async (req) => {
	const csrfResponse = await fetch("/api/csrf-token", {
		method: "GET",
        	credentials: "include",
        	headers: {
       			Accept: "application/json"
        	}
	});

	if (!csrfResponse.ok) {
        	console.error("Could not get CSRF token");
        	return req;
      	}

      	const data = await csrfResponse.json();

	return data.csrfToken;
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
	cookieOptions,
	fetchCsrf
};
