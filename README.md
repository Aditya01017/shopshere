# ShopSphere

A full-stack MERN e-commerce application with customer, administrative, catalog, cart, order, and payment workflows.

## Highlights

- JWT-based authentication and role-aware customer/admin flows
- Product catalog, cart, checkout, order history, and admin management features
- MongoDB persistence through Mongoose
- Cloudinary media uploads and Razorpay payment integration
- Postman collection for exercising the API

## Stack

- **Frontend:** React, Redux Toolkit, React Router
- **Backend:** Node.js, Express, Mongoose
- **Services:** MongoDB, Cloudinary, Razorpay, Nodemailer

## Run locally

Prerequisites: Node.js 20+, npm, a MongoDB instance, and development credentials for the optional third-party integrations.

1. Create the backend environment file:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Configure `MONGO_URI` and `JWT_SECRET` at minimum. Add Cloudinary, Razorpay, and email settings only if you are using those workflows.

3. Install and start both applications:

   ```bash
   npm install
   npm run dev
   ```

The frontend runs on port `3000` and the API defaults to port `5000`.

## API testing

Import `Shopzware_Postman_Collection.json` into Postman and configure its variables with local values. The repository intentionally does not provide real credentials or production test accounts.

## Security

Environment files and generated frontend builds are excluded from Git. Use only local/deployment secret stores for sensitive configuration.
