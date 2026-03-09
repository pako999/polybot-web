import { NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/lib/server/account-state";
import { getInternalBotTrades } from "@/lib/server/bot-backend";
import { normalizeTrades } from "@/lib/server/bot-data";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function GET() {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const rate = await checkRateLimit(`bot_trades:${userId}`, 120, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many trades requests. Please wait.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const result = await getInternalBotTrades(userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, code: result.code }, { status: 502 });
  }

  return NextResponse.json({ trades: normalizeTrades(result.data) });
}
