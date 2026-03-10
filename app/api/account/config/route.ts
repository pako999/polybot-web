import { NextRequest, NextResponse } from "next/server";
import {
  appendBotEventForUser,
  BOT_STRATEGY_IDS,
  DEFAULT_BOT_CONFIG,
  getAccountStateForUser,
  isLiveModeEligible,
  requireAuthenticatedUserId,
  updateBotConfigForUser,
  type BotStrategyId,
  type BotUserConfig,
} from "@/lib/server/account-state";
import { isCrossSiteRequest } from "@/lib/server/security";

type ConfigPayload = {
  paperTrade?: unknown;
  paperBalanceUsdc?: unknown;
  maxPositionUsdc?: unknown;
  maxExposureUsdc?: unknown;
  kellyFraction?: unknown;
  minMarketVolume?: unknown;
  minMarketLiquidity?: unknown;
  positionSizingMode?: unknown;
  enabledStrategies?: unknown;
};

function toPositiveNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
}

function toUnitInterval(value: unknown, fallback: number) {
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

function normalizeConfig(payload: ConfigPayload, current?: BotUserConfig): BotUserConfig {
  const c = current ?? DEFAULT_BOT_CONFIG;
  return {
    paperTrade: typeof payload.paperTrade === "boolean" ? payload.paperTrade : c.paperTrade,
    paperBalanceUsdc: toPositiveNumber(payload.paperBalanceUsdc, c.paperBalanceUsdc),
    maxPositionUsdc: toPositiveNumber(payload.maxPositionUsdc, c.maxPositionUsdc),
    maxExposureUsdc: toPositiveNumber(payload.maxExposureUsdc, c.maxExposureUsdc),
    kellyFraction: toUnitInterval(payload.kellyFraction, c.kellyFraction),
    minMarketVolume: toPositiveNumber(payload.minMarketVolume, c.minMarketVolume),
    minMarketLiquidity: toPositiveNumber(payload.minMarketLiquidity, c.minMarketLiquidity),
    positionSizingMode: payload.positionSizingMode === "manual" ? "manual" : c.positionSizingMode,
    enabledStrategies:
      payload.enabledStrategies !== undefined
        ? parseEnabledStrategies(payload.enabledStrategies)
        : (c.enabledStrategies ?? DEFAULT_BOT_CONFIG.enabledStrategies),
  };
}

export async function GET() {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const state = await getAccountStateForUser(userId);
  return NextResponse.json({
    config: state.botConfig,
    liveModeEligible: isLiveModeEligible(state),
    liveModeAcknowledgedAt: state.liveModeAcknowledgedAt,
  });
}

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  let payload: ConfigPayload;
  try {
    payload = (await req.json()) as ConfigPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", code: "INVALID_JSON" }, { status: 400 });
  }

  const currentState = await getAccountStateForUser(userId);
  const config = normalizeConfig(payload, currentState.botConfig);
  if (!config.paperTrade && !isLiveModeEligible(currentState)) {
    return NextResponse.json(
      { error: "Complete live mode checks before enabling live trading.", code: "LIVE_MODE_NOT_READY" },
      { status: 400 }
    );
  }

  const state = await updateBotConfigForUser(userId, config);
  await appendBotEventForUser(userId, {
    type: "config_saved",
    message: `Trading settings saved (${config.paperTrade ? "paper" : "live"} mode).`,
  });

  return NextResponse.json({
    message: "Bot config saved.",
    config: state.botConfig,
    liveModeEligible: isLiveModeEligible(state),
    liveModeAcknowledgedAt: state.liveModeAcknowledgedAt,
  });
}
