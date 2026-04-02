# Jshop - Ecommerce Project

## Requirements
- Node.js (LTS)
- MySQL 8+

## Database setup
1. Create the database and tables using your provided SQL schema.
2. (Optional) Seed product images:
   - Run the SQL file: backend/seed_images.sql

## Backend setup
1. Copy the env file:
   - backend/.env.example -> backend/.env
2. Fill these values in backend/.env:
   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
   - JWT_SECRET
   - ADMIN_EMAILS
   - STRIPE_SECRET_KEY (optional)
   - STRIPE_WEBHOOK_SECRET (optional)
3. Install dependencies:
   - cd backend
   - npm install
4. Start the server:
   - npm start

## Frontend setup
1. Install dependencies:
   - cd frontend
   - npm install
2. Start the dev server:
   - npm run dev
3. Open the URL shown in the terminal (usually http://localhost:5173 or 5174).

## Admin access
- The admin page is at /admin/products
- Only emails listed in ADMIN_EMAILS can manage products.

## Product images
- Place images in frontend/public/images
- Use the filename in the product image field (e.g. iphone.jpg).

## Stripe (optional)
- Stripe Checkout is enabled when STRIPE_SECRET_KEY is set.
- For webhook validation, create a Stripe webhook endpoint:
  http://localhost:3000/api/webhooks/stripe
