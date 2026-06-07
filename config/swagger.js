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
				url: "/api"
			},
		],
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "sid",
					description: "Session cookie used for authentication."
				},
				csrfToken: {
					type: "apiKey",
					in: "header",
					name: "x-csrf-token",
					description: "CSRF token required for unsafe methods: POST, PUT, PATCH, DELETE."
				}
			},
			schemas: {
				User: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1 },
						full_name: { type: "string", example: "Ahmad Ali" },
						email: { type: "string", format: "email", example: "user@example.com" },
						phone: { type: "string", nullable: true, example: "+970599000000" },
						role: { type: "string", enum: ["Admin", "User"], example: "User" },
						bio: { type: "string", nullable: true, example: "Software engineering student." },
						birthdate: { type: "string", format: "date", nullable: true, example: "2000-01-15" },
						city: { type: "string", nullable: true, example: "Gaza" },
						createdAt: { type: "string", format: "date-time", nullable: true }
					}
				},

				Post: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1 },
						userId: { type: "integer", example: 7 },
						category: { type: "string", example: "News" },
						title: { type: "string", example: "My first post" },
						description: { type: "string", nullable: true, example: "This is the post description." },
						createdAt: { type: "string", format: "date-time", nullable: true }
					}
				},

				Comment: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1 },
						postId: { type: "integer", example: 1 },
						userId: { type: "integer", example: 7 },
						content: { type: "string", example: "This post was really helpful." },
						rating: { type: "number", format: "float", nullable: true, example: 5 },
						createdAt: { type: "string", format: "date-time", nullable: true }
					}
				},

				Report: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1 },
						userId: { type: "integer", example: 7 },
						postId: { type: "integer", example: 1 },
						reason: { type: "string", example: "This post contains inappropriate content." },
						createdAt: { type: "string", format: "date-time", nullable: true }
					}
				},

				Reaction: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1 },
						userId: { type: "integer", example: 7 },
						postId: { type: "integer", example: 1 },
						reaction: { type: "integer", example: 1 },
						createdAt: { type: "string", format: "date-time", nullable: true }
					}
				},

				RegisterRequest: {
					type: "object",
					required: ["full_name", "email", "password"],
					properties: {
						full_name: { type: "string", example: "Ahmad Ali" },
						email: { type: "string", format: "email", example: "user@example.com" },
						password: { type: "string", format: "password", example: "StrongPassword123" }
					}
				},

				LoginRequest: {
					type: "object",
					required: ["email", "password"],
					properties: {
						email: { type: "string", format: "email", example: "user@example.com" },
						password: { type: "string", format: "password", example: "StrongPassword123" }
					}
				},

				PostRequest: {
					type: "object",
					required: ["category", "title"],
					properties: {
						category: { type: "string", minLength: 3, maxLength: 20, example: "News" },
						title: { type: "string", minLength: 5, maxLength: 100, example: "My first post" },
						description: { type: "string", minLength: 8, maxLength: 1000, nullable: true, example: "This is the post description." }
					}
				},

				CommentRequest: {
					type: "object",
					required: ["content"],
					properties: {
						content: { type: "string", minLength: 3, maxLength: 500, example: "This post was really helpful." },
						rating: { type: "number", minimum: 0, maximum: 5, default: 0, example: 5 }
					}
				},

				ReportRequest: {
					type: "object",
					required: ["reason"],
					properties: {
						reason: { type: "string", minLength: 8, maxLength: 1000, example: "This post contains inappropriate content." }
					}
				},

				ReactionRequest: {
					type: "object",
					required: ["reaction"],
					properties: {
						reaction: { type: "integer", minimum: 0, maximum: 100, example: 1 }
					}
				},

				MessageResponse: {
					type: "object",
					properties: {
						message: { type: "string", example: "Operation successful" }
					}
				},

				ValidationErrorResponse: {
					type: "object",
					properties: {
						message: {
							type: "array",
							items: { type: "object" },
							example: [
								{
									path: ["title"],
									message: "Minimum length of title is 5"
								}
							]
						}
					}
				}
			}
		}
	},
	apis: [
		path.join(__dirname, "../controllers/*.js"),
	],
};

const swaggerOptions = {
	swaggerOptions: {
   		withCredentials: true,
    		persistAuthorization: true,


		// This runs client-side code
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

				csrfToken = data.csrfToken;

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

module.exports = { 
	swaggerSpec,
	swaggerOptions
}
