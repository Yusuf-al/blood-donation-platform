# Blood Donation Management System — API

Backend REST API for a blood donation management platform supporting **Admins**, **Requesters**, and **Donors**.

The system provides APIs for user authentication, user management, donor applications, blood requests, donation assignments, donation records, and payment processing.

---

## Live URL

```text
https://fastbloodplatform.vercel.app/api/v1
```

## Doc URL

```text
https://docs.google.com/document/d/1L7aTgUzDzTqeHwLZ-UUA2p9Eif113xpgT_xSRZiA8jg/edit?usp=sharing
```

All API endpoints described below are relative to this base URL.

---

## Roles

The system supports the following user roles:

- `ADMIN`
- `REQUESTER`
- `DONOR`

## Credentials
ADMIN - abc3@example.com

PASSWORD - "Abc@123"

# Authentication

Protected endpoints require authentication through the application's authentication middleware.

Authentication and authorization are handled using the application's `auth()` middleware and the user's assigned role.

---

# API Reference

## 1. Authentication — `/api/v1/auth`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Authenticate/login a user | Public |
| POST | `/api/v1/auth/google` | Authenticate/login using Google | Public |
| POST | `/api/v1/auth/forget-password` | Start the forgot-password process | Public |
| POST | `/api/v1/auth/reset-password` | Reset a user's password | Public |
| POST | `/api/v1/auth/refresh-token` | Refresh an authentication token | Public |

### Login

```http
POST /api/v1/auth/login
```

Authenticates an existing user.

**Access:** Public

---

### Google Login

```http
POST /api/v1/auth/google
```

Authenticates a user through Google authentication.

**Access:** Public

---

### Forgot Password

```http
POST /api/v1/auth/forget-password
```

Starts the forgot-password process.

**Access:** Public

---

### Reset Password

```http
POST /api/v1/auth/reset-password
```

Resets the user's password.

**Access:** Public

---

### Refresh Token

```http
POST /api/v1/auth/refresh-token
```

Generates a refreshed authentication token.

**Access:** Public

---

# 2. User — `/api/v1/user`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/user/register` | Register a new user | Public |
| POST | `/api/v1/user/verify-email` | Verify user email using OTP | Public |
| GET | `/api/v1/user/me` | Get current authenticated user's profile | Admin, Requester, Donor |
| PUT | `/api/v1/user/update-profile` | Update current user's profile | Admin, Requester, Donor |

## User Registration

```http
POST /api/v1/user/register
```

Creates a new user account.

**Access:** Public

The endpoint supports profile image upload through:

```text
profileImage
```

The route uses:

```ts
upload.single("profileImage")
```

---

## Verify Email

```http
POST /api/v1/user/verify-email
```

Verifies a user's email address using OTP.

**Access:** Public

---

## Get My Profile

```http
GET /api/v1/user/me
```

Returns the currently authenticated user's profile.

**Access:**

- Admin
- Requester
- Donor

---

## Update Profile

```http
PUT /api/v1/user/update-profile
```

Updates the authenticated user's profile.

The route supports:

- Profile information validation
- Profile image upload

**Access:**

- Admin
- Requester
- Donor

---

# 3. Admin — `/api/v1/admin`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/v1/admin/users` | Get all registered users | Admin |
| GET | `/api/v1/admin/donors` | Get donor profiles | Admin |
| PATCH | `/api/v1/admin/update/status/:id` | Update a user's status | Admin |
| PATCH | `/api/v1/admin/update/role/:id` | Update a user's role | Admin |
| PATCH | `/api/v1/admin/delete/user/:id` | Delete/deactivate a user | Admin |
| PUT | `/api/v1/admin/profile-approve/:id` | Approve/process donor profile application | Admin |

### Get All Users

```http
GET /api/v1/admin/users
```

Returns all registered users.

**Access:** Admin

---

### Get Donor Profiles

```http
GET /api/v1/admin/donors
```

Returns donor profiles.

**Access:** Admin

---

### Update User Status

```http
PATCH /api/v1/admin/update/status/:id
```

Updates a user's account status.

`id` represents the user ID.

**Access:** Admin

---

### Update User Role

```http
PATCH /api/v1/admin/update/role/:id
```

Updates a user's role.

`id` represents the user ID.

**Access:** Admin

---

### Delete User

```http
PATCH /api/v1/admin/delete/user/:id
```

Deletes/deactivates a user through the admin controller.

`id` represents the user ID.

**Access:** Admin

---

### Approve Donor Profile

```http
PUT /api/v1/admin/profile-approve/:id
```

Processes/approves a donor profile application.

`id` represents the donor/profile ID.

**Access:** Admin

---

# 4. Donor — `/api/v1/donor`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/donor/become-donor` | Submit a donor application | Requester |
| GET | `/api/v1/donor/profile/:id` | Get donor profile | Requester, Admin, Donor |

## Become a Donor

```http
POST /api/v1/donor/become-donor
```

Allows a requester to submit a donor application.

**Access:** Requester

---

## Donor Profile

```http
GET /api/v1/donor/profile/:id
```

Returns donor profile information.

`id` represents the donor/profile ID.

**Access:**

- Requester
- Admin
- Donor

---

# 5. Blood Requests — `/api/v1/blood`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/blood/new-request` | Create a new blood request | Admin, Requester, Donor |
| PATCH | `/api/v1/blood/update-request/:id` | Update blood request status | Admin, Requester |
| GET | `/api/v1/blood/view-request/:id` | View blood request details | No auth middleware specified |

## Create Blood Request

```http
POST /api/v1/blood/new-request
```

Creates a new blood request.

**Access:**

- Admin
- Requester
- Donor

The supplied route uses:

```ts
validateRequest(bloodRequestSchema)
```

for request validation.

---

## Update Blood Request

```http
PATCH /api/v1/blood/update-request/:id
```

Updates the status of a blood request.

`id` represents the blood request ID.

**Access:**

- Admin
- Requester

---

## View Blood Request

```http
GET /api/v1/blood/view-request/:id
```

Returns details of a blood request.

`id` represents the blood request ID.

**Authentication:** No `auth()` middleware is specified in the supplied route definition.

---

# 6. Donation Assignment & Donation Records — `/api/v1/donation`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/donation/new-assignment` | Create a donor assignment | Admin, Donor |
| GET | `/api/v1/donation/view-assignment/:id` | View donation assignment | Admin, Donor, Requester |
| POST | `/api/v1/donation/new-record` | Create a donation record | No auth middleware specified |
| PATCH | `/api/v1/donation/update-assignment/:id` | Update donation assignment status | Admin, Donor |

## Create Donation Assignment

```http
POST /api/v1/donation/new-assignment
```

Assigns a donor to a donation/request.

**Access:**

- Admin
- Donor

The assignment validation middleware is currently commented out in the supplied route definition.

---

## View Donation Assignment

```http
GET /api/v1/donation/view-assignment/:id
```

Returns information about a donation assignment.

`id` represents the assignment ID.

**Access:**

- Admin
- Donor
- Requester

---

## Create Donation Record

```http
POST /api/v1/donation/new-record
```

Creates a new donation record.

**Authentication:** No active `auth()` middleware is specified in the supplied route definition.

The following authentication code is currently commented out:

```ts
// auth([UserRole.ADMIN, UserRole.DONOR])
```

---

## Update Donation Assignment

```http
PATCH /api/v1/donation/update-assignment/:id
```

Updates the status of a donation assignment.

`id` represents the assignment ID.

**Access:**

- Admin
- Donor

---

# 7. Payments / Subscription — `/api/v1/subscription`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/subscription/create-checkout-session` | Create a checkout/payment session | Donor, Requester |
| POST | `/api/v1/subscription/webhook` | Handle payment gateway webhook events | Public / Webhook |
| POST | `/api/v1/subscription/bkash-payment` | Initiate a bKash payment | Requester, Donor |
| GET | `/api/v1/subscription/bkash/callback` | Handle bKash callback | No auth middleware specified |

## Create Checkout Session

```http
POST /api/v1/subscription/create-checkout-session
```

Creates a checkout/payment session.

**Access:**

- Donor
- Requester

---

## Payment Webhook

```http
POST /api/v1/subscription/webhook
```

Handles incoming payment gateway webhook events.

**Access:** Public / Payment Gateway

This endpoint does not use normal user authentication middleware.

The webhook is intended to be called by the payment gateway rather than a client application.

---

## bKash Payment

```http
POST /api/v1/subscription/bkash-payment
```

Initiates a bKash payment.

**Access:**

- Requester
- Donor

---

## bKash Callback

```http
GET /api/v1/subscription/bkash/callback
```

Handles the bKash payment callback.

**Authentication:** No `auth()` middleware is specified in the supplied route definition.

---

# Route Modules

The Express application mounts the API modules as follows:

```ts
app.use("/api/v1/user", userRoutes);

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/admin", adminRoute);

app.use("/api/v1/donor", donorRoutes);

app.use("/api/v1/blood", bloodReqRoutes);

app.use("/api/v1/donation", donationAssingRoutes);

app.use("/api/v1/subscription", paymentRoute);
```

---

# API Mounting Summary

| Module | Mounted Prefix |
|---|---|
| User | `/api/v1/user` |
| Authentication | `/api/v1/auth` |
| Admin | `/api/v1/admin` |
| Donor | `/api/v1/donor` |
| Blood Request | `/api/v1/blood` |
| Donation | `/api/v1/donation` |
| Subscription / Payment | `/api/v1/subscription` |

---

# Roles & Access Summary

| Role | Main Capabilities |
|---|---|
| **Requester** | Register/login, manage own profile, create blood requests, apply to become a donor, view donor profiles, view donation assignments, make payments |
| **Donor** | Manage own profile, create blood requests, participate in donation assignments, update donation assignment status, view donor profiles, make payments |
| **Admin** | Manage users and donor profiles, approve donor applications, update user roles/status, manage blood requests, manage donation assignments, and access permitted payment operations |

---

# Access Control Overview

## Public

The following operations are publicly accessible:

- User login
- Google login
- Forgot password
- Reset password
- Refresh token
- User registration
- Email verification
- Payment webhook

Some additional endpoints have no active authentication middleware as noted in their respective sections.

## Admin

Admins can:

- View all users
- View donor profiles
- Update user status
- Update user roles
- Delete/deactivate users
- Approve donor applications
- Update blood request status
- Create donation assignments
- View donation assignments
- Update donation assignment status

## Requester

Requesters can:

- Create blood requests
- Update blood request status where permitted
- Apply to become a donor
- View donor profiles
- View donation assignments
- Create checkout sessions
- Make bKash payments
- Manage their own profile

## Donor

Donors can:

- Create blood requests
- Create donation assignments
- View donation assignments
- Update donation assignment status
- View donor profiles
- Create checkout sessions
- Make bKash payments
- Manage their own profile

---

# Route Security Notes

The following security details are based directly on the supplied route definitions:

1. `GET /api/v1/blood/view-request/:id` does not currently use `auth()` middleware.

2. `POST /api/v1/donation/new-record` does not currently use `auth()` middleware.

3. Authentication for `POST /api/v1/donation/new-record` is commented out.

4. Assignment validation is commented out in the supplied donation assignment routes.

5. `GET /api/v1/subscription/bkash/callback` does not use `auth()` middleware.

6. `POST /api/v1/subscription/webhook` does not use `auth()` middleware because it is intended for payment gateway webhook requests.

7. User registration and profile update support profile image uploads through the `profileImage` field.

---

# API Endpoint Overview

```text
http://localhost:4000/api/v1
│
├── /auth
│   ├── POST /login
│   ├── POST /google
│   ├── POST /forget-password
│   ├── POST /reset-password
│   └── POST /refresh-token
│
├── /user
│   ├── POST /register
│   ├── POST /verify-email
│   ├── GET  /me
│   └── PUT  /update-profile
│
├── /admin
│   ├── GET   /users
│   ├── GET   /donors
│   ├── PATCH /update/status/:id
│   ├── PATCH /update/role/:id
│   ├── PATCH /delete/user/:id
│   └── PUT   /profile-approve/:id
│
├── /donor
│   ├── POST /become-donor
│   └── GET  /profile/:id
│
├── /blood
│   ├── POST  /new-request
│   ├── PATCH /update-request/:id
│   └── GET   /view-request/:id
│
├── /donation
│   ├── POST  /new-assignment
│   ├── GET   /view-assignment/:id
│   ├── POST  /new-record
│   └── PATCH /update-assignment/:id
│
└── /subscription
    ├── POST /create-checkout-session
    ├── POST /webhook
    ├── POST /bkash-payment
    └── GET  /bkash/callback
```

---

# Notes

- The API base URL is:

```text
http://localhost:4000/api/v1
```

- API access is controlled using role-based authentication.
- The supported roles are `ADMIN`, `REQUESTER`, and `DONOR`.
- `bloodRequestSchema` is used to validate new blood requests.
- Profile image uploads use the multipart field `profileImage`.
- The exact request body and response body structures were not included in the supplied route definitions, so they are not specified in this README.
- Payment gateway configuration details were not included in the supplied route definitions.
- Environment variables should be used for sensitive values such as database credentials, JWT secrets, payment credentials, and OAuth credentials.
- Passwords, tokens, OTPs, and other sensitive authentication information should never be committed to source control.

---

# End of Documentation
