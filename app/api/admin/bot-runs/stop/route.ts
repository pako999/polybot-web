import { NextRequest, NextResponse } from "next/server";
import { requireAdminUserId } from "@/lib/server/admin";
import { appendBotEventForUser, setBotLifecycleStateForUser } from "@/lib/server/account-state";
import { stopInternalBot } from "@/lib/server/bot-backend";
import { isCrossSiteRequest } from "@/lib/server/security";

type StopPayload = {
  userId?: unknown;
};

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const admin = await requireAdminUserId();
  if (!admin.userId) {
    return NextResponse.json({ error: admin.error, code: "ADMIN_REQUIRED" }, { status: admin.status });
  }

  let payload: StopPayload;
  try {
    payload = (await req.json()) as StopPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", code: "INVALID_JSON" }, { status: 400 });
  }

  if (typeof payload.userId !== "string" || !payload.userId) {
    return NextResponse.json({ error: "userId is required.", code: "INVALID_USER_ID" }, { status: 400 });
  }

  const backendResult = await stopInternalBot(payload.userId);
  if (!backendResult.ok) {
    await setBotLifecycleStateForUser(payload.userId, "error");
    await appendBotEventForUser(payload.userId, {
      type: "bot_error",
      message: `Admin stop failed: ${backendResult.message}`,
    });
    return NextResponse.json(
      { error: backendResult.message, code: backendResult.code },
      { status: 502 }
    );
  }

  const state = await setBotLifecycleStateForUser(payload.userId, "stopped");
  await appendBotEventForUser(payload.userId, {
    type: "bot_stop_requested",
    message: `Bot stop requested by admin ${admin.userId}.`,
  });

  return NextResponse.json({
    message: backendResult.data.message || "Bot stopped by admin.",
    userId: payload.userId,
    lifecycleState: state.botLifecycleState,
  });
}
