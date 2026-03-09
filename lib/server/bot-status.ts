import { getAccountStateForUser, setBotLifecycleStateForUser } from "@/lib/server/account-state";
import { getInternalBotStatus } from "@/lib/server/bot-backend";

function resolveLifecycleState(params: {
  running: boolean;
  lastError: string | null;
  backendStatus: string | undefined;
  persistedState: string;
}) {
  if (params.lastError) return "error";
  if (params.running) return "running";
  if (params.backendStatus === "queued" || params.backendStatus === "starting") return "starting";
  if (params.persistedState === "starting") return "starting";
  if (params.persistedState === "stopping") return "stopping";
  if (params.backendStatus === "idle" || params.persistedState === "idle") return "idle";
  return "stopped";
}

function asStartedAt(value: number | string | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return new Date(value * 1000).toISOString();
  }
  return String(value);
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
  const m = status.metrics;
  const lastError = status.error || status.last_error || null;
  const lifecycleState = resolveLifecycleState({
    running: Boolean(status.running),
    lastError: lastError ?? null,
    backendStatus: status.status ?? m?.status,
    persistedState: accountState.botLifecycleState,
  });

  return {
    running: Boolean(status.running),
    lifecycleState,
    startedAt: asStartedAt(status.started_at ?? m?.started_at),
    paperMode: status.paper_mode ?? m?.paper_mode ?? true,
    balanceUsdc: m?.balance_usdc ?? status.balance_usdc ?? 0,
    totalPnl: m?.total_pnl ?? status.total_pnl ?? 0,
    positions: Array.isArray(m?.positions) ? m.positions.length : (m?.held_tokens ?? status.positions ?? 0),
    latency: m?.latency ?? status.latency ?? {},
    marketsTracked: m?.markets_tracked ?? status.markets_tracked ?? 0,
    ws: m?.ws ?? status.ws ?? {},
    lastError: lastError ?? null,
    errorCode: null,
    backendAvailable: true,
    walletAddress: accountState.walletAddress,
  };
}
