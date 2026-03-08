const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const WALLET_ADDRESS_KEY = "polybotWalletAddress";
let authTokenMemory: string | null = null;

type HttpMethod = "GET" | "POST";

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export type WalletChallengeRequest = {
  walletAddress: string;
};

export type WalletChallengeResponse = {
  nonce: string;
  message: string;
  expiresAt: string;
};

export type WalletVerifyRequest = {
  walletAddress: string;
  message: string;
  signature: string;
};

export type WalletVerifyResponse = {
  ok: boolean;
  authToken: string;
  user?: {
    id: string;
    walletAddress?: string;
  };
  walletLinked: boolean;
};

export type AccountConnectRequest = {
  signatureType: "eip191" | "siwe";
  funderAddress?: string;
};

export type AccountConnectResponse = {
  accountId: string;
  status: "active";
};

export type AccountDisconnectResponse = {
  ok: boolean;
};

export type BotConfig = {
  maxPositionUsdc: number;
  maxExposureUsdc: number;
  minArbProfit: number;
  kellyFraction: number;
  stopLossPct: number;
  minMarketVolume: number;
  minMarketLiquidity: number;
  paperTrade: boolean;
};

export type BotStartRequest = {
  config: BotConfig;
};

export type BotStartResponse = {
  runId: string;
  status: "starting" | "running";
};

export type BotStopResponse = {
  ok: boolean;
  status: "stopped";
};

export type BotStatusResponse = {
  running: boolean;
  startedAt?: string | null;
  paperMode?: boolean;
  balanceUsdc?: number;
  totalPnl?: number;
  positions?: number;
  latency?: {
    avg?: number;
    p95?: number;
  };
  marketsTracked?: number;
  ws?: {
    connected?: boolean;
  };
  walletAddress?: string | null;
  lastError?: string | null;
};

function buildApiUrl(path: string): string {
  if (!API_BASE_URL) return path;

  // Safety: ignore localhost API targets on production hosts.
  if (typeof window !== "undefined") {
    const isProdHost = !["localhost", "127.0.0.1"].includes(window.location.hostname);
    const isLocalApi =
      API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
    if (isProdHost && isLocalApi) {
      return path;
    }
  }

  const normalizedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  return `${normalizedBase}${path}`;
}

function getAuthToken(): string | null {
  return authTokenMemory;
}

function getWalletAddressCache(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(WALLET_ADDRESS_KEY);
}

function setWalletAddressCache(walletAddress: string | null) {
  if (typeof window === "undefined") return;
  if (!walletAddress) {
    window.localStorage.removeItem(WALLET_ADDRESS_KEY);
    return;
  }
  window.localStorage.setItem(WALLET_ADDRESS_KEY, walletAddress);
}

function setAuthToken(authToken: string) {
  authTokenMemory = authToken;
}

export function clearAuthSession() {
  authTokenMemory = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(WALLET_ADDRESS_KEY);
  }
}

export function getCachedWalletAddress() {
  return getWalletAddressCache();
}

async function requestJson<TResponse, TBody = unknown>(
  method: HttpMethod,
  path: string,
  body?: TBody,
  includeAuth = false
): Promise<TResponse> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const authToken = getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload & TResponse;
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Request failed.");
  }

  return payload as TResponse;
}

export async function postWalletChallenge(payload: WalletChallengeRequest) {
  return requestJson<WalletChallengeResponse, WalletChallengeRequest>(
    "POST",
    "/api/wallet/challenge",
    payload
  );
}

export async function postWalletVerify(payload: WalletVerifyRequest) {
  const response = await requestJson<WalletVerifyResponse, WalletVerifyRequest>(
    "POST",
    "/api/wallet/verify",
    payload
  );
  if (response.authToken) {
    setAuthToken(response.authToken);
  }
  setWalletAddressCache(payload.walletAddress);
  return response;
}

export async function postAccountConnect(payload: AccountConnectRequest) {
  return requestJson<AccountConnectResponse, AccountConnectRequest>(
    "POST",
    "/api/account/connect",
    payload,
    true
  );
}

export async function postAccountDisconnect() {
  const response = await requestJson<AccountDisconnectResponse>("POST", "/api/account/disconnect", undefined, true);
  clearAuthSession();
  return response;
}

export async function postBotStart(payload: BotStartRequest) {
  return requestJson<BotStartResponse, BotStartRequest>("POST", "/api/bot/start", payload, true);
}

export async function postBotStop() {
  return requestJson<BotStopResponse>("POST", "/api/bot/stop", undefined, true);
}

export async function getBotStatus() {
  return requestJson<BotStatusResponse>("GET", "/api/bot/status", undefined, true);
}
