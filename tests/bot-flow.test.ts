import { beforeEach, describe, expect, it, vi } from "vitest";

type BotEvent = {
  at: string;
  type: string;
  message: string;
};

type MockState = {
  walletAddress: string | null;
  chainId: string | null;
  botRunning: boolean;
  botLifecycleState: "idle" | "starting" | "running" | "stopping" | "stopped" | "error";
  liveModeAcknowledgedAt: string | null;
  botConfig: {
    paperTrade: boolean;
    paperBalanceUsdc: number;
    maxPositionUsdc: number;
    maxExposureUsdc: number;
    kellyFraction: number;
    minMarketVolume: number;
    minMarketLiquidity: number;
    positionSizingMode: "auto" | "manual";
  };
  botEvents: BotEvent[];
};

const defaultState = (): MockState => ({
  walletAddress: null,
  chainId: null,
  botRunning: false,
  botLifecycleState: "idle",
  liveModeAcknowledgedAt: null,
  botConfig: {
    paperTrade: true,
    paperBalanceUsdc: 1000,
    maxPositionUsdc: 100,
    maxExposureUsdc: 1000,
    kellyFraction: 0.2,
    minMarketVolume: 1000,
    minMarketLiquidity: 1000,
    positionSizingMode: "auto",
  },
  botEvents: [],
});

let state: MockState = defaultState();
let backendStatus = {
  running: false,
  started_at: null as string | null,
  paper_mode: true,
  balance_usdc: 1000,
  total_pnl: 0,
  positions: 0,
  latency: {},
  markets_tracked: 0,
  ws: { connected: true },
  last_error: null as string | null,
};
let backendTrades = [
  {
    id: "trade_1",
    market_name: "BTC above $120k?",
    side: "YES",
    action: "BUY",
    price: 0.62,
    size: 150,
    pnl: 12.5,
    strategy: "momentum",
    status: "filled",
    executed_at: "2026-03-09T08:00:00.000Z",
    latency_ms: 44,
  },
];
let backendPositions = [
  {
    id: "position_1",
    market_name: "BTC above $120k?",
    side: "YES",
    size: 150,
    entry_price: 0.62,
    current_price: 0.67,
    unrealized_pnl: 7.5,
    realized_pnl: 0,
    strategy: "momentum",
    status: "open",
    opened_at: "2026-03-09T07:00:00.000Z",
    updated_at: "2026-03-09T08:00:00.000Z",
  },
];
let backendStats = {
  total_trades: 12,
  open_positions: 1,
  realized_pnl: 22.4,
  unrealized_pnl: 7.5,
  win_rate: 75,
  fill_rate: 98,
};

vi.mock("@/lib/server/security", () => ({
  isCrossSiteRequest: vi.fn(() => false),
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 99,
    resetAt: Date.now() + 60000,
  })),
}));

vi.mock("@/lib/server/account-state", () => ({
  requireAuthenticatedUserId: vi.fn(async () => ({ userId: "user_test_123", error: null })),
  isValidWalletAddress: vi.fn((walletAddress: string) => /^0x[a-fA-F0-9]{40}$/.test(walletAddress)),
  getAccountStateForUser: vi.fn(async () => state),
  connectWalletForUser: vi.fn(async (_userId: string, walletAddress: string, chainId: string | null) => {
    state = { ...state, walletAddress: walletAddress.toLowerCase(), chainId };
    return state;
  }),
  disconnectWalletForUser: vi.fn(async () => {
    state = { ...state, walletAddress: null, chainId: null, botRunning: false, botLifecycleState: "stopped" };
    return state;
  }),
  updateBotConfigForUser: vi.fn(async (_userId: string, botConfig: MockState["botConfig"]) => {
    state = { ...state, botConfig };
    return state;
  }),
  setBotLifecycleStateForUser: vi.fn(
    async (_userId: string, botLifecycleState: MockState["botLifecycleState"]) => {
      state = { ...state, botLifecycleState, botRunning: botLifecycleState === "running" };
      return state;
    }
  ),
  appendBotEventForUser: vi.fn(async (_userId: string, event: Omit<BotEvent, "at"> & { at?: string }) => {
    state = {
      ...state,
      botEvents: [
        {
          at: event.at || new Date().toISOString(),
          type: event.type,
          message: event.message,
        },
        ...state.botEvents,
      ].slice(0, 20),
    };
    return state;
  }),
  isLiveModeEligible: vi.fn((currentState: MockState) => Boolean(currentState.walletAddress && currentState.liveModeAcknowledgedAt)),
}));

vi.mock("@/lib/server/bot-backend", () => ({
  startInternalBot: vi.fn(async (_userId: string, paperMode: boolean) => {
    backendStatus = {
      ...backendStatus,
      running: true,
      started_at: new Date().toISOString(),
      paper_mode: paperMode,
      last_error: null,
    };
    return { ok: true as const, data: { run_id: "run_123", status: "running", message: "started" } };
  }),
  stopInternalBot: vi.fn(async () => {
    backendStatus = {
      ...backendStatus,
      running: false,
      last_error: null,
    };
    return { ok: true as const, data: { ok: true, status: "stopped", message: "stopped" } };
  }),
  getInternalBotStatus: vi.fn(async () => ({ ok: true as const, data: backendStatus })),
  getInternalBotTrades: vi.fn(async () => ({ ok: true as const, data: { trades: backendTrades } })),
  getInternalBotPositions: vi.fn(async () => ({ ok: true as const, data: { positions: backendPositions } })),
  getInternalBotStats: vi.fn(async () => ({ ok: true as const, data: { stats: backendStats } })),
}));

function makeJsonRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("bot route integration flow", () => {
  beforeEach(() => {
    state = defaultState();
    backendStatus = {
      running: false,
      started_at: null,
      paper_mode: true,
      balance_usdc: 1000,
      total_pnl: 0,
      positions: 0,
      latency: {},
      markets_tracked: 0,
      ws: { connected: true },
      last_error: null,
    };
    backendTrades = [
      {
        id: "trade_1",
        market_name: "BTC above $120k?",
        side: "YES",
        action: "BUY",
        price: 0.62,
        size: 150,
        pnl: 12.5,
        strategy: "momentum",
        status: "filled",
        executed_at: "2026-03-09T08:00:00.000Z",
        latency_ms: 44,
      },
    ];
    backendPositions = [
      {
        id: "position_1",
        market_name: "BTC above $120k?",
        side: "YES",
        size: 150,
        entry_price: 0.62,
        current_price: 0.67,
        unrealized_pnl: 7.5,
        realized_pnl: 0,
        strategy: "momentum",
        status: "open",
        opened_at: "2026-03-09T07:00:00.000Z",
        updated_at: "2026-03-09T08:00:00.000Z",
      },
    ];
    backendStats = {
      total_trades: 12,
      open_positions: 1,
      realized_pnl: 22.4,
      unrealized_pnl: 7.5,
      win_rate: 75,
      fill_rate: 98,
    };
    vi.resetModules();
  });

  it("supports connect -> start paper bot -> status -> stop", async () => {
    const connectRoute = await import("@/app/api/account/connect/route");
    const startRoute = await import("@/app/api/bot/start/route");
    const statusRoute = await import("@/app/api/bot/status/route");
    const stopRoute = await import("@/app/api/bot/stop/route");

    const walletAddress = "0x1111111111111111111111111111111111111111";

    const connectResponse = await connectRoute.POST(
      makeJsonRequest("http://localhost/api/account/connect", "POST", {
        walletAddress,
        chainId: "0x1",
      }) as never
    );
    expect(connectResponse.status).toBe(200);
    const connectJson = await connectResponse.json();
    expect(connectJson.connected).toBe(true);
    expect(state.walletAddress).toBe(walletAddress.toLowerCase());

    const startResponse = await startRoute.POST(
      makeJsonRequest("http://localhost/api/bot/start", "POST", {
        config: {
          paperTrade: true,
          paperBalanceUsdc: 2500,
          maxPositionUsdc: 150,
          maxExposureUsdc: 500,
          kellyFraction: 0.15,
        },
      }) as never
    );
    expect(startResponse.status).toBe(200);
    const startJson = await startResponse.json();
    expect(startJson.lifecycleState).toBe("running");
    expect(startJson.botRunning).toBe(true);

    const statusResponse = await statusRoute.GET();
    expect(statusResponse.status).toBe(200);
    const statusJson = await statusResponse.json();
    expect(statusJson.running).toBe(true);
    expect(statusJson.lifecycleState).toBe("running");
    expect(statusJson.paperMode).toBe(true);

    const stopResponse = await stopRoute.POST(
      makeJsonRequest("http://localhost/api/bot/stop", "POST") as never
    );
    expect(stopResponse.status).toBe(200);
    const stopJson = await stopResponse.json();
    expect(stopJson.lifecycleState).toBe("stopped");
    expect(stopJson.botRunning).toBe(false);
  });

  it("blocks live mode start when onboarding checks are incomplete", async () => {
    const startRoute = await import("@/app/api/bot/start/route");

    const response = await startRoute.POST(
      makeJsonRequest("http://localhost/api/bot/start", "POST", {
        config: {
          paperTrade: false,
        },
      }) as never
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("LIVE_MODE_NOT_READY");
  });

  it("surfaces backend outage as error state in status", async () => {
    state = {
      ...state,
      botLifecycleState: "running",
      botRunning: true,
    };

    const botBackend = await import("@/lib/server/bot-backend");
    vi.mocked(botBackend.getInternalBotStatus).mockResolvedValueOnce({
      ok: false,
      code: "BACKEND_UNAVAILABLE",
      message: "Unable to reach internal bot API.",
    });

    const statusRoute = await import("@/app/api/bot/status/route");
    const response = await statusRoute.GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.lifecycleState).toBe("error");
    expect(json.errorCode).toBe("BACKEND_UNAVAILABLE");
    expect(json.backendAvailable).toBe(false);
  });

  it("returns normalized trades, positions, and stats when backend detail endpoints exist", async () => {
    const tradesRoute = await import("@/app/api/bot/trades/route");
    const positionsRoute = await import("@/app/api/bot/positions/route");
    const statsRoute = await import("@/app/api/bot/stats/route");

    const tradesResponse = await tradesRoute.GET();
    expect(tradesResponse.status).toBe(200);
    const tradesJson = await tradesResponse.json();
    expect(tradesJson.trades).toHaveLength(1);
    expect(tradesJson.trades[0]).toMatchObject({
      id: "trade_1",
      market: "BTC above $120k?",
      action: "BUY",
      latencyMs: 44,
    });

    const positionsResponse = await positionsRoute.GET();
    expect(positionsResponse.status).toBe(200);
    const positionsJson = await positionsResponse.json();
    expect(positionsJson.positions).toHaveLength(1);
    expect(positionsJson.positions[0]).toMatchObject({
      id: "position_1",
      market: "BTC above $120k?",
      entryPrice: 0.62,
      unrealizedPnl: 7.5,
    });

    const statsResponse = await statsRoute.GET();
    expect(statsResponse.status).toBe(200);
    const statsJson = await statsResponse.json();
    expect(statsJson.stats).toMatchObject({
      totalTrades: 12,
      openPositions: 1,
      winRate: 75,
      fillRate: 98,
    });
  });
});
