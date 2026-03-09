import { NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/lib/server/account-state";
import { getInternalBotStats } from "@/lib/server/bot-backend";
import { normalizeStats } from "@/lib/server/bot-data";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function GET() {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const rate = await checkRateLimit(`bot_stats:${userId}`, 120, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many stats requests. Please wait.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const result = await getInternalBotStats(userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, code: result.code }, { status: 502 });
  }

  return NextResponse.json({ stats: normalizeStats(result.data) });
}
