import { NextResponse } from "next/server";
import { getAccountStateForUser, requireAuthenticatedUserId } from "@/lib/server/account-state";
import { getInternalBotStatus } from "@/lib/server/bot-backend";

export async function GET() {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const [accountState, statusResult] = await Promise.all([
    getAccountStateForUser(userId),
    getInternalBotStatus(userId),
  ]);

  if (!statusResult.ok) {
    return NextResponse.json({ error: statusResult.message }, { status: 502 });
  }

  const status = statusResult.data;
  return NextResponse.json({
    running: Boolean(status.running),
    startedAt: status.started_at || null,
    paperMode: status.paper_mode ?? true,
    balanceUsdc: status.balance_usdc ?? 0,
    totalPnl: status.total_pnl ?? 0,
    positions: status.positions ?? 0,
    latency: status.latency || {},
    marketsTracked: status.markets_tracked ?? 0,
    ws: status.ws || {},
    lastError: status.last_error ?? null,
    walletAddress: accountState.walletAddress,
  });
}
