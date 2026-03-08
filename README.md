# PolyBot SaaS — Prediction Market Trading Platform

Next.js 14 SaaS website with **Clerk authentication** for selling an AI-powered Polymarket trading bot as a monthly/yearly subscription.

## Pages

- `/` — Landing page (hero, features, strategies, terminal preview, CTA)
- `/pricing` — 3-tier pricing with monthly/yearly toggle (Starter $49/Pro $149/Enterprise $499)
- `/dashboard` — **Protected** trading dashboard (P&L chart, positions, trades, strategy stats)
- `/account` — **Protected** wallet/account control (MetaMask connect/disconnect, bot start/stop)
- `/login` — Clerk SignIn (email, Google, GitHub, etc.)
- `/signup` — Clerk SignUp with free trial messaging

## Auth (Clerk)

Authentication is handled by [Clerk](https://clerk.com):

- **`ClerkProvider`** wraps the entire app in `layout.tsx` with dark theme + green accent
- **`middleware.ts`** protects `/dashboard` and `/account` — unauthenticated users are redirected to `/login`
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
# Paste your keys and optional bot backend config:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
# CLERK_SECRET_KEY=sk_test_xxx
# CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxx
# NEXT_PUBLIC_API_BASE_URL=https://polybot.uk
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_ADMIN_CHAT_ID=
# OPS_ALERT_TOKEN=
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
# SECURITY_CSP_REPORT_ONLY=true
# SECURITY_CSP_REPORT_ENDPOINT=/api/csp/report
# SECURITY_CSP=default-src 'self'; ...
# POLYBOT_INTERNAL_BASE_URL=https://bot.polybot.uk
# POLYBOT_INTERNAL_API_TOKEN=<same as VPS INTERNAL_API_TOKEN>
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
# Recommended production API base: NEXT_PUBLIC_API_BASE_URL=https://polybot.uk
# Optional server-side bot bridge: POLYBOT_INTERNAL_BASE_URL, POLYBOT_INTERNAL_API_TOKEN

# Option 2: GitHub
# Push to GitHub → Connect repo in vercel.com → Add env vars → Auto deploys
```

## What to Add Next

1. **Stripe** — Payment processing for subscriptions (monthly/yearly)
2. **Database** — Neon PostgreSQL for user plans, trade history
3. **Webhooks** — Clerk webhook to sync user creation with your DB
4. **Real API** — Expand bot backend endpoints beyond start/stop/status
5. **Email** — Resend for transactional emails (welcome, alerts, invoices)

## Wallet + Bot API Routes

Authenticated routes (all in this Next.js app):

- `GET /api/account/profile` — fetch connected wallet + bot state for current user
- `POST /api/account/connect` — store public wallet address + chainId
- `POST /api/account/disconnect` — clear stored wallet data
- `POST /api/bot/start` — start bot for connected wallet
- `POST /api/bot/stop` — stop bot for connected wallet
- `GET /api/bot/status` — fetch user-scoped bot status
- `POST /api/webhooks/clerk` — receives Clerk events and notifies Telegram on `user.created`
- `POST /api/ops/alert` — protected endpoint for VPS error/down alerts -> Telegram

Notes:
- No private keys are collected or stored.
- Wallet info is saved in Clerk private metadata (`polybotAccount`) for the signed-in user.
- Bot control/status routes call `POLYBOT_INTERNAL_BASE_URL` server-side with bearer token from `POLYBOT_INTERNAL_API_TOKEN`.
- Do not expose internal token to frontend (`NEXT_PUBLIC_` must never be used for this token).

Internal bot API contract used by web backend:
- `POST /api/bot/start` with `{ user_id, paper_mode, config: { min_market_volume, min_market_liquidity } }`
- `POST /api/bot/stop` with `{ user_id }`
- `GET /api/bot/status?user_id=<id>`
- Header on all calls: `Authorization: Bearer <POLYBOT_INTERNAL_API_TOKEN>`

## Frontend Wallet Flow

The `/account` page now uses MetaMask (`window.ethereum`) with this flow:

1. `POST /api/wallet/challenge`
2. sign returned message with `personal_sign`
3. `POST /api/wallet/verify`
4. `POST /api/account/connect`
5. `POST /api/bot/start` / `POST /api/bot/stop` / `GET /api/bot/status`

Client notes:
- API calls are centralized in `lib/api/client.ts`.
- `NEXT_PUBLIC_API_BASE_URL` controls where frontend API requests go.
- Production value: `NEXT_PUBLIC_API_BASE_URL=https://polybot.uk`
- Wallet/session state is hydrated on page load from `GET /api/bot/status`.

Quick backend bridge checks:

```bash
curl -sS https://bot.polybot.uk/api/health
curl -sS https://bot.polybot.uk/api/status -H "Authorization: Bearer $POLYBOT_INTERNAL_API_TOKEN"
```

## Telegram Notifications

### New signup alerts

- Route: `POST /api/webhooks/clerk`
- On Clerk `user.created`, server sends Telegram admin message with user id/email/time.
- Security: webhook signature verified using `CLERK_WEBHOOK_SIGNING_SECRET`.

Clerk Dashboard setup:
1. Create webhook endpoint: `https://polybot.uk/api/webhooks/clerk`
2. Subscribe to `user.created`
3. Copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`

### VPS errors / service down alerts

- Route: `POST /api/ops/alert`
- Auth: header `x-ops-token` must match `OPS_ALERT_TOKEN`.
- Script provided: `scripts/vps-monitor.sh`
  - checks systemd service status (critical alert if down)
  - scans log file for error patterns (error alert)

Example cron (every minute):

```bash
* * * * * OPS_ALERT_URL="https://polybot.uk/api/ops/alert" OPS_ALERT_TOKEN="<token>" MONITOR_SOURCE="polybot-vps-1" MONITOR_SERVICE_NAME="polybot-bot.service" MONITOR_LOG_FILE="/var/log/polybot/bot.log" /bin/bash /path/to/repo/scripts/vps-monitor.sh
```

Important:
- If a server is fully unreachable, it cannot self-report. For true down alerts, also add an external uptime monitor (UptimeRobot/Better Stack) hitting your health URL and notifying Telegram.

## Security Hardening

Implemented:
- Security headers in middleware (`X-Frame-Options`, `nosniff`, HSTS, `Permissions-Policy`, `Referrer-Policy`, `CSP`)
- CSRF-style cross-site checks on sensitive POST routes
- Timing-safe secret comparison for ops token auth
- Rate limiting on bot control + ops alert routes
- Telegram HTML escaping for alert payloads

Rate limiter:
- Uses Upstash Redis REST if `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set.
- Falls back to in-memory limits automatically (dev/single-instance fallback).

CSP:
- Default policy is generated in `middleware.ts`.
- Use `SECURITY_CSP_REPORT_ONLY=true` first in production to observe violations.
- Set `SECURITY_CSP` to fully override policy if your deployment needs custom sources.
- CSP reports are ingested at `POST /api/csp/report` (configurable via `SECURITY_CSP_REPORT_ENDPOINT`).
- Middleware emits both `report-uri` and `Report-To` headers and logs normalized violation details.
- Default policy includes Clerk runtime hosts (`*.clerk.accounts.dev`) and `https://bot.polybot.uk` for connect-src.

## File Structure

```
middleware.ts              Clerk auth middleware (protects /dashboard and /account)
.env.local.example         Environment variables template
app/
  layout.tsx               Root layout with ClerkProvider + dark theme
  globals.css              Global styles + Clerk dark mode support
  page.tsx                 Landing page
  pricing/page.tsx         Pricing page
  dashboard/page.tsx       Protected dashboard
  account/page.tsx         Protected account page for wallet + bot controls
  api/account/*            Wallet account API routes
  api/bot/*                Bot start/stop API routes
  login/[[...login]]/      Clerk SignIn (catch-all route)
  signup/[[...signup]]/    Clerk SignUp (catch-all route)
components/
  Navbar.tsx               Nav with SignedIn/SignedOut/UserButton
  Footer.tsx               Footer
lib/server/
  account-state.ts         Clerk metadata-backed wallet/bot state
  bot-backend.ts           Optional forwarding to live bot backend
```

## Design

- Dark terminal-inspired aesthetic
- Green accent (#00e676) matching Clerk's `colorPrimary`
- Outfit font for display, JetBrains Mono for data
- Glass-morphism cards with subtle borders
- Clerk components fully themed to match (dark background, green buttons, custom inputs)
