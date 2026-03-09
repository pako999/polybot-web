const INTERNAL_BASE_URL = process.env.POLYBOT_INTERNAL_BASE_URL;
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

type InternalBotStatus = {
  running?: boolean;
  started_at?: string;
  paper_mode?: boolean;
  balance_usdc?: number;
  total_pnl?: number;
  positions?: number;
  latency?: {
    avg?: number;
    p95?: number;
  };
  markets_tracked?: number;
  ws?: {
    connected?: boolean;
  };
  last_error?: string | null;
};

export type InternalBotTrade = {
  id?: string;
  trade_id?: string;
  market?: string;
  market_name?: string;
  side?: string;
  action?: string;
  price?: number;
  size?: number;
  pnl?: number;
  strategy?: string;
  status?: string;
  created_at?: string;
  executed_at?: string;
  latency_ms?: number;
};

export type InternalBotPosition = {
  id?: string;
  position_id?: string;
  market?: string;
  market_name?: string;
  side?: string;
  size?: number;
  entry_price?: number;
  current_price?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  strategy?: string;
  status?: string;
  opened_at?: string;
  updated_at?: string;
};

export type InternalBotStats = {
  total_trades?: number;
  open_positions?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  win_rate?: number;
  fill_rate?: number;
};

function getMissingConfigMessage() {
  if (!INTERNAL_BASE_URL) {
    return "Missing POLYBOT_INTERNAL_BASE_URL.";
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

  const endpoint = `${INTERNAL_BASE_URL}${path}`;

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
