"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  DollarSign,
  Pause,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import {
  ApiClientError,
  getAccountProfile,
  getBotPositions,
  getBotStatus,
  getBotStats,
  getBotTrades,
  getCachedWalletAddress,
  postBotStart,
  postBotStop,
  type AccountProfileResponse,
  type BotConfig,
  type BotPosition,
  type BotStatsResponse,
  type BotStatusResponse,
  type BotTrade,
} from "@/lib/api/client";

const DEFAULT_PAPER_CONFIG: BotConfig = {
  maxPositionUsdc: 100,
  maxExposureUsdc: 1000,
  paperBalanceUsdc: 1000,
  minArbProfit: 0.01,
  kellyFraction: 0.2,
  stopLossPct: 10,
  minMarketVolume: 1000,
  minMarketLiquidity: 1000,
  paperTrade: true,
  positionSizingMode: "auto",
};

type DashboardTab = "positions" | "trades" | "activity" | "config";

type BotEvent = NonNullable<AccountProfileResponse["botEvents"]>[number];
type DetailErrors = {
  positions: string | null;
  trades: string | null;
  stats: string | null;
};

function normalizeError(error: unknown) {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case "AUTH_REQUIRED":
        return "Your session expired. Please sign in again.";
      case "BACKEND_UNAVAILABLE":
        return "Bot backend is unavailable right now.";
      case "BACKEND_TOKEN_MISMATCH":
        return "Bot backend authentication failed. Check the shared server token.";
      case "RATE_LIMITED":
        return "Too many requests. Please wait a moment and try again.";
      default:
        return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Unexpected error. Please try again.";
}

function normalizeOptionalDataError(resourceName: string, error: unknown) {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case "BACKEND_REQUEST_FAILED":
        return `${resourceName} are not available from the bot backend yet.`;
      case "BACKEND_UNAVAILABLE":
        return "Bot backend is unavailable right now.";
      case "BACKEND_TOKEN_MISMATCH":
        return "Bot backend authentication failed. Check the shared server token.";
      case "RATE_LIMITED":
        return `Too many ${resourceName.toLowerCase()} requests right now.`;
      default:
        return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return `${resourceName} are not available right now.`;
}

function formatTimestamp(value?: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatRelativeTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const diffMs = parsed.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMs / 3600000);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffMs / 86400000);
  return formatter.format(diffDays, "day");
}

function getEventTone(type: string) {
  switch (type) {
    case "bot_error":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    case "bot_start_requested":
    case "wallet_connected":
    case "config_saved":
    case "live_mode_acknowledged":
      return "border-brand-500/20 bg-brand-500/10 text-brand-300";
    default:
      return "border-white/10 bg-black/20 text-slate-300";
  }
}

function useDashboardData() {
  const [status, setStatus] = useState<BotStatusResponse | null>(null);
  const [profile, setProfile] = useState<AccountProfileResponse | null>(null);
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [positions, setPositions] = useState<BotPosition[]>([]);
  const [stats, setStats] = useState<BotStatsResponse | null>(null);
  const [detailErrors, setDetailErrors] = useState<DetailErrors>({
    positions: null,
    trades: null,
    stats: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [statusResult, profileResult, tradesResult, positionsResult, statsResult] = await Promise.allSettled([
        getBotStatus(),
        getAccountProfile(),
        getBotTrades(),
        getBotPositions(),
        getBotStats(),
      ]);

      if (statusResult.status !== "fulfilled") {
        throw statusResult.reason;
      }
      if (profileResult.status !== "fulfilled") {
        throw profileResult.reason;
      }

      setStatus(statusResult.value);
      setProfile(profileResult.value);
      setError(null);

      if (tradesResult.status === "fulfilled") {
        setTrades(tradesResult.value.trades);
      } else {
        setTrades([]);
      }

      if (positionsResult.status === "fulfilled") {
        setPositions(positionsResult.value.positions);
      } else {
        setPositions([]);
      }

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.stats);
      } else {
        setStats(null);
      }

      setDetailErrors({
        trades:
          tradesResult.status === "rejected"
            ? normalizeOptionalDataError("Trade details", tradesResult.reason)
            : null,
        positions:
          positionsResult.status === "rejected"
            ? normalizeOptionalDataError("Position details", positionsResult.reason)
            : null,
        stats:
          statsResult.status === "rejected"
            ? normalizeOptionalDataError("Trade statistics", statsResult.reason)
            : null,
      });
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const lifecycleState = status?.lifecycleState ?? profile?.botLifecycleState ?? "stopped";

  useEffect(() => {
    if (!["starting", "running", "stopping"].includes(lifecycleState)) {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [lifecycleState, refresh]);

  return { status, profile, trades, positions, stats, detailErrors, loading, error, refresh };
}

export default function DashboardPage() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<DashboardTab>("positions");
  const [botLoading, setBotLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { status, profile, trades, positions, stats, detailErrors, loading, error, refresh } = useDashboardData();

  const lifecycleState = status?.lifecycleState ?? profile?.botLifecycleState ?? "stopped";
  const botRunning = Boolean(status?.running);
  const backendHealthy = Boolean(status?.backendAvailable);
  const tradingMode = status?.paperMode ?? profile?.botConfig?.paperTrade ?? true;
  const positionsCount = status?.positions ?? 0;
  const marketsTracked = status?.marketsTracked ?? 0;
  const totalPnl = status?.totalPnl ?? 0;
  const totalTrades = stats?.totalTrades;
  const winRate = stats?.winRate;
  const balanceUsdc = status?.balanceUsdc ?? profile?.botConfig?.paperBalanceUsdc ?? 0;
  const avgLatency = status?.latency?.avg;
  const p95Latency = status?.latency?.p95;
  const walletAddress =
    profile?.walletAddress || status?.walletAddress || getCachedWalletAddress() || "Not connected";
  const botEvents = profile?.botEvents ?? [];
  const botConfig = profile?.botConfig ?? DEFAULT_PAPER_CONFIG;

  const startConfig = useMemo<BotConfig>(
    () => ({
      ...DEFAULT_PAPER_CONFIG,
      ...botConfig,
      paperTrade: true,
    }),
    [botConfig]
  );

  const handleToggleBot = useCallback(async () => {
    setBotLoading(true);
    setActionError(null);
    try {
      if (botRunning) {
        await postBotStop();
      } else {
        await postBotStart({ config: startConfig });
      }
      await refresh();
    } catch (err) {
      setActionError(normalizeError(err));
    } finally {
      setBotLoading(false);
    }
  }, [botRunning, refresh, startConfig]);

  const statCards = useMemo(
    () => [
      {
        label: "Lifecycle",
        value: lifecycleState.toUpperCase(),
        sub: status?.startedAt ? `Started ${formatTimestamp(status.startedAt)}` : "No active run timestamp yet",
        icon: Activity,
        positive: lifecycleState === "running" || lifecycleState === "starting",
      },
      {
        label: tradingMode ? "Paper Balance" : "Live Balance",
        value: `$${balanceUsdc.toFixed(2)}`,
        sub: tradingMode ? "Virtual funds only" : "Connected live balance",
        icon: DollarSign,
        positive: true,
      },
      {
        label: "Total P&L",
        value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`,
        sub: `${positionsCount} open positions`,
        icon: TrendingUp,
        positive: totalPnl >= 0,
      },
      {
        label: "Trade Stats",
        value: totalTrades !== null && totalTrades !== undefined ? `${totalTrades}` : "n/a",
        sub:
          typeof winRate === "number"
            ? `${winRate.toFixed(1)}% win rate`
            : typeof avgLatency === "number" && typeof p95Latency === "number"
              ? `Latency ${avgLatency}ms avg / ${p95Latency}ms p95`
              : "Trade stats not available yet",
        icon: Target,
        positive: true,
      },
    ],
    [avgLatency, balanceUsdc, lifecycleState, p95Latency, positionsCount, status?.startedAt, totalPnl, totalTrades, tradingMode, winRate]
  );

  return (
    <div className="min-h-screen bg-surface-900 flex">
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-surface-950 p-4">
        <Link href="/" className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-brand-400" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Poly<span className="text-brand-400">Bot</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          {[
            { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
            { icon: Target, label: "Markets", href: "/markets" },
            { icon: Zap, label: "Strategies", href: "/strategies" },
            { icon: Shield, label: "Risk", href: "/risk" },
            { icon: Settings, label: "Account", href: "/account" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? "bg-brand-500/10 text-brand-400"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="card-glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Bot Status</span>
              <div
                className={`flex items-center gap-1.5 ${
                  lifecycleState === "running" || lifecycleState === "starting"
                    ? "text-brand-400"
                    : lifecycleState === "error"
                      ? "text-red-400"
                      : "text-slate-400"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    lifecycleState === "running"
                      ? "bg-brand-400 animate-pulse"
                      : lifecycleState === "starting"
                        ? "bg-yellow-400 animate-pulse"
                        : lifecycleState === "error"
                          ? "bg-red-400"
                          : "bg-slate-500"
                  }`}
                />
                <span className="text-xs font-mono">{lifecycleState.toUpperCase()}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleBot}
              disabled={botLoading}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 ${
                botRunning
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "bg-brand-500/10 text-brand-400 hover:bg-brand-500/20"
              }`}
            >
              {botRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Stop Bot
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Start Bot (Paper)
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4 px-2">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{tradingMode ? "Paper mode" : "Live mode"}</p>
              <p className="text-xs text-slate-500 truncate">{walletAddress}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-900/90 backdrop-blur-xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                Dashboard
              </h1>
              <div className={`flex items-center gap-1.5 ${backendHealthy ? "text-brand-400" : "text-red-400"}`}>
                {backendHealthy ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span className="text-xs font-mono">
                  {backendHealthy
                    ? `Backend reachable${tradingMode ? " (PAPER)" : " (LIVE)"}`
                    : "Backend unavailable"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void refresh()}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Refresh dashboard data"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button type="button" className="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
                <Bell className="w-4 h-4 text-slate-400" />
                {botEvents.length > 0 ? <div className="absolute top-1 right-1 w-2 h-2 bg-brand-400 rounded-full" /> : null}
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {actionError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {actionError}
            </div>
          ) : null}

          {status?.lastError ? (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{status.lastError}</div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="card-glass rounded-xl p-5 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  <stat.icon className="w-4 h-4 text-slate-600" />
                </div>
                <div
                  className={`text-2xl font-bold ${stat.positive ? "text-white" : "text-red-400"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {stat.value}
                </div>
                <div
                  className={`text-xs mt-1 ${stat.positive ? "text-brand-400" : "text-red-400"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          <div className="card-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Live Bot Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real authenticated bot status for your current account. No demo data.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500">
                {status?.startedAt ? `Run started ${formatTimestamp(status.startedAt)}` : "No confirmed run yet"}
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Wallet</p>
                <p className="text-white font-mono break-all text-sm">{walletAddress}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Execution Mode</p>
                <p className="text-white font-mono text-sm">{tradingMode ? "PAPER" : "LIVE"}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Position sizing: {botConfig.positionSizingMode === "manual" ? "Manual per trade" : "Auto Kelly"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Latency</p>
                <p className="text-white font-mono text-sm">
                  {typeof avgLatency === "number" ? `${avgLatency}ms avg` : "Not reported yet"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {typeof p95Latency === "number" ? `${p95Latency}ms p95` : "Waiting for samples"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Backend Link</p>
                <p className={`font-mono text-sm ${backendHealthy ? "text-brand-300" : "text-red-300"}`}>
                  {backendHealthy ? "CONNECTED" : "NOT AVAILABLE"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {status?.ws?.connected ? "Realtime feed connected" : "Realtime feed not reported"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Total trades</p>
                <p className="text-white font-mono text-sm">
                  {totalTrades !== null && totalTrades !== undefined ? totalTrades : "Not available"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Win rate</p>
                <p className="text-white font-mono text-sm">
                  {typeof winRate === "number" ? `${winRate.toFixed(1)}%` : "Not available"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Markets tracked</p>
                <p className="text-white font-mono text-sm">{marketsTracked}</p>
              </div>
            </div>
          </div>

          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="flex border-b border-white/5">
              {(
                [
                  { key: "positions", label: "Open Positions", count: positions.length || positionsCount },
                  { key: "trades", label: "Recent Trades", count: trades.length || totalTrades || 0 },
                  { key: "activity", label: "Bot Activity", count: botEvents.length },
                  { key: "config", label: "Saved Config", count: 1 },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3.5 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key ? "text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                  {activeTab === tab.key ? <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400" /> : null}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "positions" ? (
                <div className="space-y-4">
                  {positions.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                            <th className="text-left px-4 py-3">What</th>
                            <th className="text-left px-4 py-3">Side</th>
                            <th className="text-right px-4 py-3">Size</th>
                            <th className="text-right px-4 py-3">Entry</th>
                            <th className="text-right px-4 py-3">Current</th>
                            <th className="text-right px-4 py-3">Unrealized P&amp;L</th>
                            <th className="text-left px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map((position) => (
                            <tr key={position.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                              <td className="px-4 py-4 text-sm text-white max-w-[320px]">
                                <span className="block truncate" title={position.question || position.market}>
                                  {position.question
                                    ? `${position.question}${position.outcome ? ` (${position.outcome})` : ""}`
                                    : position.market}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-300 font-mono">{position.side}</td>
                              <td className="px-4 py-4 text-right text-sm text-slate-300 font-mono">
                                {position.size ?? "n/a"}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-slate-400 font-mono">
                                {typeof position.entryPrice === "number" ? `$${position.entryPrice.toFixed(3)}` : "n/a"}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-white font-mono">
                                {typeof position.currentPrice === "number" ? `$${position.currentPrice.toFixed(3)}` : "n/a"}
                              </td>
                              <td
                                className={`px-4 py-4 text-right text-sm font-mono ${
                                  typeof position.unrealizedPnl === "number" && position.unrealizedPnl < 0
                                    ? "text-red-400"
                                    : "text-brand-300"
                                }`}
                              >
                                {typeof position.unrealizedPnl === "number"
                                  ? `${position.unrealizedPnl >= 0 ? "+" : ""}$${position.unrealizedPnl.toFixed(2)}`
                                  : "n/a"}
                              </td>
                              <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                                {position.status || position.strategy || "open"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-slate-300">
                      {detailErrors.positions
                        ? detailErrors.positions
                        : lifecycleState === "idle"
                          ? "No bot run yet. Start the bot to see open positions."
                          : lifecycleState === "starting"
                            ? "Bot is starting. Positions will appear once the run is active."
                            : positionsCount > 0
                              ? "The backend reports open positions, but it is not returning detailed position rows yet."
                              : "No open positions are currently reported for this account."}
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === "trades" ? (
                <div className="space-y-4">
                  {trades.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                            <th className="text-left px-4 py-3">Time</th>
                            <th className="text-left px-4 py-3">Market</th>
                            <th className="text-left px-4 py-3">Action</th>
                            <th className="text-left px-4 py-3">Side</th>
                            <th className="text-right px-4 py-3">Price</th>
                            <th className="text-right px-4 py-3">Size</th>
                            <th className="text-right px-4 py-3">P&amp;L</th>
                            <th className="text-left px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trades.map((trade) => (
                            <tr key={trade.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                              <td className="px-4 py-4 text-sm text-slate-400 font-mono">
                                {trade.timestamp ? formatTimestamp(trade.timestamp) : "n/a"}
                              </td>
                              <td className="px-4 py-4 text-sm text-white max-w-[280px] truncate">{trade.market}</td>
                              <td className="px-4 py-4 text-sm text-slate-300 font-mono">{trade.action}</td>
                              <td className="px-4 py-4 text-sm text-slate-300 font-mono">{trade.side}</td>
                              <td className="px-4 py-4 text-right text-sm text-slate-300 font-mono">
                                {typeof trade.price === "number" ? `$${trade.price.toFixed(3)}` : "n/a"}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-slate-300 font-mono">
                                {trade.size ?? "n/a"}
                              </td>
                              <td
                                className={`px-4 py-4 text-right text-sm font-mono ${
                                  typeof trade.pnl === "number" && trade.pnl < 0 ? "text-red-400" : "text-brand-300"
                                }`}
                              >
                                {typeof trade.pnl === "number"
                                  ? `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`
                                  : "n/a"}
                              </td>
                              <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                                {trade.status || trade.strategy || "completed"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-slate-300">
                      {detailErrors.trades
                        ? detailErrors.trades
                        : lifecycleState === "idle"
                          ? "No bot run yet. Start the bot to see trades."
                          : lifecycleState === "starting"
                            ? "Bot is starting. Trades will appear once the run is active."
                            : totalTrades && totalTrades > 0
                              ? "The backend reports trades, but it is not returning detailed trade rows yet."
                              : "No recent trades are currently reported for this account."}
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === "activity" ? (
                <div className="space-y-3">
                  {botEvents.length ? (
                    botEvents.map((event: BotEvent) => (
                      <div key={`${event.at}-${event.type}`} className={`rounded-xl border p-4 ${getEventTone(event.type)}`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs uppercase tracking-wider font-mono">{event.type.replaceAll("_", " ")}</span>
                          <span className="text-xs text-slate-400">{formatRelativeTime(event.at)}</span>
                        </div>
                        <p className="mt-2 text-sm">{event.message}</p>
                        <p className="mt-2 text-xs text-slate-500">{formatTimestamp(event.at)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-slate-400">
                      No recent bot activity has been recorded for this account yet.
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === "config" ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Mode</p>
                    <p className="text-white font-mono">{botConfig.paperTrade ? "Paper" : "Live"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Paper budget</p>
                    <p className="text-white font-mono">${(botConfig.paperBalanceUsdc ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Position sizing</p>
                    <p className="text-white font-mono">{botConfig.positionSizingMode === "manual" ? "Manual" : "Auto Kelly"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Max position</p>
                    <p className="text-white font-mono">${botConfig.maxPositionUsdc.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Max exposure</p>
                    <p className="text-white font-mono">${botConfig.maxExposureUsdc.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Kelly fraction</p>
                    <p className="text-white font-mono">{botConfig.kellyFraction.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Min market volume</p>
                    <p className="text-white font-mono">${botConfig.minMarketVolume.toFixed(0)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Min liquidity</p>
                    <p className="text-white font-mono">${botConfig.minMarketLiquidity.toFixed(0)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Start button behavior</p>
                    <p className="text-white text-sm">Dashboard start always launches paper mode with your saved limits.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
