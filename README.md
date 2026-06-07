# Graduation Project Backend API

A secure, production-ready REST API built for the graduation project backend using **Node.js**, **Express.js**, **Prisma ORM**, and **PostgreSQL**.

This backend does more than expose CRUD routes. It includes a complete request pipeline with session authentication, CSRF protection, ABAC authorization, Zod validation, Prisma database access, PostgreSQL-backed sessions, resource ownership checks, and Swagger/OpenAPI documentation.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Main Features](#main-features)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [Render Deployment](#render-deployment)
- [How Everything Is Connected Together](#how-everything-is-connected-together)
- [Authentication Flow](#authentication-flow)
- [CSRF Protection Flow](#csrf-protection-flow)
- [Authorization Model: ABAC](#authorization-model-abac)
- [Middleware Pipeline](#middleware-pipeline)
- [Database Schema](#database-schema)
- [Swagger / OpenAPI Documentation](#swagger--openapi-documentation)
- [Swagger Model Schemas](#swagger-model-schemas)
- [API Routes](#api-routes)
- [Validation Rules](#validation-rules)
- [Response Handling](#response-handling)
- [Security Notes](#security-notes)
- [Useful npm Scripts](#useful-npm-scripts)
- [Future Improvements](#future-improvements)

---

## Project Overview

This backend is the API layer for the graduation project. It follows a layered architecture where each part has a clear job:

1. **Server layer** configures Express, CORS, JSON parsing, sessions, cookies, CSRF protection, and routing.
2. **Router layer** defines all API endpoints and attaches the required middleware chain.
3. **Middleware layer** handles authentication, authorization, validation, CSRF protection, and resource loading.
4. **Controller layer** contains the business logic for users, posts, comments, reactions, and reports.
5. **Database layer** uses Prisma Client to communicate with PostgreSQL.
6. **Permission layer** centralizes access-control policies using ABAC-style rules.
7. **Documentation layer** exposes Swagger UI with endpoint documentation and reusable model schemas.

The result is a backend that is structured, secure, and ready to be connected to a frontend application.

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js `>=18` |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| Session Management | express-session |
| Session Store | connect-pg-simple |
| Validation | Zod |
| Password Hashing | bcryptjs |
| CSRF Protection | csrf-csrf |
| Cookies | cookie-parser |
| CORS | cors |
| API Documentation | swagger-jsdoc + swagger-ui-express |
| Deployment Target | Render |
| Package Manager | npm |

---

## Main Features

### 1. User Authentication

The backend uses **server-side session authentication**.

Implemented authentication features:

- User registration.
- User login.
- Password hashing with `bcryptjs`.
- Session regeneration after login to reduce session fixation risk.
- Storing authenticated user data in the server-side session.
- Database-backed session storage using PostgreSQL.
- Logout by destroying the session.
- Clearing both the `sid` session cookie and CSRF cookie on logout.
- Authenticated profile endpoint.

Main files:

```text
controllers/user.js
middlewares/authenticate.js
server.js
```

---

### 2. Session Management

The project uses `express-session` with `connect-pg-simple` to store sessions in PostgreSQL.

Current session configuration includes:

- Cookie name: `sid`
- HTTP-only cookie.
- Secure cookie.
- SameSite cookie protection.
- 7-day cookie lifetime.
- PostgreSQL session table.
- Automatic session table creation using `createTableIfMissing: true`.

Main file:

```text
server.js
```

---

### 3. CSRF Protection

The API uses the `csrf-csrf` package with a double-submit CSRF pattern.

Implemented CSRF features:

- CSRF token generation.
- Signed CSRF cookie storage.
- CSRF token validation through the `x-csrf-token` request header.
- CSRF token binding to the current session ID.
- Safe methods ignored: `GET`, `HEAD`, and `OPTIONS`.
- Global CSRF protection before application routes.
- `/csrf-token` endpoint for token generation.
- CSRF token returned after successful login.
- Swagger request interceptor that automatically fetches and sends CSRF tokens for unsafe requests.

Main files:

```text
middlewares/csrf.js
server.js
config/swagger.js
controllers/user.js
```

---

### 4. Authorization

The project uses **Attribute-Based Access Control (ABAC)**.

This is not pure RBAC because the access decision does not depend only on the user role. The permission engine also checks attributes such as:

- The current user's `id`.
- The current user's `role`.
- The requested resource type.
- The requested action.
- The loaded database resource.
- The resource owner, such as `post.userId`, `comment.userId`, `report.userId`, and `reaction.userId`.

So, the role is treated as one subject attribute inside a broader ABAC decision.

Example:

```js
update: (user, post) => user.id == post.userId
```

This rule means a regular user can update a post only when the post belongs to them.

Main files:

```text
permissions/roles.js
permissions/engine.js
middlewares/authorize.js
middlewares/loadResources.js
```

---

### 5. Resource Loading

Before retrieving, updating, or deleting a resource, the backend loads it from the database.

Resource loaders:

```text
loadPost
loadComment
loadReport
loadReaction
```

Resource loading is important because ABAC needs the actual database object to make ownership decisions.

Example update flow:

```text
PUT /post/:id
→ authenticate
→ validate request
→ loadPost
→ authorize("posts", "update")
→ postController.update
```

---

### 6. Request Validation

The project uses Zod to validate request bodies and route parameters.

Validation is implemented for:

- User registration.
- User login.
- Post creation and update.
- Comment creation and update.
- Report creation and update.
- Reaction creation and update.
- Route parameter validation.

Main files:

```text
validations/user.js
validations/post.js
validations/comment.js
validations/report.js
validations/reaction.js
middlewares/validate.js
```

The `validate` middleware also converts valid numeric route parameters from strings to numbers.

---

### 7. Swagger API Documentation

Swagger is integrated using:

```text
swagger-jsdoc
swagger-ui-express
```

Swagger reads OpenAPI comments from:

```text
controllers/*.js
```

Swagger UI is served from:

```text
/api-docs
```

Access to Swagger is protected using the same ABAC authorization system:

```text
authenticate → authorize("api", "view")
```

In the current policy, Admin users can view the API documentation and regular users cannot.

---

## Project Structure

```text
.
├── config
│   ├── connection.js        # Prisma client instance
│   └── swagger.js           # Swagger/OpenAPI configuration
│
├── controllers
│   ├── comment.js           # Comment CRUD logic
│   ├── post.js              # Post CRUD logic
│   ├── reaction.js          # Reaction CRUD/upsert logic
│   ├── report.js            # Report CRUD/upsert logic
│   └── user.js              # Auth, register, profile, logout
│
├── helper
│   └── messages.js          # Central response helpers
│
├── middlewares
│   ├── authenticate.js      # Session authentication
│   ├── authorize.js         # ABAC permission checking
│   ├── csrf.js              # CSRF configuration
│   ├── loadResources.js     # DB resource loading before authorization
│   └── validate.js          # Zod and route parameter validation
│
├── permissions
│   ├── engine.js            # Permission evaluation engine
│   └── roles.js             # Access policy rules and ownership conditions
│
├── prisma
│   └── schema.prisma        # Prisma schema and database models
│
├── validations
│   ├── comment.js
│   ├── post.js
│   ├── reaction.js
│   ├── report.js
│   └── user.js
│
├── router.js                # API routes and route-level middleware chain
├── server.js                # Express app setup
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

SESSION_SECRET="replace-with-a-long-random-secret"
CSRF_SECRET="replace-with-another-long-random-secret"

FRONTEND_URL="http://localhost:3000"
```

| Variable | Required | Description |
|---|---:|---|
| `NODE_ENV` | Yes | Use `development` locally and `production` on Render. |
| `PORT` | No | Local server port. Render provides this automatically in production. |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma and the session store. |
| `SESSION_SECRET` | Yes | Secret used to sign the session ID cookie. |
| `CSRF_SECRET` | Yes | Secret used by the CSRF token generator. |
| `FRONTEND_URL` | Yes | Allowed frontend origin for CORS. |

Never commit `.env` files to GitHub.

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/SaeedAdas/graduation-project/tree/backend
cd ~/projects/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

```bash
cp .env.example .env
```

If `.env.example` does not exist yet, create `.env` manually using the variables listed above.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

This is also handled by:

```bash
npm run build
```

and by the `postinstall` script.

### 5. Sync the database schema

For development:

```bash
npm run db:push
```

or:

```bash
npx prisma db push
```

For a migration-based workflow:

```bash
npx prisma migrate dev --name init
```

Then commit the generated `prisma/migrations` folder.

---

## Database Setup

The project uses PostgreSQL.

You can use:

- Local PostgreSQL.
- Neon PostgreSQL.
- Render PostgreSQL.
- Supabase PostgreSQL.

After setting `DATABASE_URL`, run:

```bash
npm run db:push
```

To inspect the database visually during development:

```bash
npm run prisma:studio
```

Prisma Studio usually opens on:

```text
http://localhost:5555
```

---

## Running the Project

Start the server:

```bash
npm start
```

By default, the server runs on:

```text
http://localhost:5000
```

If `PORT` is set in `.env`, the server uses that value.

---

## Render Deployment

This project can be deployed as a Render Web Service.

### 1. Push the project to GitHub

```bash
git add .
git commit -m "Prepare backend for deployment"
git push
```

### 2. Create or connect a PostgreSQL database

Use Render PostgreSQL, Neon, Supabase, or any PostgreSQL provider.

Copy the connection string and save it as:

```env
DATABASE_URL="your-production-postgresql-url"
```

### 3. Create a new Render Web Service

Recommended settings:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install --production=false && npm run build` |
| Start Command | `npm start` |
| Pre-Deploy Command | `npm run db:deploy` |
| Node Version | `>=18` |

The start command runs:

```bash
node server.js
```

because `package.json` contains:

```json
"start": "node server.js"
```

### 4. Add environment variables on Render

```env
NODE_ENV=production
DATABASE_URL=your-production-postgresql-url
SESSION_SECRET=your-production-session-secret
CSRF_SECRET=your-production-csrf-secret
FRONTEND_URL=https://your-frontend-domain.com
```

Do not add quotes in the Render dashboard unless Render explicitly expects them.

### 5. Production Prisma migrations

Recommended production flow:

```bash
npx prisma migrate dev --name migration-name
git add prisma/migrations
git commit -m "Add database migration"
git push
```

On Render, set the Pre-Deploy Command to:

```bash
npm run db:deploy
```

This runs:

```bash
prisma migrate deploy
```

before the server starts.

If the project does not yet include a `prisma/migrations` folder, `npm run db:push` can be used during early development. For real production deployments, migrations are safer.

### 6. Production cookies and HTTPS

The project uses secure cookies. This works correctly on Render because Render provides HTTPS.

Current cookie behavior:

- Session cookie is secure.
- CSRF cookie is secure.
- Cookies are HTTP-only.
- Session max age is 7 days.
- CSRF max age is 7 days.

For local HTTP testing, browsers may refuse to store secure cookies. Use local HTTPS or temporarily adjust cookie `secure` settings during development only.

---

## How Everything Is Connected Together

The request lifecycle looks like this:

```text
Client / Frontend
    ↓
Express server.js
    ↓
CORS + JSON parser
    ↓
Session middleware
    ↓
Cookie parser
    ↓
/csrf-token route if token is requested
    ↓
Global CSRF protection
    ↓
router.js
    ↓
Route-level middleware chain
    ↓
Controller
    ↓
Prisma Client
    ↓
PostgreSQL
    ↓
Response helper
    ↓
Client / Frontend
```

Example protected request:

```text
PUT /post/5
    ↓
Browser sends sid session cookie
    ↓
Frontend sends x-csrf-token header
    ↓
CSRF middleware validates token against the session
    ↓
authenticate middleware loads the current user from DB
    ↓
validate middleware validates params and body
    ↓
loadPost middleware loads post 5 from DB
    ↓
authorize middleware checks ABAC policy
    ↓
controller updates the post using Prisma
    ↓
response is returned
```

Each layer does one job. That is the point: less chaos, fewer bugs, and a backend that is easier to maintain.

---

## Authentication Flow

### Register

Endpoint:

```http
POST /user/register
```

Flow:

```text
Request body
    ↓
Zod validation
    ↓
Check if email already exists
    ↓
Hash password using bcrypt
    ↓
Create user with Prisma
    ↓
Return success response
```

Request body:

```json
{
  "full_name": "Ahmad Ali",
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

---

### Login

Endpoint:

```http
POST /auth/login
```

Flow:

```text
Request body
    ↓
Zod validation
    ↓
Find user by email
    ↓
Compare password using bcrypt
    ↓
Regenerate session
    ↓
Store user_id, email, and role in session
    ↓
Generate CSRF token
    ↓
Return login response + CSRF token
```

Successful response:

```json
{
  "message": "Login Successful",
  "csrfToken": "generated-csrf-token"
}
```

---

### Authenticated Requests

Protected endpoints use:

```js
authenticate
```

The middleware checks:

1. Does the session contain `user_id`?
2. Does this user still exist in the database?
3. If yes, attach the user record to `req.user`.

This means if a user is deleted from the database after logging in, their old session no longer grants access.

---

### Logout

Endpoint:

```http
POST /auth/logout
```

Flow:

```text
Destroy session
    ↓
Clear sid cookie
    ↓
Clear CSRF cookie
    ↓
Return logout response
```

Response:

```json
{
  "message": "Logged out successfully"
}
```

---

## CSRF Protection Flow

The backend protects unsafe HTTP methods:

```text
POST
PUT
PATCH
DELETE
```

Safe methods are ignored:

```text
GET
HEAD
OPTIONS
```

### CSRF Token Endpoint

Endpoint:

```http
GET /csrf-token
```

What it does:

1. Forces session initialization.
2. Saves the session.
3. Generates a CSRF token.
4. Sends the CSRF token in the response.
5. Stores the signed CSRF token in an HTTP-only cookie.

Response:

```json
{
  "csrfToken": "generated-token"
}
```

### Sending Unsafe Requests

For unsafe requests, the frontend must send:

1. The session cookie through browser credentials.
2. The CSRF token in the request header.

```http
x-csrf-token: generated-token
```

Example:

```js
await fetch("/api/post", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "x-csrf-token": csrfToken
  },
  body: JSON.stringify({
    category: "News",
    title: "My first post",
    description: "This is the post description"
  })
});
```

---

## Authorization Model: ABAC

The authorization system is **Attribute-Based Access Control (ABAC)**.

The project still has `Admin` and `User`, but those roles are not the whole access model. They are attributes used by the permission engine.

The access decision is based on this tuple:

```text
subject + resource + action + resource data
```

| Part | Example |
|---|---|
| Subject attributes | `user.id`, `user.role` |
| Resource | `posts`, `comments`, `reports`, `reactions`, `users`, `api` |
| Action | `view`, `create`, `update`, `remove` |
| Resource attributes | `post.userId`, `comment.userId`, `report.userId`, `reaction.userId` |

### Permission Engine

File:

```text
permissions/engine.js
```

The engine receives:

```js
hasPermission(subject, resource, action, data)
```

| Parameter | Meaning |
|---|---|
| `subject` | The current authenticated user. |
| `resource` | The resource being accessed. |
| `action` | The requested action. |
| `data` | The loaded database resource used for ownership checks. |

### Policy File

File:

```text
permissions/roles.js
```

Despite the file name, this file acts as the access policy map. It includes both simple role permissions and attribute-based ownership rules.

### Admin Policy

Admin can:

- View, create, update, and remove posts.
- View, create, update, and remove comments.
- View, create, update, and remove reactions.
- View, create, update, and remove reports.
- View, create, update, and remove users.
- View Swagger API documentation.

### User Policy

User can:

- View posts.
- Create posts.
- Update/remove only their own posts.
- View comments.
- Create comments.
- Update/remove only their own comments.
- Create reactions.
- Update/remove only their own reactions.
- Create reports.
- View/update/remove only their own reports.
- View/update/remove only their own user data.
- Cannot view API documentation.

Example ABAC ownership rules:

```js
update: (user, post) => user.id == post.userId
remove: (user, comment) => user.id == comment.userId
view: (user, report) => user.id == report.userId
```

A regular user is not allowed just because they are a `User`. They are allowed only when their attributes match the resource attributes. That is the ABAC part.

---

## Middleware Pipeline

### Global Middlewares

Defined in `server.js`:

| Middleware | Purpose |
|---|---|
| `cors` | Allows requests from the configured frontend origin. |
| `express.json()` | Parses JSON request bodies. |
| `express-session` | Creates and reads server-side sessions. |
| `cookieParser()` | Parses cookies. |
| `/csrf-token` route | Generates CSRF tokens. |
| `doubleCsrfProtection` | Protects unsafe requests from CSRF attacks. |
| `router` | Mounts all application routes. |

### Route-Level Middlewares

Defined in `router.js`:

| Middleware | Purpose |
|---|---|
| `authenticate` | Ensures the user is logged in and loads the user from DB. |
| `validate` | Validates route params and request body. |
| `loadPost` | Loads a post from DB and attaches it to `req.data`. |
| `loadComment` | Loads a comment from DB and attaches it to `req.data`. |
| `loadReport` | Loads a report from DB and attaches it to `req.data`. |
| `loadReaction` | Loads a reaction from DB and attaches it to `req.data`. |
| `authorize` | Checks ABAC permissions for the requested action. |

---

## Database Schema

The database schema is defined in:

```text
prisma/schema.prisma
```

### User

Represents application users.

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key. |
| `email` | String | Unique email, max 50 characters. |
| `phone` | String? | Optional, unique, max 20 characters. |
| `password` | String | Hashed password. |
| `role` | UserRole | Defaults to `User`. |
| `full_name` | String | User full name. |
| `bio` | String? | Optional. |
| `birthdate` | DateTime? | Optional date. |
| `city` | String? | Optional, max 50 characters. |
| `createdAt` | DateTime? | Defaults to current timestamp. |

Relations:

- One user has many posts.
- One user has many comments.
- One user has many reports.
- One user has many reactions.

---

### Post

Represents user-created posts.

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key. |
| `userId` | Int | Owner user ID. |
| `category` | String | Max 20 characters. |
| `title` | String | Max 100 characters. |
| `description` | String? | Optional. |
| `createdAt` | DateTime? | Defaults to current timestamp. |

Relations:

- Post belongs to one user.
- Post has many comments.
- Post has many reports.
- Post has many reactions.

---

### Comment

Represents comments on posts.

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key. |
| `postId` | Int | Related post ID. |
| `userId` | Int | Comment owner ID. |
| `content` | String | Comment content. |
| `rating` | Float? | Optional rating. |
| `createdAt` | DateTime? | Defaults to current timestamp. |

Delete behavior:

- If the related post is deleted, comments are deleted.
- If the related user is deleted, comments are deleted.

---

### Report

Represents reports submitted by users against posts.

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key. |
| `userId` | Int | Report owner ID. |
| `postId` | Int | Reported post ID. |
| `reason` | String | Report reason. |
| `createdAt` | DateTime? | Defaults to current timestamp. |

Constraint:

```prisma
@@unique([userId, postId])
```

This prevents the same user from creating duplicate reports for the same post.

---

### Reaction

Represents user reactions on posts.

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key. |
| `userId` | Int | Reaction owner ID. |
| `postId` | Int | Related post ID. |
| `reaction` | Int | Reaction value. |
| `createdAt` | DateTime? | Defaults to current timestamp. |

Constraint:

```prisma
@@unique([userId, postId])
```

This prevents the same user from creating duplicate reactions for the same post.

---

## Swagger / OpenAPI Documentation

Swagger is configured in:

```text
config/swagger.js
```

The OpenAPI spec is generated from comments inside:

```text
controllers/*.js
```

Swagger UI options include:

```js
withCredentials: true
persistAuthorization: true
```

The Swagger request interceptor:

1. Sends requests with credentials.
2. Detects unsafe methods.
3. Fetches `/api/csrf-token` if no token exists in `sessionStorage`.
4. Adds the CSRF token to the `x-csrf-token` header.
5. Clears the saved CSRF token on `401` or `403`.

This makes Swagger usable with session authentication and CSRF protection.

---

## Swagger Model Schemas

Swagger UI shows the **Schemas** section when reusable schemas are defined under `components.schemas` in the OpenAPI definition.

The project should define schemas for:

- `User`
- `Post`
- `Comment`
- `Report`
- `Reaction`

It is also useful to define request and response schemas such as:

- `RegisterRequest`
- `LoginRequest`
- `PostRequest`
- `CommentRequest`
- `ReportRequest`
- `ReactionRequest`
- `MessageResponse`
- `ValidationErrorResponse`

Add the following `components` object inside the `definition` object in `config/swagger.js`.

```js
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
```

After this change, Swagger UI will display these model schemas in the **Schemas** section, similar to the screenshot.

A ready-to-use version is included in the accompanying `swagger.with-schemas.js` file.

---

## API Routes

### Authentication and Users

| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/auth/login` | Login user and generate CSRF token | Public |
| `POST` | `/auth/logout` | Destroy current session and clear cookies | Authenticated |
| `POST` | `/user/register` | Register new user | Public |
| `GET` | `/user/profile` | Get current authenticated user profile | Authenticated |

---

### Posts

| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/post` | Create a new post | Authenticated |
| `GET` | `/post/:id` | Retrieve one post | Authenticated |
| `PUT` | `/post/:id` | Update a post | Owner or Admin |
| `DELETE` | `/post/:id` | Delete a post | Owner or Admin |

---

### Comments

| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/comment/:post_id` | Create comment on a post | Authenticated |
| `GET` | `/comment/:id` | Retrieve one comment | Authenticated |
| `PUT` | `/comment/:id` | Update a comment | Owner or Admin |
| `DELETE` | `/comment/:id` | Delete a comment | Owner or Admin |

---

### Reports

| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/report/:post_id` | Create or update report for a post | Authenticated |
| `GET` | `/report/:id` | Retrieve one report | Owner or Admin |
| `PUT` | `/report/:id` | Update report | Owner or Admin |
| `DELETE` | `/report/:id` | Delete report | Owner or Admin |

---

### Reactions

| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/reaction/:post_id` | Create or update reaction for a post | Authenticated |
| `GET` | `/reaction/:id` | Retrieve one reaction | Authenticated |
| `PUT` | `/reaction/:id` | Update reaction | Owner or Admin |
| `DELETE` | `/reaction/:id` | Delete reaction | Owner or Admin |

---

### CSRF

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/csrf-token` | Generate CSRF token for the current session | Public/session-aware |

---

### Swagger

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/api-docs` | Swagger API documentation | Admin only |

---

## Validation Rules

### User Register

```js
full_name: string, min 3
email: valid email
password: string, min 8
```

### User Login

```js
email: valid email
password: string, min 8
```

### Post

```js
category: string, min 3, max 20
title: string, min 5, max 100
description: optional string, min 8, max 1000
```

### Comment

```js
content: string, min 3, max 500
rating: number, min 0, max 5, default 0
```

### Report

```js
reason: string, min 8, max 1000
```

### Reaction

```js
reaction: integer, min 0, max 100
```

### Route Parameters

Route parameters are validated using:

```js
/^\d{1,9}$/
```

If valid, the parameter is converted from string to number.

---

## Response Handling

Responses are centralized in:

```text
helper/messages.js
```

| Helper | Status Code | Meaning |
|---|---:|---|
| `success` | `200` | General successful operation. |
| `createdSuccessfully` | `201` | Resource created successfully. |
| `deletedSuccessfully` | `204` | Resource deleted successfully. |
| `badRequest` | `400` | Validation or bad request error. |
| `Unauthenticated` | `401` | User is not logged in. |
| `Unauthorized` | `403` | User does not have permission. |
| `notFound` | `404` | Resource not found. |
| `alreadyExists` | `409` | Duplicate resource. |
| `serverError` | `500` | Server error. |
| `notImplemented` | `501` | Feature not implemented. |

---

## Security Notes

### Password Security

Passwords are hashed using `bcryptjs` before storage.

Current hash cost:

```js
const HASH_COST_FACTOR = 12;
```

### Session Security

The project uses server-side sessions instead of storing authentication data in the browser.

The browser stores only the session ID cookie. The actual session data is stored in PostgreSQL.

### CSRF Security

The CSRF token is bound to the current session ID:

```js
getSessionIdentifier: (req) => req.sessionID
```

This prevents a token from being reused across different sessions.

### CORS Security

CORS is configured with one frontend origin:

```js
origin: process.env.FRONTEND_URL
```

Credentials are enabled:

```js
credentials: true
```

This is required because the frontend sends cookies with API requests.

### HTTPS Requirement

The project uses secure cookies. In production, that is correct.

For local HTTP development, secure cookies may not be stored by the browser. Use local HTTPS or temporarily disable secure cookies in development only.

---

## Useful npm Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `node server.js` | Starts the Express server. |
| `npm run build` | `prisma generate` | Generates Prisma Client. |
| `npm run db:push` | `prisma db push` | Pushes Prisma schema to DB in development. |
| `npm run db:push:force` | `prisma db push --accept-data-loss` | Pushes schema and accepts data loss. Use carefully. |
| `npm run db:deploy` | `prisma migrate deploy` | Applies production migrations. |
| `npm run prisma:studio` | `prisma studio` | Opens Prisma Studio. |

---

## Future Improvements

Recommended next steps:

1. Add a `.env.example` file.
2. Add a `dev` script using `nodemon`.
3. Add centralized error-handling middleware.
4. Add rate limiting for login and unsafe routes.
5. Add request logging.
6. Add automated tests.
7. Add Prisma migrations and commit `prisma/migrations`.
8. Add pagination for list endpoints.
9. Add indexes for frequently queried fields.
10. Add account update and password reset flows.
11. Add email verification if public registration is enabled.
12. Harden the permission engine with optional chaining for missing role/resource/action keys.
13. Refactor Swagger endpoint comments to use `$ref` schemas from `components.schemas`.
14. Add health check endpoint for deployment monitoring.
15. Rename `permissions/roles.js` to something like `permissions/policies.js` if you want the code naming to match ABAC more clearly.

---

## Summary

This backend provides a solid foundation for a secure graduation project API.

It includes:

- Express API routing.
- Prisma ORM with PostgreSQL.
- User registration and login.
- Password hashing.
- Server-side sessions.
- PostgreSQL session storage.
- CSRF protection.
- ABAC authorization with ownership checks.
- Zod request validation.
- Resource loading middleware.
- Swagger API documentation.
- Reusable Swagger model schemas.
- Render-ready deployment configuration.

The architecture is clean and practical: each middleware does one job, controllers stay focused on business logic, Prisma handles database access, and the permission engine controls access based on the user's attributes and the resource's attributes.
