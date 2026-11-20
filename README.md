# Shopshere

Shopshere is a full-stack MERN e-commerce portfolio project. It includes a customer storefront, account and order flows, an admin dashboard, Razorpay test checkout, and Cloudinary product image uploads. It is a demonstration project and is not configured for live payments or real customer transactions.

Maintained by [Aditya Jain](https://github.com/Aditya01017) · [GitHub repository](https://github.com/Aditya01017/shopshere)

## Stack

- **Frontend:** React, Redux Toolkit, React Router
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Integrations:** Razorpay, Cloudinary, Nodemailer

## Run locally

Use Node.js 20.19 or newer and a MongoDB database. Copy `backend/.env.example` to `backend/.env`, then set the database URL, a strong JWT secret, and any provider credentials you plan to use. Keep real credentials in local environment files and out of Git.

From the project root:

```bash
npm run install-all
npm run dev
```

The frontend runs on port `3000` and the API on port `5000` by default. The sample `FRONTEND_URL` allows both `localhost` and `127.0.0.1` for local development.

## Payment configuration

The checkout intentionally accepts only Razorpay test-mode keys (`rzp_test_...`). Use test dashboard credentials and test payment methods. Never use live keys or real card data in this portfolio project. The server calculates cart prices from MongoDB, verifies the provider order and captured payment, and creates orders from its saved payment snapshot. Refunds and production-grade inventory reservation are outside this demo's scope.

## Seed sample data

Set a unique `SEED_ADMIN_PASSWORD` in `backend/.env`, then run:

```bash
npm run seed
```

The seed command creates the sample admin account if it does not exist and adds sample products that are missing. It preserves existing users and products.

## Build

```bash
npm run build
```

This builds the frontend for production.
