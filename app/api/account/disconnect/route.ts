import { NextRequest, NextResponse } from "next/server";
import { disconnectWalletForUser, requireAuthenticatedUserId } from "@/lib/server/account-state";
import { isCrossSiteRequest } from "@/lib/server/security";

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const state = await disconnectWalletForUser(userId);
  console.info("[security-audit] wallet_disconnected", { userId });
  return NextResponse.json({
    message: "Wallet disconnected.",
    connected: false,
    walletAddress: state.walletAddress,
    chainId: state.chainId,
    botRunning: state.botRunning,
  });
}
