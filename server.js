const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");
const { generateToken, doubleCsrfProtection } = require("./middlewares/csrf");

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
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
}));

app.use(cookieParser());

app.get("/csrf-token", (req, res) => {
	req.session.csrfInitialized = true; // forces Express to save the session and send the sid cookie.

	req.session.save((error) => {
		if (error) {
			return res.status(500).json({ message: "Could not initialize CSRF" });
		}

		const csrfToken = generateToken(req, res);

		res.json({csrfToken});
	});
});

app.use(doubleCsrfProtection);


app.use("/", router);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	  console.log(`Server running on port ${PORT}`);
});
