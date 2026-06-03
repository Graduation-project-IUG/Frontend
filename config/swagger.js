const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

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
				url: "https://graduation-project-s30r.onrender.com",
				description: "Production server",
			},
		],
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "sid",
				},
				csrfToken: {
					type: "apiKey",
					in: "header",
					name: "x-csrf-token",
				},
			},
		},
	},
	apis: [
		path.join(__dirname, "../controllers/*.js"),
	],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
