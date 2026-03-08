import { getAccountStateForUser, setBotLifecycleStateForUser } from "@/lib/server/account-state";
import { getInternalBotStatus } from "@/lib/server/bot-backend";

function resolveLifecycleState(params: {
  running: boolean;
  lastError: string | null;
  persistedState: string;
}) {
  if (params.lastError) return "error";
  if (params.running) return "running";
  if (params.persistedState === "starting") return "starting";
  if (params.persistedState === "stopping") return "stopping";
  if (params.persistedState === "idle") return "idle";
  return "stopped";
}

export async function buildBotStatusResponse(userId: string) {
  const [accountState, statusResult] = await Promise.all([
    getAccountStateForUser(userId),
    getInternalBotStatus(userId),
  ]);

  if (!statusResult.ok) {
    const lifecycleState =
      accountState.botLifecycleState === "starting" || accountState.botLifecycleState === "running"
        ? "error"
        : accountState.botLifecycleState;
    if (lifecycleState === "error" && accountState.botLifecycleState !== "error") {
      await setBotLifecycleStateForUser(userId, "error");
    }

    return {
      running: false,
      lifecycleState,
      startedAt: null,
      paperMode: accountState.botConfig.paperTrade,
      balanceUsdc: 0,
      totalPnl: 0,
      positions: 0,
      latency: {},
      marketsTracked: 0,
      ws: { connected: false },
      lastError: statusResult.message,
      errorCode: statusResult.code,
      backendAvailable: false,
      walletAddress: accountState.walletAddress,
    };
  }

  const status = statusResult.data;
  const lifecycleState = resolveLifecycleState({
    running: Boolean(status.running),
    lastError: status.last_error ?? null,
    persistedState: accountState.botLifecycleState,
  });

  return {
    running: Boolean(status.running),
    lifecycleState,
    startedAt: status.started_at || null,
    paperMode: status.paper_mode ?? true,
    balanceUsdc: status.balance_usdc ?? 0,
    totalPnl: status.total_pnl ?? 0,
    positions: status.positions ?? 0,
    latency: status.latency || {},
    marketsTracked: status.markets_tracked ?? 0,
    ws: status.ws || {},
    lastError: status.last_error ?? null,
    errorCode: null,
    backendAvailable: true,
    walletAddress: accountState.walletAddress,
  };
}
