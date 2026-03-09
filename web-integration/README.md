# PolyBot Web Integration

How to wire the bot backend proxy into your Next.js web app. The proxy keeps the internal token on the server and avoids CORS.

## Setup

### 1. Environment variables

Set in Vercel (or `.env.local` for local dev):

```
POLYBOT_BACKEND_URL=https://bot.polybot.uk
POLYBOT_INTERNAL_API_TOKEN=<same value as INTERNAL_API_TOKEN on the VPS>
```

`POLYBOT_INTERNAL_BASE_URL` is also supported for legacy compatibility.

### 2. Copy these files

| File | Purpose |
|------|---------|
| `lib/server/bot-backend.ts` | Shared helper that forwards requests to the bot backend with auth |
| `lib/server/bot-data.ts` | Normalizers for trades, positions, stats |
| `app/api/bot/trades/route.ts` | Proxies `GET /api/bot/trades` |
| `app/api/bot/positions/route.ts` | Proxies `GET /api/bot/positions` |
| `app/api/bot/stats/route.ts` | Proxies `GET /api/bot/stats` |

You also need `lib/server/account-state.ts` (for `requireAuthenticatedUserId`) and `lib/server/rate-limit.ts` (for `checkRateLimit`), or adapt the routes to your auth/rate-limit setup.

### 3. Auth model

This app uses **session-based auth**: `user_id` is derived from the signed-in user (Clerk). The client never passes `user_id`; the server resolves it from the session. This avoids exposing or trusting client-supplied user IDs.

If your app uses a different auth system, ensure your proxy routes resolve `user_id` from the authenticated session and never trust `user_id` from query params or headers without validation.

## Usage

Call your own API from the frontend (no token on the client):

```ts
// Example: fetch trades for the current user (session determines user_id)
const { trades } = await fetch("/api/bot/trades").then((r) => r.json());

// Positions
const { positions } = await fetch("/api/bot/positions").then((r) => r.json());

// Stats
const { stats } = await fetch("/api/bot/stats").then((r) => r.json());
```

The proxy adds `?user_id=<id>` server-side from the authenticated session.

## Response shapes

- **Trades**: `{ trades: [...] }` — normalized trade rows
- **Positions**: `{ positions: [...] }` — normalized position rows
- **Stats**: `{ stats: { totalTrades, openPositions, realizedPnl, ... } }`

See the main [README](../README.md) for the internal bot API contract and backend response shapes.
