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

export function normalizeTrades(value: { trades?: InternalBotTrade[] } | InternalBotTrade[] | undefined) {
  const items = Array.isArray(value) ? value : value?.trades;
  if (!Array.isArray(items)) {
    return [] as BotTradeResponseItem[];
  }

  return items.map((trade, index) => ({
    id: asString(trade.id) || asString(trade.trade_id) || `trade-${index}`,
    market: asString(trade.market) || asString(trade.market_name) || "Unknown market",
    side: asString(trade.side) || "n/a",
    action: asString(trade.action) || "n/a",
    price: asNumber(trade.price),
    size: asNumber(trade.size),
    pnl: asNumber(trade.pnl),
    strategy: asString(trade.strategy),
    status: asString(trade.status),
    timestamp: asString(trade.executed_at) || asString(trade.created_at),
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

  return items.map((position, index) => ({
    id: asString(position.id) || asString(position.position_id) || `position-${index}`,
    market: asString(position.market) || asString(position.market_name) || "Unknown market",
    side: asString(position.side) || "n/a",
    size: asNumber(position.size),
    entryPrice: asNumber(position.entry_price),
    currentPrice: asNumber(position.current_price),
    realizedPnl: asNumber(position.realized_pnl),
    unrealizedPnl: asNumber(position.unrealized_pnl),
    strategy: asString(position.strategy),
    status: asString(position.status),
    openedAt: asString(position.opened_at),
    updatedAt: asString(position.updated_at),
  }));
}

export function normalizeStats(value: { stats?: InternalBotStats } | InternalBotStats | undefined): BotStatsResponseData {
  let stats: InternalBotStats | undefined;
  if (value && typeof value === "object" && "stats" in value) {
    stats = value.stats;
  } else {
    stats = value as InternalBotStats | undefined;
  }
  return {
    totalTrades: asNumber(stats?.total_trades),
    openPositions: asNumber(stats?.open_positions),
    realizedPnl: asNumber(stats?.realized_pnl),
    unrealizedPnl: asNumber(stats?.unrealized_pnl),
    winRate: asNumber(stats?.win_rate),
    fillRate: asNumber(stats?.fill_rate),
  };
}
