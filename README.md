# Graduation Project Backend API

A production-oriented REST API built for the graduation project backend.  
The project provides user authentication, session management, CSRF protection, role-based authorization, validation, resource ownership checks, Swagger API documentation, and a PostgreSQL database layer powered by Prisma ORM.

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
- [How the Backend Is Connected Together](#how-the-backend-is-connected-together)
- [Authentication Flow](#authentication-flow)
- [CSRF Protection Flow](#csrf-protection-flow)
- [Authorization Model](#authorization-model)
- [Middleware Pipeline](#middleware-pipeline)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Swagger Documentation](#swagger-documentation)
- [Validation Rules](#validation-rules)
- [Response Handling](#response-handling)
- [Security Notes](#security-notes)
- [Useful npm Scripts](#useful-npm-scripts)
- [Future Improvements](#future-improvements)

---

## Project Overview

This backend is a Node.js and Express API for a graduation project. It is designed around a clean layered structure:

1. **Server layer**: configures Express, CORS, sessions, cookies, CSRF protection, and routing.
2. **Router layer**: defines API endpoints and attaches the required middleware chain.
3. **Middleware layer**: handles authentication, authorization, validation, CSRF protection, and resource loading.
4. **Controller layer**: contains the actual business logic for users, posts, comments, reactions, and reports.
5. **Database layer**: uses Prisma Client to communicate with PostgreSQL.
6. **Permission layer**: centralizes role permissions and ownership rules.

The API is not just a collection of routes. It includes a complete security flow built around sessions, CSRF protection, RBAC permissions, validation, and database-backed user verification.

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js `>=18` |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| Session Store | `express-session` + `connect-pg-simple` |
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

The backend supports session-based authentication.

Implemented features:

- User registration.
- User login.
- Password hashing using `bcryptjs`.
- Session regeneration after login to reduce session fixation risk.
- Storing authenticated user data inside the server-side session.
- Logout by destroying the session.
- Clearing both the session cookie and CSRF cookie on logout.
- Profile endpoint for authenticated users.

Authentication is handled mainly in:

```text
controllers/user.js
middlewares/authenticate.js
server.js
```

---

### 2. Session Management

The project uses `express-session` with PostgreSQL as the session store.

Session configuration includes:

- Cookie name: `sid`
- HTTP-only cookies.
- Secure cookies.
- SameSite protection.
- 7-day session lifetime.
- PostgreSQL-backed session table using `connect-pg-simple`.
- Automatic session table creation through `createTableIfMissing: true`.

The session store is configured in `server.js`.

```js
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
```

---

### 3. CSRF Protection

The API uses the `csrf-csrf` package with the double-submit CSRF pattern.

Implemented CSRF features:

- CSRF token generation.
- CSRF cookie storage.
- CSRF token validation through the `x-csrf-token` request header.
- Token binding to the current session ID.
- Ignoring safe HTTP methods: `GET`, `HEAD`, and `OPTIONS`.
- Applying CSRF protection globally before API routes.
- Returning a CSRF token from `/csrf-token`.
- Returning a CSRF token after successful login.
- Swagger UI automatically fetches and attaches CSRF tokens for unsafe requests.

Important files:

```text
middlewares/csrf.js
server.js
config/swagger.js
controllers/user.js
```

---

### 4. Authorization

The project uses a role-based authorization model with ownership-aware rules.

Roles currently implemented:

- `Admin`
- `User`

The authorization logic is split into:

```text
permissions/roles.js
permissions/engine.js
middlewares/authorize.js
```

Admins can manage all main resources.

Users can:

- View and create posts.
- Update/delete only their own posts.
- View and create comments.
- Update/delete only their own comments.
- Create reports.
- View/update/delete only their own reports.
- Create/update/delete their own reactions.
- View their own user data only.
- Cannot access Swagger API documentation.

This makes the model mostly RBAC, with object ownership checks for user-owned resources.

---

### 5. Resource Loading

Before updating, deleting, or retrieving a resource, the backend loads it from the database.

This allows the authorization middleware to check ownership using the actual database record.

Resource loaders:

```text
loadPost
loadComment
loadReport
loadReaction
```

Defined in:

```text
middlewares/loadResources.js
```

Example flow for updating a post:

```text
PUT /post/:id
→ authenticate
→ validate request
→ loadPost
→ authorize("posts", "update")
→ postController.update
```

The important part: authorization runs **after** the resource is loaded, so ownership checks can compare:

```js
user.id == post.userId
```

---

### 6. Request Validation

The project uses Zod for validation.

Validation is implemented for:

- User registration.
- User login.
- Post creation/update.
- Comment creation/update.
- Report creation/update.
- Reaction creation/update.
- Route parameter validation.

Validation files:

```text
validations/user.js
validations/post.js
validations/comment.js
validations/report.js
validations/reaction.js
middlewares/validate.js
```

The `validate` middleware also converts route parameters from strings to numbers after checking that they match the allowed numeric pattern.

---

### 7. Posts

Implemented post features:

- Create a post.
- Retrieve a post.
- Update a post.
- Delete a post.
- Validate category, title, and description.
- Restrict update/delete to the post owner or Admin.
- Connect each post to the authenticated user.

Main files:

```text
controllers/post.js
validations/post.js
permissions/roles.js
```

---

### 8. Comments

Implemented comment features:

- Create a comment on a post.
- Retrieve a comment.
- Update a comment.
- Delete a comment.
- Validate content and rating.
- Ensure the target post exists before creating a comment.
- Restrict update/delete to the comment owner or Admin.

Main files:

```text
controllers/comment.js
validations/comment.js
middlewares/loadResources.js
```

---

### 9. Reactions

Implemented reaction features:

- Create or update a reaction on a post.
- Retrieve a reaction.
- Update a reaction.
- Delete a reaction.
- Validate reaction as an integer from `0` to `100`.
- Use Prisma `upsert` to avoid duplicate reactions by the same user on the same post.
- Enforce a compound unique key on `userId` and `postId`.

Main files:

```text
controllers/reaction.js
validations/reaction.js
prisma/schema.prisma
```

---

### 10. Reports

Implemented report features:

- Create or update a report on a post.
- Retrieve a report.
- Update a report.
- Delete a report.
- Validate report reason.
- Use Prisma `upsert` to avoid duplicate reports by the same user on the same post.
- Enforce a compound unique key on `userId` and `postId`.
- Restrict report visibility to the owner or Admin.

Main files:

```text
controllers/report.js
validations/report.js
prisma/schema.prisma
```

---

### 11. Swagger API Documentation

Swagger is integrated using:

```text
swagger-jsdoc
swagger-ui-express
```

The project extracts OpenAPI comments from controller files:

```js
apis: [
  path.join(__dirname, "../controllers/*.js"),
]
```

Swagger UI is served from:

```text
/api-docs
```

Access to Swagger is protected:

```text
authenticate → authorize("api", "view")
```

Only users with permission to view the API documentation can access it. In the current permission model, this means Admin users only.

Swagger is also configured to work with credentials and CSRF tokens.

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
│   ├── authorize.js         # Permission checking
│   ├── csrf.js              # CSRF configuration
│   ├── loadResources.js     # DB resource loading before authorization
│   └── validate.js          # Zod and route parameter validation
│
├── permissions
│   ├── engine.js            # Permission evaluation engine
│   └── roles.js             # Role definitions and ownership rules
│
├── prisma
│   └── schema.prisma        # Prisma schema and DB models
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

### Variable Explanation

| Variable | Required | Description |
|---|---:|---|
| `NODE_ENV` | Yes | Use `development` locally and `production` on Render. |
| `PORT` | No | Local server port. Render provides this automatically in production. |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma and the session store. |
| `SESSION_SECRET` | Yes | Secret used to sign the session ID cookie. |
| `CSRF_SECRET` | Yes | Secret used by the CSRF token generator. |
| `FRONTEND_URL` | Yes | Allowed frontend origin for CORS. |

> Important: never commit `.env` files to GitHub.

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <project-folder>
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

This is also handled automatically by:

```bash
npm run build
```

and by the `postinstall` script.

### 5. Sync the database schema

For development, you can use:

```bash
npm run db:push
```

or directly:

```bash
npx prisma db push
```

For a migration-based workflow, create a migration locally:

```bash
npx prisma migrate dev --name init
```

Then commit the generated `prisma/migrations` folder.

---

## Database Setup

The project uses PostgreSQL.

You can use any PostgreSQL provider, for example:

- Local PostgreSQL.
- Neon.
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

This project is ready to be deployed as a Render Web Service.

### 1. Push the project to GitHub

Make sure your project is pushed to a GitHub repository.

```bash
git add .
git commit -m "Prepare backend for deployment"
git push
```

---

### 2. Create or connect a PostgreSQL database

You can use:

- Render PostgreSQL.
- Neon PostgreSQL.
- Any external PostgreSQL database.

Copy the database connection string and use it as `DATABASE_URL`.

---

### 3. Create a new Render Web Service

In Render:

1. Go to **New**.
2. Choose **Web Service**.
3. Connect your GitHub repository.
4. Select the backend repository.
5. Use Node.js as the runtime.

Recommended settings:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install --production=false && npm run build` |
| Start Command | `npm start` |
| Pre-Deploy Command | `npm run db:deploy` |
| Node Version | `>=18` |

The build command installs dependencies and generates Prisma Client.

The start command runs:

```bash
node server.js
```

because `package.json` contains:

```json
"start": "node server.js"
```

---

### 4. Add environment variables on Render

Add these variables in the Render dashboard:

```env
NODE_ENV=production
DATABASE_URL="your-production-postgresql-url"
SESSION_SECRET="your-production-session-secret"
CSRF_SECRET="your-production-csrf-secret"
FRONTEND_URL="https://your-frontend-domain.com"
```

Do not add quotes in the Render dashboard unless Render explicitly expects them.

---

### 5. Prisma migration note for production

For production, the safest workflow is:

1. Create migrations locally:

```bash
npx prisma migrate dev --name migration-name
```

2. Commit the generated migration folder:

```bash
git add prisma/migrations
git commit -m "Add database migration"
git push
```

3. On Render, use:

```bash
npm run db:deploy
```

as the Pre-Deploy Command.

That runs:

```bash
prisma migrate deploy
```

before the server starts.

> If this project does not yet include a `prisma/migrations` folder, use `npm run db:push` only for early development or first-time prototype syncing. For real production deployments, prefer migrations.

---

### 6. Production cookies and HTTPS

The project uses secure cookies. That is correct for Render because Render provides HTTPS.

Current cookie behavior:

- Session cookie is secure.
- CSRF cookie is secure.
- Cookies are HTTP-only.
- Session max age is 7 days.
- CSRF max age is 7 days.

If testing locally over plain HTTP, browsers may refuse to store secure cookies. Use HTTPS locally or temporarily adjust cookie `secure` settings during development only.

---

## How the Backend Is Connected Together

The backend request lifecycle looks like this:

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
Route-level middlewares
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
Session cookie is sent by browser
    ↓
x-csrf-token header is sent by frontend
    ↓
CSRF middleware validates token against session
    ↓
authenticate middleware loads current user from DB
    ↓
validate middleware validates params and body
    ↓
loadPost middleware loads post 5 from DB
    ↓
authorize middleware checks if user can update this post
    ↓
controller updates the post using Prisma
    ↓
response is returned
```

This is the heart of the backend design. Each layer has one job. That makes the code easier to debug, extend, and secure.

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

Required body:

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
3. If yes, attach the user to `req.user`.

This means if a user is deleted from the database after logging in, their old session no longer grants valid access.

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
5. Stores the signed CSRF token in a cookie.

Response:

```json
{
  "csrfToken": "generated-token"
}
```

### How clients should send unsafe requests

For unsafe requests, the frontend must send:

1. The session cookie automatically through browser credentials.
2. The CSRF token in the request header:

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

## Authorization Model

The project has a centralized permission system.

### Permission Engine

File:

```text
permissions/engine.js
```

The engine receives:

```js
hasPermission(subject, resource, action, data)
```

Where:

| Parameter | Meaning |
|---|---|
| `subject` | The current authenticated user. |
| `resource` | The resource being accessed, such as `posts` or `comments`. |
| `action` | The action, such as `view`, `create`, `update`, or `remove`. |
| `data` | The loaded database resource, used for ownership checks. |

---

### Roles

File:

```text
permissions/roles.js
```

Current roles:

```text
Admin
User
```

### Admin Permissions

Admin can:

- View, create, update, and remove posts.
- View, create, update, and remove comments.
- View, create, update, and remove reactions.
- View, create, update, and remove reports.
- View, create, update, and remove users.
- View Swagger API documentation.

### User Permissions

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

Example ownership rule:

```js
update: (user, post) => user.id == post.userId
```

That means a regular user can update a post only if the post belongs to them.

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

---

### Route-Level Middlewares

Defined in `router.js`.

| Middleware | Purpose |
|---|---|
| `authenticate` | Ensures the user is logged in. |
| `validate` | Validates route params and request body. |
| `loadPost` | Loads a post from DB and attaches it to `req.data`. |
| `loadComment` | Loads a comment from DB and attaches it to `req.data`. |
| `loadReport` | Loads a report from DB and attaches it to `req.data`. |
| `loadReaction` | Loads a reaction from DB and attaches it to `req.data`. |
| `authorize` | Checks whether the user has permission to perform the action. |

---

## Database Schema

The database schema is defined in:

```text
prisma/schema.prisma
```

### User

Represents application users.

Important fields:

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key |
| `email` | String | Unique |
| `phone` | String? | Optional, unique |
| `password` | String | Hashed password |
| `role` | UserRole | Defaults to `User` |
| `full_name` | String | User full name |
| `bio` | String? | Optional |
| `birthdate` | DateTime? | Optional |
| `city` | String? | Optional |
| `createdAt` | DateTime? | Default current timestamp |

Relations:

- One user has many posts.
- One user has many comments.
- One user has many reports.
- One user has many reactions.

---

### Post

Represents user-created posts.

Important fields:

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key |
| `userId` | Int | Owner user ID |
| `category` | String | Max 20 characters |
| `title` | String | Max 100 characters |
| `description` | String? | Optional |
| `createdAt` | DateTime? | Default current timestamp |

Relations:

- Post belongs to a user.
- Post has many comments.
- Post has many reports.
- Post has many reactions.

---

### Comment

Represents comments on posts.

Important fields:

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key |
| `postId` | Int | Related post |
| `userId` | Int | Comment owner |
| `content` | String | Comment content |
| `rating` | Float? | Optional rating |
| `createdAt` | DateTime? | Default current timestamp |

Delete behavior:

- If the related post is deleted, comments are deleted.
- If the related user is deleted, comments are deleted.

---

### Report

Represents reports submitted by users against posts.

Important fields:

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key |
| `userId` | Int | Report owner |
| `postId` | Int | Reported post |
| `reason` | String | Report reason |
| `createdAt` | DateTime? | Default current timestamp |

Constraints:

```prisma
@@unique([userId, postId])
```

This prevents the same user from creating duplicate reports for the same post.

---

### Reaction

Represents user reactions on posts.

Important fields:

| Field | Type | Notes |
|---|---|---|
| `id` | Int | Primary key |
| `userId` | Int | Reaction owner |
| `postId` | Int | Related post |
| `reaction` | Int | Reaction value |
| `createdAt` | DateTime? | Default current timestamp |

Constraints:

```prisma
@@unique([userId, postId])
```

This prevents the same user from creating duplicate reactions for the same post.

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

## Swagger Documentation

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

This makes Swagger usable even with session authentication and CSRF protection.

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

Implemented response helpers:

| Helper | Status Code | Meaning |
|---|---:|---|
| `success` | `200` | General successful operation |
| `createdSuccessfully` | `201` | Resource created successfully |
| `deletedSuccessfully` | `204` | Resource deleted successfully |
| `badRequest` | `400` | Validation or bad request error |
| `Unauthenticated` | `401` | User is not logged in |
| `Unauthorized` | `403` | User does not have permission |
| `notFound` | `404` | Resource not found |
| `alreadyExists` | `409` | Duplicate resource |
| `serverError` | `500` | Server error |
| `notImplemented` | `501` | Feature not implemented |

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

## Security Notes

### Password Security

Passwords are hashed using `bcryptjs` before storage.

Current hash cost:

```js
const HASH_COST_FACTOR = 12;
```

---

### Session Security

The project uses server-side sessions instead of storing authentication data in the browser.

The browser only stores the session ID cookie. The actual session data is stored in PostgreSQL.

---

### CSRF Security

The CSRF token is bound to the current session ID using:

```js
getSessionIdentifier: (req) => req.sessionID
```

This prevents a token from being reused across different sessions.

---

### CORS Security

CORS is configured with a single frontend origin:

```js
origin: process.env.FRONTEND_URL
```

Credentials are enabled:

```js
credentials: true
```

This is required because the frontend sends cookies with API requests.

---

### HTTPS Requirement

The project uses secure cookies. In production, this is correct.

For local HTTP development, secure cookies may not be stored by the browser. Use local HTTPS or temporarily disable secure cookies in development.

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
13. Add API response schemas to Swagger components for reuse.
14. Add a health check endpoint for deployment monitoring.

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
- RBAC authorization with ownership checks.
- Zod request validation.
- Resource loading middleware.
- Swagger API documentation.
- Render-ready deployment configuration.

The architecture is clean, layered, and practical: each middleware does one job, controllers stay focused on business logic, and Prisma handles database access through a typed schema.
