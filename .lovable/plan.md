# Go live: real accounts, secure orders, card payments

The Terms and Conditions page is done (linked in the footer). This plan covers the security and payment work.

## What you will get
- Real sign-up / sign-in (email + Google). Checkout and "My orders" require sign-in.
- Lucky spin saved on the server, once per account (can't be re-spun by refreshing or clearing the browser).
- Orders saved in the database. Each customer can only see their own orders.
- Card payments through Lovable's built-in Stripe payments (no Stripe account setup needed).
- Order status (paid, shipped) can only be changed by the verified payment confirmation or by an admin.
- A simple admin page to mark orders as shipped.

## Security measures
- Access rules on every table: customers read/update only their own profile and orders; no one can edit or delete others' data. Orders cannot be created or changed directly from the browser.
- Prices and totals are recalculated on the server from the database; the browser only sends product IDs, quantities and options. Spin discount is read from the server, not the browser.
- Payment confirmations are checked with a signature before any order is marked paid.
- All form fields (address, phone, custom mm notes) validated with strict length/format rules and stripped of HTML; all database access uses safe parameterised queries.
- Rate limit: max 10 checkout attempts per minute per visitor, and spin limited; sign-in attempts are rate-limited by the built-in auth service.
- Passwords are hashed by the auth service (bcrypt). Data is encrypted at rest (AES-256) and all traffic is HTTPS only.
- Admin role stored in a separate roles table, checked on the server.

## About the subdomain setup
- This app is not Next.js, so NEXT_PUBLIC_API_URL / DATABASE_URL don't apply. Frontend and server code run together on one domain, so a separate api.yourbrand.com is not needed and cross-site requests are already blocked.
- If you later connect a custom domain (e.g. nailbymuskii.pk), any public endpoints will only accept that domain.
- Email sending from mail.yourbrand.com with SPF/DKIM/DMARC can be set up once you own a domain; the records are added for you automatically.

## Technical details
- Migration: `user_roles` + `has_role`, `rate_limits` table, orders gain `payment_status`, `stripe_session_id`; revoke `perform_spin` from anon.
- Server functions (`requireSupabaseAuth`): `createCheckout` (reprices from `products`, applies profile discount, inserts pending order via admin client, creates Stripe session), `listMyOrders`, `adminUpdateStatus` (has_role check).
- Webhook route `/api/public/payments/webhook` with signature verification marks orders paid.
- Replace mock catalog/auth/spin/orders with real data; catalog seeded with all 60 products in a migration.
- Restore `/auth` page and `_authenticated` gate for checkout, orders, admin.
- Remove `vercel.json` SPA rewrite reliance (app deploys via Publish).
