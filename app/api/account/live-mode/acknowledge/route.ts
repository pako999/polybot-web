import { NextRequest, NextResponse } from "next/server";
import {
  acknowledgeLiveModeForUser,
  appendBotEventForUser,
  getAccountStateForUser,
  isLiveModeEligible,
  requireAuthenticatedUserId,
} from "@/lib/server/account-state";
import { isCrossSiteRequest } from "@/lib/server/security";

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const currentState = await getAccountStateForUser(userId);
  if (!currentState.walletAddress) {
    return NextResponse.json(
      { error: "Connect and verify a wallet before enabling live mode.", code: "LIVE_MODE_REQUIRES_WALLET" },
      { status: 400 }
    );
  }

  const state = await acknowledgeLiveModeForUser(userId);
  await appendBotEventForUser(userId, {
    type: "live_mode_acknowledged",
    message: "Live trading risk acknowledgement saved.",
  });
  return NextResponse.json({
    message: "Live mode acknowledgement saved.",
    liveModeAcknowledgedAt: state.liveModeAcknowledgedAt,
    liveModeEligible: isLiveModeEligible(state),
  });
}
