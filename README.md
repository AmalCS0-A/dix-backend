# DIX Maillots API

**Student:** Amel Bouterbag
**Module:** WAMD, TD-TP 3, ENSTA SS/IA 2026

## Application description

REST API for the DIX Maillots football-shirt store built in TD-TP 2 (React + Redux).
It replaces the products array of the React app with a MongoDB database and adds
user registration, login, JWT authentication, OAuth2 testing and rate limiting.

```
React (TP2)  --HTTP/JSON-->  Express API (Node.js)  --Mongoose-->  MongoDB
```

React never talks to MongoDB directly. The 52 shirts of TP2 are loaded into the
database with a seed script. The cart stays managed by Redux (out of scope for TP3).

## Technologies used

| Tool | Purpose |
| --- | --- |
| Node.js | Backend runtime |
| Express 5 | Web framework, routes, middleware |
| MongoDB Atlas | NoSQL database |
| Mongoose | Models, validation, database queries |
| bcryptjs | Password hashing |
| jsonwebtoken | Creating and verifying JWTs |
| express-rate-limit | Rate limiting |
| cors | Allows the React dev server to call the API |
| dotenv | Reads secrets from `.env` |
| Postman / Thunder Client | API testing |

## Project structure

```
server.js              starts the server (checks .env, connects to MongoDB)
app.js                 builds the Express app: middleware + routes
config/db.js           MongoDB connection
models/                Product.js, User.js
routes/                authRoutes.js, productRoutes.js
controllers/           authController.js, productController.js
middleware/            auth.js (JWT / OAuth2), rateLimiter.js, errorHandler.js
seed/                  products.json (52 TP2 shirts) + seed.js
docs/OAUTH2_POSTMAN.md how to test OAuth2 with Google
docs/DIX-TP3.postman_collection.json  Postman collection with all the test requests
screenshots/           Postman screenshots of every test (see "API testing")
```

## Database models

**Product**

| Field | Type | Rules |
| --- | --- | --- |
| name | String | required |
| description | String | required |
| price | Number | required, >= 0 (in DA) |
| category | String | required: `Clubs`, `National teams` or `Retro` |
| imageUrl | String | required (path of the kit image, e.g. `/kits/algeria-home.png`) |
| stock | Number | required, whole number >= 0 |
| kit, season, league, country, oldPrice | optional | kept from the TP2 shirts, used by the React UI |

The API returns `id` (not `_id`) so the React app can keep using `product.id`.

**User**

| Field | Type | Rules |
| --- | --- | --- |
| name | String | required |
| email | String | required, unique, stored in lowercase |
| passwordHash | String | bcrypt hash, never returned by the API |

## API endpoints

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| POST | /api/auth/register | Create an account | Public |
| POST | /api/auth/login | Log in, returns a JWT | Public (5 requests / 15 min) |
| GET | /api/products | List all products | Public |
| GET | /api/products/:id | Get one product | Public |
| POST | /api/products | Create a product | JWT required |
| PUT | /api/products/:id | Update a product | JWT required |
| DELETE | /api/products/:id | Delete a product | JWT required |

Every `/api` route is also limited to 100 requests / 15 minutes per IP.

**Status codes:** 200 OK, 201 Created, 400 invalid input or invalid ID,
401 missing/invalid token or wrong credentials, 404 not found, 409 duplicate email,
429 too many requests, 500 server error.

**Error format (always the same):**

```json
{ "status": 400, "message": "Validation failed", "errors": ["price cannot be negative"] }
```

### Example bodies

Register: `{ "name": "Amel", "email": "amel@test.com", "password": "secret123" }`
Login: `{ "email": "amel@test.com", "password": "secret123" }` returns `{ "message", "token", "user" }`
Create product:
```json
{
  "name": "Test FC Home 26/27",
  "description": "A test shirt",
  "price": 9900,
  "category": "Clubs",
  "imageUrl": "/kits/test.png",
  "stock": 10
}
```

## API testing (Postman)

The tests are in `docs/DIX-TP3.postman_collection.json` (Postman: Import, then choose the file).
The screenshots are in the `screenshots/` folder. Each one shows the request and the response status.

| # | Test | Expected |
| --- | --- | --- |
| 01 | Register a new user | 201 |
| 02 | Register with an existing email | 409 |
| 03 | Login with valid credentials, JWT received | 200 |
| 04 | Login with invalid credentials | 401 |
| 05 | Retrieve the product list | 200 |
| 06 | Retrieve a single product | 200 |
| 07 | Create a product without a token | 401 |
| 08 | Create a product with a valid token | 201 |
| 09 | Create a product with an invalid token | 401 |
| 10 | Update a product with a valid token | 200 |
| 11 | Delete a product with a valid token | 200 |
| 12 | Invalid product ID | 400 |
| 13 | Product not found | 404 |
| 14 | Missing product information | 400 |
| 15 | Invalid product values | 400 |
| 16 | Login rate limit (5 / 15 min) | 429 |
| 17 | General rate limit (100 / 15 min) | 429 |
| 18 | OAuth2 (Google) access token on a protected route | 201 |
| 19 | Protected route without a token | 401 |

## JWT authentication mechanism

1. The user sends email and password to `POST /api/auth/login`.
2. The server finds the user and compares the password with the stored bcrypt hash.
3. If correct, the server creates a JWT containing the user id and email, signed with
   `JWT_SECRET` and valid for `JWT_EXPIRES_IN` (default 1 hour), and returns it.
4. For protected routes the client sends `Authorization: Bearer <token>`.
5. The `protect` middleware (`middleware/auth.js`) extracts the token and verifies the
   signature and expiry. Valid: the request continues. Missing, invalid or expired: **401**.

The same middleware also accepts an **OAuth2 access token issued by Google** (checked with
Google's `tokeninfo` endpoint, and only if it was issued for our `GOOGLE_CLIENT_ID`).
See `docs/OAUTH2_POSTMAN.md`.

Passwords are hashed with bcrypt (cost 10) before storage. The JWT secret is read from an
environment variable and is never in the code.

## Installation and running

Requirements: Node.js 20 or newer and a MongoDB Atlas account.

```bash
npm install
cp .env.example .env      # then edit .env (see below)
npm run seed              # loads the 52 shirts into MongoDB
npm run dev               # development, restarts on file changes
# or: npm start
```

The API runs on `http://localhost:3000`. Quick check: open it in a browser, it answers
`{"name":"DIX Maillots API","status":"running"}`.

## MongoDB and environment variables

1. Create a free cluster (M0) on MongoDB Atlas.
2. Database Access: create a database user (username + password).
3. Network Access: allow your IP address (or 0.0.0.0/0 for a school lab).
4. Connect > Drivers: copy the connection string and add the database name
   (for example `.../dix-maillots?retryWrites=true&w=majority`).
5. Fill `.env`:

| Variable | Meaning |
| --- | --- |
| PORT | Port of the API (3000) |
| MONGODB_URI | Atlas connection string |
| JWT_SECRET | Long random text used to sign tokens |
| JWT_EXPIRES_IN | Token lifetime (1h) |
| CLIENT_ORIGIN | React dev origin allowed by CORS (http://localhost:5173) |
| GOOGLE_CLIENT_ID | Only for the OAuth2 test |

Generate a good secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

`.env` is in `.gitignore` and must never be committed. Only `.env.example` (placeholders) is.
