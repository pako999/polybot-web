/** Bot backend URL: POLYBOT_BACKEND_URL (preferred) or POLYBOT_INTERNAL_BASE_URL (legacy) */
const BOT_BACKEND_URL =
  process.env.POLYBOT_BACKEND_URL || process.env.POLYBOT_INTERNAL_BASE_URL;
const INTERNAL_API_TOKEN = process.env.POLYBOT_INTERNAL_API_TOKEN;

export type InternalBotErrorCode =
  | "BACKEND_CONFIG_MISSING"
  | "BACKEND_TOKEN_MISMATCH"
  | "BACKEND_UNAVAILABLE"
  | "BACKEND_REQUEST_FAILED";

export type InternalBotStartConfig = {
  min_market_volume: number;
  min_market_liquidity: number;
  paper_balance_usdc?: number;
  max_position_usdc?: number;
  max_exposure_usdc?: number;
  kelly_fraction?: number;
};

/** Backend status shape: metrics nested, started_at as Unix timestamp */
export type InternalBotStatus = {
  user_id?: string;
  run_id?: string;
  running?: boolean;
  status?: string;
  paper_mode?: boolean;
  uptime_min?: number;
  started_at?: number | string;
  stopped_at?: number;
  updated_at?: number;
  error?: string;
  failure_count?: number;
  mode?: string;
  metrics?: {
    status?: string;
    started_at?: number;
    paper_mode?: boolean;
    total_pnl?: number;
    balance_usdc?: number;
    held_tokens?: number;
    markets_tracked?: number;
    positions?: unknown[];
    recent_trades?: unknown[];
    strategy_stats?: Record<string, { trades?: number; pnl?: number }>;
    top_markets?: unknown[];
    spikes_detected?: number;
    latency?: { avg?: number; p50?: number; p95?: number; max?: number; n?: number };
    ws?: Record<string, unknown>;
  };
  /** Legacy flat fields (fallback) */
  balance_usdc?: number;
  total_pnl?: number;
  positions?: number;
  markets_tracked?: number;
  latency?: { avg?: number; p95?: number };
  ws?: { connected?: boolean };
  last_error?: string | null;
};

/** Backend trades shape: ts, strategy, action, token_id, price, size, response */
export type InternalBotTrade = {
  ts?: number;
  strategy?: string;
  action?: string;
  token_id?: string;
  price?: number;
  size?: number;
  reason?: string;
  response?: { status?: string; orderID?: string };
  paper_mode?: boolean;
  /** Legacy/alternate fields */
  id?: string;
  trade_id?: string;
  market?: string;
  market_name?: string;
  side?: string;
  pnl?: number;
  status?: string;
  created_at?: string;
  executed_at?: string;
  latency_ms?: number;
};

/** Backend positions shape: token_id, size, avg_price, last_price, updated_at, question, outcome */
export type InternalBotPosition = {
  token_id?: string;
  size?: number;
  avg_price?: number;
  last_price?: number;
  updated_at?: number;
  question?: string;
  outcome?: string;
  /** Legacy/alternate fields */
  id?: string;
  position_id?: string;
  market?: string;
  market_name?: string;
  side?: string;
  entry_price?: number;
  current_price?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  strategy?: string;
  status?: string;
  opened_at?: string;
};

/** Backend stats shape: strategy_stats, held_tokens, latency, ws, top_markets */
export type InternalBotStats = {
  user_id?: string;
  run_id?: string;
  status?: string;
  paper_mode?: boolean;
  total_pnl?: number;
  balance_usdc?: number;
  held_tokens?: number;
  markets_tracked?: number;
  spikes_detected?: number;
  strategy_stats?: Record<string, { trades?: number; pnl?: number }>;
  latency?: { avg?: number; p50?: number; p95?: number; max?: number; n?: number };
  ws?: { subscribed?: number; messages?: number };
  top_markets?: Array<{
    condition_id?: string;
    question?: string;
    volume?: number;
    liquidity?: number;
    token_count?: number;
  }>;
  /** Legacy fields */
  total_trades?: number;
  open_positions?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  win_rate?: number;
  fill_rate?: number;
};

function getMissingConfigMessage() {
  if (!BOT_BACKEND_URL) {
    return "Missing POLYBOT_BACKEND_URL or POLYBOT_INTERNAL_BASE_URL.";
  }
  if (!INTERNAL_API_TOKEN) {
    return "Missing POLYBOT_INTERNAL_API_TOKEN.";
  }
  return null;
}

async function internalBotRequest<TResponse>(
  path: string,
  options: { method: "GET" | "POST"; body?: unknown }
): Promise<
  | { ok: true; data: TResponse }
  | { ok: false; code: InternalBotErrorCode; message: string; upstreamStatus?: number }
> {
  const configError = getMissingConfigMessage();
  if (configError) {
    return { ok: false, code: "BACKEND_CONFIG_MISSING", message: configError };
  }

  const base = (BOT_BACKEND_URL as string).replace(/\/$/, "");
  const endpoint = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(endpoint, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INTERNAL_API_TOKEN}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    } & TResponse;

    if (!response.ok) {
      const code =
        response.status === 401 || response.status === 403
          ? "BACKEND_TOKEN_MISMATCH"
          : "BACKEND_REQUEST_FAILED";
      return {
        ok: false,
        code,
        message: payload.error || payload.message || `Internal bot API error (${response.status}).`,
        upstreamStatus: response.status,
      };
    }

    return { ok: true, data: payload as TResponse };
  } catch {
    return {
      ok: false,
      code: "BACKEND_UNAVAILABLE",
      message: "Unable to reach internal bot API.",
    };
  }
}

export async function startInternalBot(
  userId: string,
  paperMode: boolean,
  config: InternalBotStartConfig
) {
  return internalBotRequest<{ run_id?: string; status?: string; message?: string }>("/api/bot/start", {
    method: "POST",
    body: {
      user_id: userId,
      paper_mode: paperMode,
      config,
    },
  });
}

export async function stopInternalBot(userId: string) {
  return internalBotRequest<{ ok?: boolean; status?: string; message?: string }>("/api/bot/stop", {
    method: "POST",
    body: {
      user_id: userId,
    },
  });
}

export async function getInternalBotStatus(userId: string) {
  const query = `?user_id=${encodeURIComponent(userId)}`;
  return internalBotRequest<InternalBotStatus>(`/api/bot/status${query}`, {
    method: "GET",
  });
}

export async function getInternalBotTrades(userId: string) {
  const query = `?user_id=${encodeURIComponent(userId)}`;
  return internalBotRequest<{ trades?: InternalBotTrade[] } | InternalBotTrade[]>(`/api/bot/trades${query}`, {
    method: "GET",
  });
}

export async function getInternalBotPositions(userId: string) {
  const query = `?user_id=${encodeURIComponent(userId)}`;
  return internalBotRequest<{ positions?: InternalBotPosition[] } | InternalBotPosition[]>(`/api/bot/positions${query}`, {
    method: "GET",
  });
}

export async function getInternalBotStats(userId: string) {
  const query = `?user_id=${encodeURIComponent(userId)}`;
  return internalBotRequest<{ stats?: InternalBotStats } | InternalBotStats>(`/api/bot/stats${query}`, {
    method: "GET",
  });
}
