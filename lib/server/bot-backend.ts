const INTERNAL_BASE_URL = process.env.POLYBOT_INTERNAL_BASE_URL;
const INTERNAL_API_TOKEN = process.env.POLYBOT_INTERNAL_API_TOKEN;

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
): Promise<{ ok: true; data: TResponse } | { ok: false; message: string }> {
  const configError = getMissingConfigMessage();
  if (configError) {
    return { ok: false, message: configError };
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
      return {
        ok: false,
        message: payload.error || payload.message || `Internal bot API error (${response.status}).`,
      };
    }

    return { ok: true, data: payload as TResponse };
  } catch {
    return {
      ok: false,
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
