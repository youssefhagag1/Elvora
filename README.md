# Elvora Backend API

Elvora is an Express.js and MongoDB backend for an e-commerce platform. It provides authentication, profile management, catalog management, carts, wishlists, favorites, reviews, checkout, order handling, and Stripe-based payment flows.

## Overview

- Runtime: Node.js + Express
- Database: MongoDB with Mongoose
- Authentication: JWT Bearer tokens
- File uploads: Multer
- Email: Nodemailer
- Payments: Stripe Checkout

The API is mounted under `/api`, and uploaded files are served from `/uploads`.

## Features

- User registration and login
- Role-based access control for `user`, `seller`, and `admin`
- Product and category management
- Cart, wishlist, and favorites management
- Product reviews
- Checkout and order creation
- Stripe payment session creation and confirmation
- Profile update with avatar upload

## Project Structure

```text
.
|-- controllers/
|-- middlewares/
|-- models/
|-- routes/
|-- uploads/
|-- utils/
|-- package.json
`-- server.js
```

### Key folders

- `controllers/`: Request handlers for each domain module
- `middlewares/`: JWT verification, role checks, and async error wrapping
- `models/`: Mongoose schemas for application entities
- `routes/`: Express route definitions
- `uploads/`: Stored image uploads
- `utils/`: Shared helpers such as token generation, file upload config, email sending, and error helpers

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- Stripe account for payment endpoints
- SMTP credentials for email features

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root and define the following variables:

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `PORT` | No | Server port, defaults to `3000` |
| `BASE_URL` | No | Base URL used to build uploaded file URLs |
| `STRIPE_SECRET_KEY` | Yes for payment routes | Stripe secret key |
| `EMAIL_HOST` | Yes for email features | SMTP host |
| `EMAIL_PORT` | Yes for email features | SMTP port |
| `EMAIL_USER` | Yes for email features | SMTP username |
| `EMAIL_PASS` | Yes for email features | SMTP password |
| `EMAIL_FROM` | Yes for email features | Sender email address |
| `EMAIL_FROM_NAME` | Yes for email features | Sender display name |

Example:

```env
MONGO_URL=mongodb://127.0.0.1:27017/elvora
JWT_SECRET=replace_this_with_a_strong_secret
PORT=3000
BASE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-password
EMAIL_FROM=no-reply@elvora.com
EMAIL_FROM_NAME=Elvora
```

### Run the server

```bash
npm start
```

The application starts `server.js` with `nodemon` and connects to MongoDB using `MONGO_URL`.

## Server Behavior

- API base path: `/api`
- Static files: `/uploads`
- Configured CORS origin: `http://localhost:4200`
- Default port: `3000`

## Authentication

Protected routes require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <JWT_TOKEN>
```

JWT payload includes:

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "user"
}
```

### Roles

- `user`: customer-facing actions such as reviews, cart, wishlist, favorites, checkout, and order access
- `seller`: product management for the authenticated seller
- `admin`: user management, category management, and order administration

## API Modules

### Auth

Base path: `/api/auth`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/register` | Register a new user and return a JWT | Public |
| `POST` | `/login` | Authenticate and return a JWT | Public |

Expected auth payloads:

```json
{
  "name": "Youssef",
  "email": "user@example.com",
  "password": "secret123"
}
```

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

### Users

Base path: `/api/users`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | List all users | Admin |
| `GET` | `/:id` | Get one user by id | Admin |
| `DELETE` | `/:id` | Delete user by id | Admin |
| `PATCH` | `/:id` | Approve or activate a user | Admin |
| `PATCH` | `/:id/restrict` | Restrict or deactivate a user | Admin |

### Profile

Base path: `/api/profile`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/me` | Get authenticated user profile | Authenticated |
| `PUT` | `/update` | Update profile and avatar | Authenticated |

For avatar uploads, send `multipart/form-data` with the file field named `avatar`.

### Products

Base path: `/api/products`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | List active products with pagination and filtering | Public |
| `GET` | `/seller` | List products for the authenticated seller | Seller |
| `POST` | `/` | Create a product with images | Seller |
| `GET` | `/:id` | Get product details by id | Public |
| `PATCH` | `/:id` | Update a product owned by the authenticated seller | Authenticated, seller ownership enforced in controller |
| `DELETE` | `/:id` | Delete a product owned by the seller or by admin | Authenticated, ownership/role enforced in controller |

Supported query parameters on `GET /api/products`:

- `page`
- `limit`
- `category`
- `search`
- `minPrice`
- `maxPrice`

For product images, send `multipart/form-data` with up to 5 files in the `images` field.

### Categories

Base path: `/api/categories`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | List categories | Public |
| `POST` | `/` | Create category | Admin |
| `GET` | `/:id` | Get category by id | Public |
| `PATCH` | `/:id` | Update category | Admin |
| `DELETE` | `/:id` | Delete category | Admin |

For category image uploads, send `multipart/form-data` with the file field named `image`.

### Reviews

Base path: `/api/reviews`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/product/:productId` | List reviews for a product | Public |
| `POST` | `/product/:productId` | Add a review for a product | Authenticated |
| `GET` | `/me` | List reviews created by the authenticated user | Authenticated |
| `GET` | `/:reviewId` | Get one review | Public |
| `PATCH` | `/:reviewId` | Update own review | Authenticated |
| `DELETE` | `/:reviewId` | Delete own review | Authenticated |

### Cart

Base path: `/api/carts`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | Get current user's cart | Authenticated |
| `POST` | `/` | Add item to cart | Authenticated |
| `DELETE` | `/` | Clear the cart | Authenticated |
| `PATCH` | `/:productId` | Update quantity for a cart item | Authenticated |
| `DELETE` | `/:productId` | Remove item from cart | Authenticated |

### Wishlist

Base path: `/api/wishlists`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | Get current user's wishlist | Authenticated |
| `POST` | `/` | Add item to wishlist | Authenticated |
| `DELETE` | `/` | Clear wishlist | Authenticated |
| `POST` | `/:productId/transfer` | Move a wishlist item into cart | Authenticated |
| `DELETE` | `/:productId` | Remove item from wishlist | Authenticated |

### Favorites

Base path: `/api/favorites`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | Get current user's favorites | Authenticated |
| `POST` | `/` | Add item to favorites | Authenticated |
| `DELETE` | `/` | Clear favorites | Authenticated |
| `DELETE` | `/:productId` | Remove item from favorites | Authenticated |

### Checkout

Base path: `/api/checkout`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/single` | Checkout a single product | Authenticated |
| `POST` | `/multiple` | Checkout multiple products | Authenticated |

### Orders

Base path: `/api/orders`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/my-orders` | Get authenticated user's orders | Authenticated |
| `GET` | `/:orderId` | Get one order by id | Authenticated |
| `PATCH` | `/:orderId/cancel` | Cancel a pending order | User |
| `PATCH` | `/:orderId/status` | Update order status | Admin |
| `GET` | `/` | List all orders | Admin |

### Payment

Base path: `/api/payment`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/create-checkout-session` | Create a Stripe Checkout session | Authenticated |
| `POST` | `/confirm` | Confirm a paid Stripe session and create an order | Authenticated |

Example payment payload:

```json
{
  "products": [
    {
      "productId": "65f000000000000000000000",
      "quantity": 2
    }
  ],
  "shippingAddress": "Cairo, Egypt"
}
```

## Main Data Models

### User

- `name`, `email`, `password`
- `role`: `user`, `seller`, `admin`
- `photo`, `phone`
- `address`
- `socialMediaLinks`
- `orderHistory`
- `isActive`

### Product

- `title`, `description`
- `price`, `discountPrice`
- `category`
- `images`
- `stock`
- `seller`
- `rating`
- `tags`
- `isActive`

### Category

- `name`, `description`
- `image`, `slug`
- `isActive`

### Order

- `user`
- `products[]`
- `totalAmount`
- `shippingAddress`
- `paymentMethod`
- `status`

### Review

- `rating`
- `title`
- `comment`
- `user`
- `product`

### Cart, Wishlist, Favorites

Each of these collections is tied to a single user and stores product references for that user.

## Upload Rules

- Supported uploads are image files only
- Max file size: 5 MB
- Product image field: `images` with a maximum of 5 files
- Profile avatar field: `avatar`
- Category image field: `image`

## Notes And Known Issues

- Registration assigns roles based on whether the email contains `admin` or `seller`. This is not safe for production.
- CORS is hardcoded to `http://localhost:4200` in the server configuration.
- Product search currently filters on `name`, while the product schema uses `title`, so search results may be incomplete.
- Payment controller uses `product.name` when creating Stripe line items, while the product schema stores `title`.
- There is no refresh token or logout invalidation flow.
- Order status values exist, but status transition rules are not enforced.
- The wishlist model file is named `whislist.js`, which is a spelling inconsistency in the codebase.

## Development Notes

- The server starts only after a successful MongoDB connection.
- Uploaded files are stored on disk in the `uploads` folder.
- Error responses are handled through a centralized Express error middleware.

## Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `nodemon server.js` | Run the API in development mode |
