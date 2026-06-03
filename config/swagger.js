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
				url: "http://localhost:3000",
				description: "Local server",
			},
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
	apis: ["./controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
