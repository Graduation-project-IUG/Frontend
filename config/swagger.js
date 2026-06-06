const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const { fetchCsrf } = require("../middleswares/csrf");

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Graduation Project API",
			version: "1.0.0",
			description: "API documentation for the Graduation Project backend",
		},
		servers: [
			{
				url: "/api"
			},
		],
		
	},
	apis: [
		path.join(__dirname, "../controllers/*.js"),
	],
};

const swaggerOptions = {
	swaggerOptions: {
   		withCredentials: true,
    		persistAuthorization: true,

    		requestInterceptor: async (req) => {
      			req.credentials = "include";

			const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];

      			const method = req.method?.toUpperCase();

			const needsCsrf = unsafeMethods.includes(method);

      			// Avoid calling CSRF endpoint recursively, and on safe methods
      			if (!needsCsrf || req.url.includes("/api/csrf-token")) {
		       		return req;
      			}

			let csrfToken = sessionStorage.getItem("csrfToken");

			if (!csrfToken) {
				csrfToken = await fetchCsrf(req);

				sessionStorage.setItem("csrfToken", csrfToken);
			}

      			req.headers = req.headers || {};
      			req.headers["x-csrf-token"] = csrfToken;

      			return req;
    		},

		responseInterceptor: (res) => {
      			if (res.status === 401 || res.status === 403) {
				sessionStorage.removeItem("csrfToken");
    	  		}

      			return res;
    		}
	}
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
module.exports = swaggerOptions;
