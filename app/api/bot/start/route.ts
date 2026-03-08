import { NextRequest, NextResponse } from "next/server";
import {
  appendBotEventForUser,
  getAccountStateForUser,
  isLiveModeEligible,
  requireAuthenticatedUserId,
  setBotLifecycleStateForUser,
  updateBotConfigForUser,
} from "@/lib/server/account-state";
import { startInternalBot, type InternalBotStartConfig } from "@/lib/server/bot-backend";
import { isCrossSiteRequest } from "@/lib/server/security";
import { checkRateLimit } from "@/lib/server/rate-limit";

type StartPayload = {
  config?: {
    minMarketVolume?: unknown;
    minMarketLiquidity?: unknown;
    paperTrade?: unknown;
    paperBalanceUsdc?: unknown;
    maxPositionUsdc?: unknown;
    maxExposureUsdc?: unknown;
    kellyFraction?: unknown;
    positionSizingMode?: unknown;
  };
};

const DEFAULT_START_CONFIG: InternalBotStartConfig = {
  min_market_volume: 1_000_000_000,
  min_market_liquidity: 1_000_000_000,
};

function toPositiveNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
}

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const rate = await checkRateLimit(`bot_start:${userId}`, 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many start requests. Please wait.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const currentState = await getAccountStateForUser(userId);
  const savedConfig = currentState.botConfig;

  let payload: StartPayload = {};
  try {
    payload = (await req.json()) as StartPayload;
  } catch {
    // Ignore empty/invalid JSON and use defaults.
  }

  const mappedConfig: InternalBotStartConfig = {
    min_market_volume: toPositiveNumber(
      payload.config?.minMarketVolume,
      savedConfig.minMarketVolume ?? DEFAULT_START_CONFIG.min_market_volume
    ),
    min_market_liquidity: toPositiveNumber(
      payload.config?.minMarketLiquidity,
      savedConfig.minMarketLiquidity ?? DEFAULT_START_CONFIG.min_market_liquidity
    ),
    paper_balance_usdc: toPositiveNumber(payload.config?.paperBalanceUsdc, savedConfig.paperBalanceUsdc),
    max_position_usdc: toPositiveNumber(payload.config?.maxPositionUsdc, savedConfig.maxPositionUsdc),
    max_exposure_usdc: toPositiveNumber(payload.config?.maxExposureUsdc, savedConfig.maxExposureUsdc),
    kelly_fraction: (() => {
      const v = payload.config?.kellyFraction;
      if (typeof v === "number" && v >= 0 && v <= 1) return v;
      return savedConfig.kellyFraction;
    })(),
  };

  const paperMode =
    typeof payload.config?.paperTrade === "boolean" ? payload.config.paperTrade : savedConfig.paperTrade;
  const positionSizingMode =
    payload.config?.positionSizingMode === "manual" ? "manual" : savedConfig.positionSizingMode;

  await updateBotConfigForUser(userId, {
    ...savedConfig,
    paperTrade: paperMode,
    paperBalanceUsdc: mappedConfig.paper_balance_usdc ?? savedConfig.paperBalanceUsdc,
    maxPositionUsdc: mappedConfig.max_position_usdc ?? savedConfig.maxPositionUsdc,
    maxExposureUsdc: mappedConfig.max_exposure_usdc ?? savedConfig.maxExposureUsdc,
    kellyFraction: mappedConfig.kelly_fraction ?? savedConfig.kellyFraction,
    minMarketVolume: mappedConfig.min_market_volume,
    minMarketLiquidity: mappedConfig.min_market_liquidity,
    positionSizingMode,
  });

  // Require wallet for live trading; allow paper mode without wallet for demo
  if (!paperMode && !isLiveModeEligible(currentState)) {
    return NextResponse.json(
      { error: "Complete live mode checks before starting live trading.", code: "LIVE_MODE_NOT_READY" },
      { status: 400 }
    );
  }

  const backendResult = await startInternalBot(userId, paperMode, mappedConfig);
  if (!backendResult.ok) {
    await setBotLifecycleStateForUser(userId, "error");
    await appendBotEventForUser(userId, {
      type: "bot_error",
      message: `Bot start failed: ${backendResult.message}`,
    });
    return NextResponse.json(
      { error: backendResult.message, code: backendResult.code },
      { status: 502 }
    );
  }

  const state = await setBotLifecycleStateForUser(
    userId,
    backendResult.data.status === "running" ? "running" : "starting"
  );
  await appendBotEventForUser(userId, {
    type: "bot_start_requested",
    message: `Bot start requested (${paperMode ? "paper" : "live"} mode).`,
  });
  console.info("[security-audit] bot_start_requested", {
    userId,
    walletAddress: state.walletAddress,
  });
  return NextResponse.json({
    message: backendResult.data.message || "Bot start request sent successfully.",
    runId: backendResult.data.run_id || null,
    status: backendResult.data.status || "starting",
    botRunning: state.botRunning,
    lifecycleState: state.botLifecycleState,
    walletAddress: state.walletAddress,
  });
}
