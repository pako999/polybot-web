import { NextRequest, NextResponse } from "next/server";
import {
  getAccountStateForUser,
  requireAuthenticatedUserId,
  setBotRunningForUser,
} from "@/lib/server/account-state";
import { startInternalBot, type InternalBotStartConfig } from "@/lib/server/bot-backend";
import { isCrossSiteRequest } from "@/lib/server/security";
import { checkRateLimit } from "@/lib/server/rate-limit";

type StartPayload = {
  config?: {
    minMarketVolume?: unknown;
    minMarketLiquidity?: unknown;
    paperTrade?: unknown;
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
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const rate = await checkRateLimit(`bot_start:${userId}`, 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many start requests. Please wait." }, { status: 429 });
  }

  const currentState = await getAccountStateForUser(userId);
  if (!currentState.walletAddress) {
    return NextResponse.json(
      { error: "Connect a wallet before starting the bot." },
      { status: 400 }
    );
  }

  let payload: StartPayload = {};
  try {
    payload = (await req.json()) as StartPayload;
  } catch {
    // Ignore empty/invalid JSON and use defaults.
  }

  const mappedConfig: InternalBotStartConfig = {
    min_market_volume: toPositiveNumber(
      payload.config?.minMarketVolume,
      DEFAULT_START_CONFIG.min_market_volume
    ),
    min_market_liquidity: toPositiveNumber(
      payload.config?.minMarketLiquidity,
      DEFAULT_START_CONFIG.min_market_liquidity
    ),
  };

  const paperMode =
    typeof payload.config?.paperTrade === "boolean" ? payload.config.paperTrade : true;

  const backendResult = await startInternalBot(userId, paperMode, mappedConfig);
  if (!backendResult.ok) {
    return NextResponse.json({ error: backendResult.message }, { status: 502 });
  }

  const state = await setBotRunningForUser(userId, true);
  console.info("[security-audit] bot_start_requested", {
    userId,
    walletAddress: state.walletAddress,
  });
  return NextResponse.json({
    message: backendResult.data.message || "Bot start request sent successfully.",
    runId: backendResult.data.run_id || null,
    status: backendResult.data.status || "starting",
    botRunning: state.botRunning,
    walletAddress: state.walletAddress,
  });
}
