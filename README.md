# Contact Management API

Backend implementation for extending the Monica CRM contact module.

## Tech Stack

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Prisma ORM
* JWT Authentication
* HTTP-only Cookies
* CORS

# Features Implemented

## Contact Management

* Create contacts
* Retrieve contacts
* Search contacts
* Filter favorite contacts
* Mark/unmark contacts as favorite
* Add and update personal notes
* Contact statistics
* Pagination support
* Sorting support

## Authentication & User Management

* User registration
* User login
* JWT-based authentication
* Refresh token support
* Cookie-based authentication
* User profile management
* Role-based authorization

# Setup Instructions

## Prerequisites

Make sure the following are installed:

* Node.js (v18+)
* PostgreSQL
* npm

## Clone Repository

```bash
git clone https://github.com/Yusuf-al/backend-project-assignment

cd project-name
```

## Install Dependencies

```bash
npm install
```

## Environment Configuration

Create a `.env` file in the project root:

```env
PORT=[PORT]

DATABASE_URL=[DATABASE_URL]

JWT_ACCESS_SECRET=[ACCESS_TOKEN_SECRET]
JWT_REFRESH_SECRET=[REFRESH_TOKEN_SECRET]

JWT_ACCESS_EXPIRES_IN=[ACCESS_TOKEN_EXPIRE_TIME]
JWT_REFRESH_EXPIRES_IN=[REFRESH_TOKEN_EXPIRE_TIME]

BCRYPT_SALT_ROUNDS=[SALT_ROUNDS]
```

## Database Setup

Run Prisma migration:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

(Optional) Open Prisma Studio:

```bash
npx prisma studio
```

## Run Application

### Development

```bash
npm run dev
```

### Production

```bash
npm run build

npm start
```

Application will run on:

```http
http://localhost:[PORT]
```

# Project Structure

The project follows a modular Express architecture:

```text
src
│
├── modules
│   ├── contacts
│   │   ├── contacts.controller.ts
│   │   ├── contacts.service.ts
│   │   ├── contacts.route.ts
│   │   └── contacts.interface.ts
│   │
│   ├── users
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.route.ts
│   │   └── users.interface.ts
│   │
│   └── auth
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── auth.route.ts
│
├── middleware
│   ├── auth.ts
│   └── index.d.ts
│
├── utils
│   ├── catchAsync.ts
│   ├── checkContact.ts
│   ├── jwt.ts
│   └── sendResponse.ts
│
├── lib
│   └── prisma.ts
│
├── app.ts
└── server.ts
```

# Authentication

Authentication is implemented using:

* JWT Access Token
* JWT Refresh Token
* HTTP-only Cookies
* Role-based authorization

## Authentication Flow

1. User logs in with email and password.
2. Server validates credentials.
3. Server generates access and refresh tokens.
4. Tokens are stored in HTTP-only cookies.
5. Protected routes validate the token using authentication middleware.

## Protected Contact Routes

The following routes require authentication:

### Create Contact

```http
POST /api/contacts/new
```

Roles:

```
ADMIN
USER
```

### Get User Contacts

```http
GET /api/contacts/all
```

Roles:

```
ADMIN
USER
```

### Contact Statistics

```http
GET /api/contacts/stats
```

Roles:

```
ADMIN
USER
```

Example authenticated request:

```http
GET /api/contacts/all

Cookie:
accessToken=<your_jwt_token>
```

# User & Authentication API

## Register User

Creates a new user account.

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

## Login User

Authenticates a user and generates JWT tokens.

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Refresh Token

Generate a new access token using refresh token.

```http
POST /api/auth/refresh-token
```

## Get My Profile

Returns authenticated user's profile.

```http
GET /api/users/me
```

## Update Profile

Updates authenticated user's information.

```http
PUT /api/users/my-profile
```

# Contact API

## Create Contact

```http
POST /api/contacts/new
```

## Get Contacts

```http
GET /api/contacts
```

## Search Contacts

```http
GET /api/contacts?search=john
```

## Favorite Contacts

```http
GET /api/contacts/favorites
```

## Contact Statistics

```http
GET /api/contacts/stats
```

Example response:

```json
{
  "total_contacts": 125,
  "favorite_contacts": 18,
  "contacts_with_notes": 42
}
```

## Mark Contact as Favorite

```http
POST /api/contacts/:id/favorite
```

## Toggle Favorite Status

```http
PATCH /api/contacts/:id/favorite
```

## Update Contact Note

```http
PUT /api/contacts/:id/note
```

# Search, Filtering, Pagination & Sorting

The contact listing endpoint supports dynamic filtering.

## Search

```http
GET /api/contacts?search=john
```

Search is performed on:

* First name
* Last name
* Email
* Phone

## Favorite Filter

```http
GET /api/contacts?favorite=1
```

## Combined Filtering

```http
GET /api/contacts?favorite=1&search=john
```

## Pagination

Pagination is implemented using:

* `skip`
* `take`

Example:

```http
GET /api/contacts?page=1&limit=10
```

## Sorting

Sorting is handled using Prisma `orderBy`.

Example:

```http
GET /api/contacts?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

The same Prisma filtering logic is reused for:

* Fetching contacts
* Counting total records


