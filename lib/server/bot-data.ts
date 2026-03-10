import type { InternalBotPosition, InternalBotStats, InternalBotTrade } from "@/lib/server/bot-backend";

export type BotTradeResponseItem = {
  id: string;
  market: string;
  side: string;
  action: string;
  price: number | null;
  size: number | null;
  pnl: number | null;
  strategy: string | null;
  status: string | null;
  timestamp: string | null;
  latencyMs: number | null;
};

export type BotPositionResponseItem = {
  id: string;
  market: string;
  side: string;
  size: number | null;
  entryPrice: number | null;
  currentPrice: number | null;
  realizedPnl: number | null;
  unrealizedPnl: number | null;
  strategy: string | null;
  status: string | null;
  openedAt: string | null;
  updatedAt: string | null;
  /** Human-readable: market question (e.g. "Will X happen?") */
  question: string | null;
  /** Outcome: YES or No */
  outcome: string | null;
};

export type BotStatsResponseData = {
  totalTrades: number | null;
  openPositions: number | null;
  realizedPnl: number | null;
  unrealizedPnl: number | null;
  winRate: number | null;
  fillRate: number | null;
};

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function tsToIso(ts: number | undefined): string | null {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return null;
  return new Date(ts * 1000).toISOString();
}

export function normalizeTrades(value: { trades?: InternalBotTrade[] } | InternalBotTrade[] | undefined) {
  const items = Array.isArray(value) ? value : value?.trades;
  if (!Array.isArray(items)) {
    return [] as BotTradeResponseItem[];
  }

  return items.map((trade, index) => ({
    id: asString(trade.id) || asString(trade.trade_id) || asString(trade.token_id) || `trade-${index}`,
    market: asString(trade.market) || asString(trade.market_name) || asString(trade.token_id) || "Unknown market",
    side: asString(trade.side) || (trade.action === "BUY" ? "long" : trade.action === "SELL" ? "short" : "n/a"),
    action: asString(trade.action) || "n/a",
    price: asNumber(trade.price),
    size: asNumber(trade.size),
    pnl: asNumber(trade.pnl),
    strategy: asString(trade.strategy),
    status: asString(trade.status) || (trade.response ? asString(trade.response.status) : null),
    timestamp: tsToIso(trade.ts) || asString(trade.executed_at) || asString(trade.created_at),
    latencyMs: asNumber(trade.latency_ms),
  }));
}

export function normalizePositions(
  value: { positions?: InternalBotPosition[] } | InternalBotPosition[] | undefined
) {
  const items = Array.isArray(value) ? value : value?.positions;
  if (!Array.isArray(items)) {
    return [] as BotPositionResponseItem[];
  }

  return items.map((position, index) => {
    const size = asNumber(position.size);
    const side = asString(position.side) || (size != null && size > 0 ? "long" : "short");
    const entryPrice = asNumber(position.avg_price) ?? asNumber(position.entry_price);
    const currentPrice = asNumber(position.last_price) ?? asNumber(position.current_price);
    const updatedAt =
      tsToIso(position.updated_at) || asString(position.updated_at);
    return {
      id: asString(position.id) || asString(position.position_id) || asString(position.token_id) || `position-${index}`,
      market: asString(position.market) || asString(position.market_name) || asString(position.token_id) || "Unknown market",
      side,
      size,
      entryPrice,
      currentPrice,
      realizedPnl: asNumber(position.realized_pnl),
      unrealizedPnl:
        asNumber(position.unrealized_pnl) ??
        (entryPrice != null && currentPrice != null && size != null
          ? (currentPrice - entryPrice) * size
          : null),
      strategy: asString(position.strategy),
      status: asString(position.status),
      openedAt: asString(position.opened_at),
      updatedAt,
      question: asString(position.question),
      outcome: asString(position.outcome),
    };
  });
}

export function normalizeStats(value: { stats?: InternalBotStats } | InternalBotStats | undefined): BotStatsResponseData {
  let stats: InternalBotStats | undefined;
  if (value && typeof value === "object" && "stats" in value) {
    stats = value.stats;
  } else {
    stats = value as InternalBotStats | undefined;
  }
  const totalTrades =
    asNumber(stats?.total_trades) ??
    (stats?.strategy_stats
      ? Object.values(stats.strategy_stats).reduce((sum, s) => sum + (s?.trades ?? 0), 0) || null
      : null);
  return {
    totalTrades,
    openPositions: asNumber(stats?.open_positions) ?? asNumber(stats?.held_tokens),
    realizedPnl: asNumber(stats?.realized_pnl) ?? asNumber(stats?.total_pnl),
    unrealizedPnl: asNumber(stats?.unrealized_pnl),
    winRate: asNumber(stats?.win_rate),
    fillRate: asNumber(stats?.fill_rate),
  };
}
