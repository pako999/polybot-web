import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId, setBotRunningForUser } from "@/lib/server/account-state";
import { stopInternalBot } from "@/lib/server/bot-backend";
import { isCrossSiteRequest } from "@/lib/server/security";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const rate = await checkRateLimit(`bot_stop:${userId}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many stop requests. Please wait." }, { status: 429 });
  }

  const backendResult = await stopInternalBot(userId);
  if (!backendResult.ok) {
    return NextResponse.json({ error: backendResult.message }, { status: 502 });
  }

  const state = await setBotRunningForUser(userId, false);
  console.info("[security-audit] bot_stop_requested", {
    userId,
    walletAddress: state.walletAddress,
  });
  return NextResponse.json({
    message: backendResult.data.message || "Bot stopped successfully.",
    status: backendResult.data.status || "stopped",
    botRunning: state.botRunning,
    walletAddress: state.walletAddress,
  });
}
