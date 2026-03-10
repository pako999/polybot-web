import { auth, clerkClient } from "@clerk/nextjs/server";

export type PositionSizingMode = "auto" | "manual";
export type BotLifecycleState = "idle" | "starting" | "running" | "stopping" | "stopped" | "error";
export type BotEventType =
  | "wallet_connected"
  | "wallet_disconnected"
  | "config_saved"
  | "live_mode_acknowledged"
  | "bot_start_requested"
  | "bot_stop_requested"
  | "bot_error";

export type BotEvent = {
  at: string;
  type: BotEventType;
  message: string;
};

/** Strategy IDs that match the bot backend (polybot-trading) */
export const BOT_STRATEGY_IDS = [
  "arbitrage",
  "convergence",
  "multi_arb",
  "liquidity_snipe",
  "hedging",
  "momentum",
  "news_driven",
] as const;

export type BotStrategyId = (typeof BOT_STRATEGY_IDS)[number];

export type BotUserConfig = {
  paperTrade: boolean;
  paperBalanceUsdc: number;
  maxPositionUsdc: number;
  maxExposureUsdc: number;
  kellyFraction: number;
  minMarketVolume: number;
  minMarketLiquidity: number;
  positionSizingMode: PositionSizingMode;
  /** Enabled strategy IDs; must match bot backend. Default: all enabled. */
  enabledStrategies?: BotStrategyId[];
};

export type AccountState = {
  walletAddress: string | null;
  chainId: string | null;
  botRunning: boolean;
  botLifecycleState: BotLifecycleState;
  liveModeAcknowledgedAt: string | null;
  botConfig: BotUserConfig;
  botEvents: BotEvent[];
};

type StoredAccountState = {
  walletAddress?: unknown;
  chainId?: unknown;
  botRunning?: unknown;
  botLifecycleState?: unknown;
  liveModeAcknowledgedAt?: unknown;
  botConfig?: unknown;
  botEvents?: unknown;
};

const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const DEFAULT_BOT_CONFIG: BotUserConfig = {
  paperTrade: true,
  paperBalanceUsdc: 1000,
  maxPositionUsdc: 100,
  maxExposureUsdc: 1000,
  kellyFraction: 0.2,
  minMarketVolume: 1000,
  minMarketLiquidity: 1000,
  positionSizingMode: "auto",
  enabledStrategies: [...BOT_STRATEGY_IDS],
};

const DEFAULT_ACCOUNT_STATE: AccountState = {
  walletAddress: null,
  chainId: null,
  botRunning: false,
  botLifecycleState: "idle",
  liveModeAcknowledgedAt: null,
  botConfig: DEFAULT_BOT_CONFIG,
  botEvents: [],
};

function asPositiveNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
}

function asUnitInterval(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    return fallback;
  }
  return value;
}

function parseEnabledStrategies(value: unknown): BotStrategyId[] {
  if (!Array.isArray(value)) return DEFAULT_BOT_CONFIG.enabledStrategies ?? [...BOT_STRATEGY_IDS];
  const valid = value.filter(
    (v): v is BotStrategyId => typeof v === "string" && BOT_STRATEGY_IDS.includes(v as BotStrategyId)
  );
  return valid.length > 0 ? valid : DEFAULT_BOT_CONFIG.enabledStrategies ?? [...BOT_STRATEGY_IDS];
}

function parseBotConfig(value: unknown): BotUserConfig {
  if (!value || typeof value !== "object") {
    return DEFAULT_BOT_CONFIG;
  }

  const candidate = value as Record<string, unknown>;
  const positionSizingMode =
    candidate.positionSizingMode === "manual" ? "manual" : "auto";

  return {
    paperTrade: typeof candidate.paperTrade === "boolean" ? candidate.paperTrade : DEFAULT_BOT_CONFIG.paperTrade,
    paperBalanceUsdc: asPositiveNumber(candidate.paperBalanceUsdc, DEFAULT_BOT_CONFIG.paperBalanceUsdc),
    maxPositionUsdc: asPositiveNumber(candidate.maxPositionUsdc, DEFAULT_BOT_CONFIG.maxPositionUsdc),
    maxExposureUsdc: asPositiveNumber(candidate.maxExposureUsdc, DEFAULT_BOT_CONFIG.maxExposureUsdc),
    kellyFraction: asUnitInterval(candidate.kellyFraction, DEFAULT_BOT_CONFIG.kellyFraction),
    minMarketVolume: asPositiveNumber(candidate.minMarketVolume, DEFAULT_BOT_CONFIG.minMarketVolume),
    minMarketLiquidity: asPositiveNumber(candidate.minMarketLiquidity, DEFAULT_BOT_CONFIG.minMarketLiquidity),
    positionSizingMode,
    enabledStrategies: parseEnabledStrategies(candidate.enabledStrategies),
  };
}

function parseBotEvents(value: unknown): BotEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      if (
        typeof candidate.at !== "string" ||
        typeof candidate.type !== "string" ||
        typeof candidate.message !== "string"
      ) {
        return null;
      }
      return {
        at: candidate.at,
        type: candidate.type as BotEventType,
        message: candidate.message.slice(0, 300),
      };
    })
    .filter((item): item is BotEvent => Boolean(item))
    .slice(0, 20);
}

function parseStoredState(value: unknown): AccountState {
  if (!value || typeof value !== "object") {
    return DEFAULT_ACCOUNT_STATE;
  }

  const candidate = value as StoredAccountState;
  return {
    walletAddress:
      typeof candidate.walletAddress === "string" && WALLET_ADDRESS_REGEX.test(candidate.walletAddress)
        ? candidate.walletAddress
        : null,
    chainId: typeof candidate.chainId === "string" ? candidate.chainId : null,
    botRunning: typeof candidate.botRunning === "boolean" ? candidate.botRunning : false,
    botLifecycleState:
      candidate.botLifecycleState === "starting" ||
      candidate.botLifecycleState === "running" ||
      candidate.botLifecycleState === "stopping" ||
      candidate.botLifecycleState === "stopped" ||
      candidate.botLifecycleState === "error"
        ? candidate.botLifecycleState
        : "idle",
    liveModeAcknowledgedAt:
      typeof candidate.liveModeAcknowledgedAt === "string" ? candidate.liveModeAcknowledgedAt : null,
    botConfig: parseBotConfig(candidate.botConfig),
    botEvents: parseBotEvents(candidate.botEvents),
  };
}

function buildMetadataPatch(nextState: AccountState) {
  return {
    walletAddress: nextState.walletAddress,
    chainId: nextState.chainId,
    botRunning: nextState.botRunning,
    botLifecycleState: nextState.botLifecycleState,
    liveModeAcknowledgedAt: nextState.liveModeAcknowledgedAt,
    botConfig: nextState.botConfig,
    botEvents: nextState.botEvents.slice(0, 20),
    updatedAt: new Date().toISOString(),
  };
}

export function isValidWalletAddress(walletAddress: string): boolean {
  return WALLET_ADDRESS_REGEX.test(walletAddress);
}

export async function requireAuthenticatedUserId() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, error: "Unauthorized" as const };
  }
  return { userId, error: null };
}

export async function getAccountStateForUser(userId: string): Promise<AccountState> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return parseStoredState(user.privateMetadata?.polybotAccount);
}

export async function updateAccountStateForUser(userId: string, nextState: AccountState): Promise<AccountState> {
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    privateMetadata: {
      polybotAccount: buildMetadataPatch(nextState),
    },
  });

  return nextState;
}

export async function connectWalletForUser(userId: string, walletAddress: string, chainId: string | null) {
  const normalizedAddress = walletAddress.toLowerCase();
  const currentState = await getAccountStateForUser(userId);
  const nextState: AccountState = {
    ...currentState,
    walletAddress: normalizedAddress,
    chainId,
  };
  return updateAccountStateForUser(userId, nextState);
}

export async function disconnectWalletForUser(userId: string) {
  const currentState = await getAccountStateForUser(userId);
  return updateAccountStateForUser(userId, {
    walletAddress: null,
    chainId: null,
    botRunning: false,
    botLifecycleState: "stopped",
    liveModeAcknowledgedAt: currentState.liveModeAcknowledgedAt,
    botConfig: DEFAULT_BOT_CONFIG,
    botEvents: currentState.botEvents,
  });
}

export async function setBotRunningForUser(userId: string, running: boolean) {
  const currentState = await getAccountStateForUser(userId);
  // Wallet required only for live trading; paper mode can run without wallet
  return updateAccountStateForUser(userId, {
    ...currentState,
    botRunning: running,
    botLifecycleState: running ? "running" : "stopped",
  });
}

export async function updateBotConfigForUser(userId: string, botConfig: BotUserConfig) {
  const currentState = await getAccountStateForUser(userId);
  return updateAccountStateForUser(userId, {
    ...currentState,
    botConfig,
  });
}

export async function setBotLifecycleStateForUser(userId: string, botLifecycleState: BotLifecycleState) {
  const currentState = await getAccountStateForUser(userId);
  return updateAccountStateForUser(userId, {
    ...currentState,
    botRunning: botLifecycleState === "running",
    botLifecycleState,
  });
}

export function isLiveModeEligible(state: AccountState) {
  return Boolean(state.walletAddress && state.liveModeAcknowledgedAt);
}

export async function acknowledgeLiveModeForUser(userId: string) {
  const currentState = await getAccountStateForUser(userId);
  return updateAccountStateForUser(userId, {
    ...currentState,
    liveModeAcknowledgedAt: new Date().toISOString(),
  });
}

export async function appendBotEventForUser(
  userId: string,
  event: Omit<BotEvent, "at"> & { at?: string }
) {
  const currentState = await getAccountStateForUser(userId);
  const nextEvent: BotEvent = {
    at: event.at || new Date().toISOString(),
    type: event.type,
    message: event.message,
  };
  return updateAccountStateForUser(userId, {
    ...currentState,
    botEvents: [nextEvent, ...currentState.botEvents].slice(0, 20),
  });
}
