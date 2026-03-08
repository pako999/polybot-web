# PolyBot SaaS — Prediction Market Trading Platform

Next.js 14 SaaS website with **Clerk authentication** for selling an AI-powered Polymarket trading bot as a monthly/yearly subscription.

## Pages

- `/` — Landing page (hero, features, strategies, terminal preview, CTA)
- `/pricing` — 3-tier pricing with monthly/yearly toggle (Starter $49/Pro $149/Enterprise $499)
- `/dashboard` — **Protected** trading dashboard (P&L chart, positions, trades, strategy stats)
- `/login` — Clerk SignIn (email, Google, GitHub, etc.)
- `/signup` — Clerk SignUp with free trial messaging

## Auth (Clerk)

Authentication is handled by [Clerk](https://clerk.com):

- **`ClerkProvider`** wraps the entire app in `layout.tsx` with dark theme + green accent
- **`middleware.ts`** protects `/dashboard` — unauthenticated users are redirected to `/login`
- **`<SignedIn>` / `<SignedOut>`** conditionally shows nav items and auth buttons
- **`<UserButton>`** in navbar and dashboard sidebar for account management
- **`<SignIn>` / `<SignUp>`** components on login/signup pages, styled to match the dark theme

### Clerk Setup

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application called "PolyBot"
3. Enable sign-in methods: **Email + Password**, **Google**, **GitHub** (recommended)
4. Copy your API keys
5. Create `.env.local`:

```bash
cp .env.local.example .env.local
# Paste your keys:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
# CLERK_SECRET_KEY=sk_test_xxx
```

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (custom dark theme)
- **Clerk** (authentication)
- **Lucide React** (icons)
- **Vercel** deployment ready

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Add your Clerk keys to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel
# Add env vars in Vercel dashboard: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY

# Option 2: GitHub
# Push to GitHub → Connect repo in vercel.com → Add env vars → Auto deploys
```

## What to Add Next

1. **Stripe** — Payment processing for subscriptions (monthly/yearly)
2. **Database** — Neon PostgreSQL for user plans, trade history
3. **Webhooks** — Clerk webhook to sync user creation with your DB
4. **Real API** — Connect dashboard to actual Polymarket bot backend
5. **Email** — Resend for transactional emails (welcome, alerts, invoices)

## File Structure

```
middleware.ts              Clerk auth middleware (protects /dashboard)
.env.local.example         Environment variables template
app/
  layout.tsx               Root layout with ClerkProvider + dark theme
  globals.css              Global styles + Clerk dark mode support
  page.tsx                 Landing page
  pricing/page.tsx         Pricing page
  dashboard/page.tsx       Protected dashboard
  login/[[...login]]/      Clerk SignIn (catch-all route)
  signup/[[...signup]]/    Clerk SignUp (catch-all route)
components/
  Navbar.tsx               Nav with SignedIn/SignedOut/UserButton
  Footer.tsx               Footer
```

## Design

- Dark terminal-inspired aesthetic
- Green accent (#00e676) matching Clerk's `colorPrimary`
- Outfit font for display, JetBrains Mono for data
- Glass-morphism cards with subtle borders
- Clerk components fully themed to match (dark background, green buttons, custom inputs)
