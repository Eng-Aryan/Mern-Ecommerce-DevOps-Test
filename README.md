# Tidewater Supply — MERN E-commerce

A complete full-stack store built with **MongoDB, Express, React (Vite) and Node**.

## Features

**Shoppers**
- Product catalogue with full-text search, category filter, price range, in-stock filter, sorting and pagination
- Product pages with image gallery, stock status, related products, ratings and reviews
- Cart saved in the browser, server-verified pricing, coupon codes, free-shipping threshold
- Checkout with saved address; **Pay on delivery** or **card payments via Stripe Checkout**
- Order history, live order tracking, order cancellation (restocks items)
- Wishlist, profile and password change, JWT sign-in

**Admin (`/admin`)**
- Dashboard: revenue, orders, 7-day sales chart, low-stock alerts, recent orders
- Products: create, edit, delete, multiple image uploads (or image URLs), featured flag
- Orders: filter by status, change status, mark paid
- Customers: promote/demote admins, delete users
- Coupons: percent or fixed, minimum order, usage limit, expiry

**Security & quality**
- Passwords hashed with bcrypt, JWT auth, role-protected routes
- Prices, stock and coupons are always recalculated on the server; stock is reserved atomically
- Helmet, CORS, rate limiting on auth, upload type/size limits
- Admin screens are code-split; responsive layout; keyboard focus styles; reduced-motion support

## Requirements
- Node.js 18+
- MongoDB running locally, or a free MongoDB Atlas connection string

## Windows: one-click start

Double-click **`start.bat`**. It checks Node.js and MongoDB, installs packages on the first run, loads the sample data
on the first run only, starts the API and the website in two windows, waits until both respond, opens the browser and prints:

- Website: http://localhost:5173
- Admin: http://localhost:5173/admin
- API: http://localhost:5000/api/products

`stop.bat` stops both servers. `reset-data.bat` wipes the database and reloads the sample data (asks for confirmation).
The database is `ecoumerce` on `mongodb://127.0.0.1:27017` (set in `server/.env`).

## Quick start (any system)

```bash
npm run install:all          # installs root, server and client packages
```

The server reads `server/.env` (already created from `.env.example`). Edit it:

```
MONGO_URI=mongodb://127.0.0.1:27017/tidewater      # or your Atlas URI
JWT_SECRET=use_a_long_random_string
STRIPE_SECRET_KEY=                                   # optional
```

Load sample data, then start both servers:

```bash
npm run seed
npm run dev
```

- Store: http://localhost:5173
- API:   http://localhost:5000/api

### Demo accounts (after seeding)

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@tidewater.test     | Admin123!    |
| Shopper | shopper@tidewater.test   | Shopper123!  |

Coupons: `WELCOME10` (10% off) and `TAKE20` ($20 off orders of $120+).

Change or delete these accounts before going live.

## Testing
With the API running against a freshly seeded database (`npm run seed`, then `npm run dev`):

```bash
python3 tests/api_smoke_test.py
```
It runs 59 checks: search and filters, auth, pricing and coupons, stock reservation and restocking, order permissions,
reviews, wishlist and the admin endpoints. Re-seed before running it again.

## Card payments (Stripe)
1. Create a Stripe account and copy your **secret key** (starts with `sk_test_`).
2. Put it in `server/.env` as `STRIPE_SECRET_KEY` and restart the API.
3. The "Pay by card" option appears at checkout. Test with card `4242 4242 4242 4242`.

The order is marked paid when the customer returns from Stripe and the server verifies the session.
For production, also add a Stripe webhook so orders are marked paid even if the customer closes the tab.

## Production

```bash
npm run build                 # builds client/dist
NODE_ENV=production npm start # Express serves the API and the built React app on one port
```

Set `NODE_ENV=production`, a strong `JWT_SECRET`, `MONGO_URI` and `CLIENT_URL` (your public URL) in the environment.
Uploaded images are stored in `server/uploads`; on hosts with ephemeral disks, switch `middleware/upload.js` to S3 or Cloudinary.
If the API is hosted separately from the client, set `VITE_API_URL` (e.g. `https://api.example.com/api`) and `VITE_ASSET_URL` (`https://api.example.com`) when building the client.

## Project structure

```
server/
  server.js            app entry
  seed.js              sample data
  config/ models/ controllers/ routes/ middleware/ utils/
client/
  src/
    api.js             axios instance + helpers
    context/           Auth and Cart state
    components/        Navbar, ProductCard, Pagination, ...
    pages/             storefront pages
    pages/admin/       admin panel
```

## API overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET/PUT | `/api/auth/me`, `/api/auth/profile` | user |
| GET | `/api/products`, `/api/products/categories`, `/api/products/:id` | public |
| POST/PUT/DELETE | `/api/products[/:id]` | admin |
| POST | `/api/products/:id/reviews` | user |
| GET/POST | `/api/wishlist`, `/api/wishlist/:productId` | user |
| POST | `/api/orders/quote` | public |
| POST/GET | `/api/orders`, `/api/orders/mine`, `/api/orders/:id` | user |
| PUT | `/api/orders/:id/cancel` | user |
| POST | `/api/payment/session/:orderId`, `/api/payment/confirm/:orderId` | user |
| POST | `/api/upload` | admin |
| GET/PUT/DELETE | `/api/admin/*` (stats, orders, users, coupons) | admin |
