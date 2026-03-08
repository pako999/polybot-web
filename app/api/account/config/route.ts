import { NextRequest, NextResponse } from "next/server";
import {
  appendBotEventForUser,
  DEFAULT_BOT_CONFIG,
  getAccountStateForUser,
  isLiveModeEligible,
  requireAuthenticatedUserId,
  updateBotConfigForUser,
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

function normalizeConfig(payload: ConfigPayload): BotUserConfig {
  return {
    paperTrade: typeof payload.paperTrade === "boolean" ? payload.paperTrade : DEFAULT_BOT_CONFIG.paperTrade,
    paperBalanceUsdc: toPositiveNumber(payload.paperBalanceUsdc, DEFAULT_BOT_CONFIG.paperBalanceUsdc),
    maxPositionUsdc: toPositiveNumber(payload.maxPositionUsdc, DEFAULT_BOT_CONFIG.maxPositionUsdc),
    maxExposureUsdc: toPositiveNumber(payload.maxExposureUsdc, DEFAULT_BOT_CONFIG.maxExposureUsdc),
    kellyFraction: toUnitInterval(payload.kellyFraction, DEFAULT_BOT_CONFIG.kellyFraction),
    minMarketVolume: toPositiveNumber(payload.minMarketVolume, DEFAULT_BOT_CONFIG.minMarketVolume),
    minMarketLiquidity: toPositiveNumber(payload.minMarketLiquidity, DEFAULT_BOT_CONFIG.minMarketLiquidity),
    positionSizingMode: payload.positionSizingMode === "manual" ? "manual" : "auto",
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

  const config = normalizeConfig(payload);
  const currentState = await getAccountStateForUser(userId);
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
