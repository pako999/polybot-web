import { NextRequest, NextResponse } from "next/server";
import { appendBotEventForUser, requireAuthenticatedUserId, setBotLifecycleStateForUser } from "@/lib/server/account-state";
import { stopInternalBot } from "@/lib/server/bot-backend";
import { isCrossSiteRequest } from "@/lib/server/security";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const rate = await checkRateLimit(`bot_stop:${userId}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many stop requests. Please wait.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const backendResult = await stopInternalBot(userId);
  if (!backendResult.ok) {
    await setBotLifecycleStateForUser(userId, "error");
    await appendBotEventForUser(userId, {
      type: "bot_error",
      message: `Bot stop failed: ${backendResult.message}`,
    });
    return NextResponse.json(
      { error: backendResult.message, code: backendResult.code },
      { status: 502 }
    );
  }

  const state = await setBotLifecycleStateForUser(
    userId,
    backendResult.data.status === "stopped" ? "stopped" : "stopping"
  );
  await appendBotEventForUser(userId, {
    type: "bot_stop_requested",
    message: "Bot stop requested.",
  });
  console.info("[security-audit] bot_stop_requested", {
    userId,
    walletAddress: state.walletAddress,
  });
  return NextResponse.json({
    message: backendResult.data.message || "Bot stopped successfully.",
    status: backendResult.data.status || "stopped",
    botRunning: state.botRunning,
    lifecycleState: state.botLifecycleState,
    walletAddress: state.walletAddress,
  });
}
