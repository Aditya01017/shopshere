# Shopshere

Shopshere is a full-stack MERN e-commerce portfolio project. It includes a customer storefront, account and order flows, an admin dashboard, Razorpay payment handling, and Cloudinary product image uploads.

Maintained by [Aditya Jain](https://github.com/Aditya01017) · [GitHub repository](https://github.com/Aditya01017/shopshere)

## Stack

- **Frontend:** React, Redux Toolkit, React Router
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Integrations:** Razorpay, Cloudinary, Nodemailer

## Run locally

Use Node.js 20 or newer and a MongoDB database. Copy `backend/.env.example` to `backend/.env`, then set the database URL, a strong JWT secret, and any provider credentials you plan to use. Keep real credentials in local environment files and out of Git.

From the project root:

```bash
npm run install-all
npm run dev
```

The frontend runs on port `3000` and the API on port `5000` by default.

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
