import { NextResponse } from "next/server";
import { getAccountStateForUser, requireAuthenticatedUserId } from "@/lib/server/account-state";

export async function GET() {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const state = await getAccountStateForUser(userId);
  return NextResponse.json({
    connected: Boolean(state.walletAddress),
    walletAddress: state.walletAddress,
    chainId: state.chainId,
    botRunning: state.botRunning,
  });
}
