# Artisan Market

An online marketplace where local artisans sell handmade goods. Built with Next.js, Prisma, SQLite, and Stripe.

## Features

- **Sellers** — Sign up, create a store profile, list products (after admin approval), receive order notifications, mark orders shipped
- **Buyers** — Browse, search by category/keyword, cart & checkout, leave reviews after delivery
- **Admin** — Approve/suspend sellers, remove rule-violating listings, run weekly payouts
- **Payments** — Stripe Checkout with 10% platform fee; weekly seller payouts
- **Suspended sellers** — Listings hidden from buyers immediately; still visible in admin

## Quick start

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Default admin:** `admin@artisan.local` / `admin123` (set via `.env`)

## Stripe setup

1. Create a [Stripe](https://stripe.com) account
2. Add keys to `.env`:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET` (from `stripe listen --forward-to localhost:3000/api/stripe/webhook`)
3. Without Stripe keys, checkout runs in **demo mode** (orders marked paid locally)

## Weekly payouts

Call `POST /api/payouts/run` as admin (button in admin panel) or schedule with a cron job using the `CRON_SECRET` header.

Sellers need `stripeAccountId` on their profile for real Stripe transfers (Connect onboarding can be added later).

## Product images

Use direct image URLs (e.g. Unsplash) when listing products.
