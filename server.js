const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");
const { doubleCsrf } = require("csrf-csrf");

const router = require('./router');

const app = express();

app.set("trust proxy", 1);

app.use(cors({
	  origin: process.env.FRONTEND_URL,
	  credentials: true
}));

app.use(express.json());

const pgPool = new Pool({
	  connectionString: process.env.DATABASE_URL,
	  ssl: process.env.NODE_ENV === "production"
	    ? { rejectUnauthorized: false }
	    : false
});

app.use(session({
	  store: new pgSession({
		      pool: pgPool,
		      tableName: "session",
		      createTableIfMissing: true
		    }),
	  name: "sid",
	  secret: process.env.SESSION_SECRET,
	  resave: false,
	  saveUninitialized: false,
	  proxy: true,
	  cookie: {
		      httpOnly: true,
		      secure: process.env.NODE_ENV === "production",
		      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		      maxAge: 1000 * 60 * 60 * 24 * 7
		    }
}));

app.use(cookieParser());

const {
	  generateToken,
	  doubleCsrfProtection
} = doubleCsrf({
	  getSecret: () => process.env.CSRF_SECRET,
	  getSessionIdentifier: (req) => req.sessionID, // Bind CSRF token to session id
	  cookieName: "__Host-psifi.x-csrf-token",
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


app.get("/csrf-token", (req, res) => {
	req.session.csrfInitialized = true; // forces Express to save the session and send the sid cookie.
	const csrfToken = generateToken(req, res);

	res.json({csrfToken});
});

app.use(doubleCsrfProtection);


app.use("/", router);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	  console.log(`Server running on port ${PORT}`);
});
