# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marketplace/SaaS booking platform for barbershops and beauty salons ("Barba, Cabelo e Unha"). Owners register venues, customers browse and book appointments, and subscriptions are managed via Stripe.

## Stack

- **Next.js 14** — App Router + TypeScript
- **Prisma ORM** + **PostgreSQL** (Supabase)
- **NextAuth.js** — JWT-based auth with role system
- **Stripe** — recurring monthly subscriptions per venue
- **Vercel** — deployment target

## Commands

```bash
npm install
npm run dev

# Database
npx prisma migrate dev --name <migration-name>
npx prisma db seed
npx prisma studio          # GUI to inspect data

# Stripe webhook (local dev)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Required Environment Variables

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
STRIPE_SECRET_KEY
STRIPE_PRICE_ID
STRIPE_WEBHOOK_SECRET
```

## Architecture

### Route Groups & Access Control

The `src/app/` directory uses Next.js route groups to separate concerns:

| Group | Path prefix | Role required |
|-------|-------------|---------------|
| `(marketplace)` | `/`, `/estabelecimentos`, `/agendar`, `/minha-conta` | Public (login only for booking) |
| `(auth)` | `/login` | Public |
| `(owner)` | `/parceiros`, `/painel` | `owner` |
| `(admin)` | `/admin` | `admin` |

### Middleware (`middleware.ts`)

Wraps `withAuth` from NextAuth. Enforces role checks before the App Router handles requests:
- `/painel/**` → requires `role === "owner"`
- `/admin/**` → requires `role === "admin"`
- `/minha-conta/**` → requires any valid token

### Auth (`lib/auth.ts`)

Uses `CredentialsProvider` with bcrypt. The JWT and Session types are extended to carry `id` and `role`. Role is read directly from the Prisma `user.role` field at login time and embedded in the JWT — there is no re-fetch on subsequent requests.

### Stripe (`lib/stripe.ts`)

`obterOuCriarStripeCustomer(venueId, email, nome)` is the entry point for checkout. It lazily creates a Stripe Customer and persists `stripeCustomerId` on the `Venue` record.

The webhook at `/api/webhooks/stripe` handles four events:
- `invoice.payment_succeeded` → extend `subscriptionExpiresAt`
- `invoice.payment_failed` → mark venue as `past_due`
- `customer.subscription.deleted` → set expiry, hide venue from marketplace
- `customer.subscription.updated` → reactivate on payment

### Booking Logic

`/api/horarios-disponiveis` implements anti-double-booking: it computes available slots by querying existing `Agendamento` records for the venue/date and filtering out occupied times before returning options to the client.

## User Roles

| Role | Email (seed) | Notes |
|------|-------------|-------|
| `admin` | admin@bcu.com | Approves/rejects venues |
| `owner` | joao@barbearia.com / maria@salao.com | Manages own venue, services, schedule |
| `client` | cliente@email.com | Books appointments |
