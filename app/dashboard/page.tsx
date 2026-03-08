"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Settings,
  Bell,
  BarChart3,
  Zap,
  Shield,
  Target,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { getBotStatus, postBotStart, postBotStop, type BotStatusResponse } from "@/lib/api/client";

type BotApiStatus = {
  running?: boolean;
  paper_mode?: boolean;
  balance_usdc?: number;
  total_pnl?: number;
  held_tokens?: number;
  latency?: { avg?: number; p95?: number };
  markets_tracked?: number;
  ws_stats?: { messages?: number };
};

function useBotData() {
  const [status, setStatus] = useState<BotApiStatus | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatusResponse | null>(null);
  const [connected, setConnected] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const statusRes = await getBotStatus();
      setBotStatus(statusRes);
      setStatus({
        running: statusRes.running,
        paper_mode: statusRes.paperMode,
        balance_usdc: statusRes.balanceUsdc,
        total_pnl: statusRes.totalPnl,
        held_tokens: statusRes.positions,
        latency: statusRes.latency,
        markets_tracked: statusRes.marketsTracked,
        ws_stats: { messages: 0 },
      });
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { status, botStatus, connected, refresh: fetchData };
}

// Mock data (used as fallback when bot API is not connected)
const portfolioData = [
  { time: "00:00", pnl: 0 },
  { time: "02:00", pnl: 12 },
  { time: "04:00", pnl: 8 },
  { time: "06:00", pnl: 24 },
  { time: "08:00", pnl: 31 },
  { time: "10:00", pnl: 28 },
  { time: "12:00", pnl: 45 },
  { time: "14:00", pnl: 52 },
  { time: "16:00", pnl: 48 },
  { time: "18:00", pnl: 67 },
  { time: "20:00", pnl: 73 },
  { time: "22:00", pnl: 81 },
];

const positions = [
  {
    market: "Will Bitcoin exceed $120K by July 2026?",
    side: "YES",
    size: 150,
    entry: 0.62,
    current: 0.68,
    pnl: 9.0,
    strategy: "MOMENTUM",
  },
  {
    market: "Will the Fed cut rates in June 2026?",
    side: "YES",
    size: 200,
    entry: 0.81,
    current: 0.84,
    pnl: 6.0,
    strategy: "CONVERGENCE",
  },
  {
    market: "Lakers win NBA Championship 2026?",
    side: "NO",
    size: 80,
    entry: 0.88,
    current: 0.91,
    pnl: 2.4,
    strategy: "CONVERGENCE",
  },
  {
    market: "Tesla stock above $400 end of March?",
    side: "YES",
    size: 120,
    entry: 0.45,
    current: 0.42,
    pnl: -3.6,
    strategy: "ARBITRAGE",
  },
];

const recentTrades = [
  {
    time: "14:32:14",
    market: "BTC > $120K July",
    side: "BUY",
    price: 0.62,
    size: 150,
    strategy: "MOMENTUM",
    latency: 43,
    status: "filled",
  },
  {
    time: "14:28:41",
    market: "Fed rate cut June",
    side: "BUY",
    price: 0.81,
    size: 200,
    strategy: "CONV",
    latency: 51,
    status: "filled",
  },
  {
    time: "14:22:07",
    market: "Lakers NBA Champ",
    side: "SELL",
    price: 0.12,
    size: 80,
    strategy: "CONV",
    latency: 38,
    status: "filled",
  },
  {
    time: "14:15:33",
    market: "TSLA > $400 March",
    side: "BUY",
    price: 0.45,
    size: 120,
    strategy: "ARB",
    latency: 47,
    status: "filled",
  },
  {
    time: "13:58:12",
    market: "S&P 500 > 6000 Q2",
    side: "BUY",
    price: 0.73,
    size: 90,
    strategy: "MOMENTUM",
    latency: 55,
    status: "filled",
  },
  {
    time: "13:41:09",
    market: "Ukraine ceasefire 2026",
    side: "BUY",
    price: 0.34,
    size: 60,
    strategy: "NEWS",
    latency: 62,
    status: "filled",
  },
];

const strategyStats = [
  { name: "Arbitrage", trades: 47, winRate: 94, pnl: 142.3, color: "text-green-400" },
  { name: "Convergence", trades: 31, winRate: 87, pnl: 89.7, color: "text-yellow-400" },
  { name: "Momentum", trades: 23, winRate: 61, pnl: 34.2, color: "text-orange-400" },
  { name: "News-Driven", trades: 8, winRate: 75, pnl: 67.8, color: "text-blue-400" },
];

export default function DashboardPage() {
  const [botRunning, setBotRunning] = useState(false);
  const [botActionLoading, setBotActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"positions" | "trades" | "strategies">("positions");
  const { status, botStatus, connected, refresh } = useBotData();
  const pathname = usePathname();

  useEffect(() => {
    if (botStatus) setBotRunning(Boolean(botStatus.running));
  }, [botStatus]);

  const handleToggleBot = useCallback(async () => {
    setBotActionLoading(true);
    try {
      if (botRunning) {
        await postBotStop();
        setBotRunning(false);
      } else {
        await postBotStart({
          config: {
            maxPositionUsdc: 100,
            maxExposureUsdc: 1000,
            minArbProfit: 0.01,
            kellyFraction: 0.2,
            stopLossPct: 0.1,
            minMarketVolume: 1000,
            minMarketLiquidity: 1000,
            paperTrade: true,
          },
        });
        setBotRunning(true);
      }
      await refresh();
    } catch {
      // Revert on failure
      setBotRunning((prev) => !prev);
    } finally {
      setBotActionLoading(false);
    }
  }, [botRunning, refresh]);

  const totalPnl = status?.total_pnl ?? positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalExposure = status?.balance_usdc ?? positions.reduce((sum, p) => sum + p.size * p.entry, 0);
  const avgLatency = status?.latency?.avg ?? 47;
  const p95Latency = status?.latency?.p95 ?? 62;
  const marketsTracked = status?.markets_tracked ?? 0;

  // SVG chart from portfolio data
  const chartWidth = 800;
  const chartHeight = 200;
  const maxPnl = Math.max(...portfolioData.map((d) => d.pnl));
  const minPnl = Math.min(...portfolioData.map((d) => d.pnl));
  const range = maxPnl - minPnl || 1;

  const points = portfolioData
    .map((d, i) => {
      const x = (i / (portfolioData.length - 1)) * chartWidth;
      const y = chartHeight - ((d.pnl - minPnl) / range) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* ===== SIDEBAR ===== */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-surface-950 p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-brand-400" />
          </div>
          <span
            className="text-lg font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Poly<span className="text-brand-400">Bot</span>
          </span>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 space-y-1">
          {[
            { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
            { icon: Target, label: "Markets", href: "/markets" },
            { icon: Zap, label: "Strategies", href: "/strategies" },
            { icon: Shield, label: "Risk", href: "/risk" },
            { icon: Settings, label: "Settings", href: "/account" },
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

        {/* Bot status */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="card-glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                Bot Status
              </span>
              <div className={`flex items-center gap-1.5 ${botRunning ? 'text-brand-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${botRunning ? 'bg-brand-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-xs font-mono">
                  {botRunning ? "LIVE" : "STOPPED"}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleBot}
              disabled={botActionLoading}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                botRunning
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "bg-brand-500/10 text-brand-400 hover:bg-brand-500/20"
              }`}
            >
              {botActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : botRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Stop Bot
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Start Bot
                </>
              )}
            </button>
          </div>

          {/* User */}
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
              <p className="text-sm text-white truncate">Pro Plan</p>
              <p className="text-xs text-slate-500">0x7a3...f42b</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-900/90 backdrop-blur-xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1
                className="text-lg font-bold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Dashboard
              </h1>
              <div className={`flex items-center gap-1.5 ${connected ? 'text-brand-400' : 'text-red-400'}`}>
                {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span className="text-xs font-mono">
                  {connected
                    ? `Bot Connected${status?.paper_mode ? ' (PAPER)' : ' (LIVE)'}`
                    : 'Bot Offline — using demo data'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Refresh dashboard data"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
                <Bell className="w-4 h-4 text-slate-400" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-brand-400 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* ===== STAT CARDS ===== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total P&L (Today)",
                value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`,
                sub: connected ? `${status?.held_tokens || 0} positions` : "+4.2%",
                positive: totalPnl >= 0,
                icon: TrendingUp,
              },
              {
                label: connected ? "USDC Balance" : "Total Exposure",
                value: `$${totalExposure.toFixed(0)}`,
                sub: connected ? `${marketsTracked} markets tracked` : `${positions.length} positions`,
                positive: true,
                icon: DollarSign,
              },
              {
                label: "Avg Latency",
                value: `${avgLatency}ms`,
                sub: `p95: ${p95Latency}ms`,
                positive: true,
                icon: Clock,
              },
              {
                label: "Win Rate",
                value: "78%",
                sub: connected ? `${status?.ws_stats?.messages || 0} WS msgs` : "109 trades today",
                positive: true,
                icon: Target,
              },
            ].map((stat, i) => (
              <div key={i} className="card-glass rounded-xl p-5 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <stat.icon className="w-4 h-4 text-slate-600" />
                </div>
                <div
                  className={`text-2xl font-bold ${
                    stat.positive ? "text-white" : "text-red-400"
                  }`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {stat.value}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    stat.positive ? "text-brand-400" : "text-red-400"
                  }`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ===== P&L CHART ===== */}
          <div className="card-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-base font-semibold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Portfolio Performance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Today&apos;s P&L curve</p>
              </div>
              <div className="flex items-center gap-2">
                {["1D", "7D", "30D", "ALL"].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                      period === "1D"
                        ? "bg-brand-500/10 text-brand-400"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart */}
            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-48"
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map((frac) => (
                  <line
                    key={frac}
                    x1={0}
                    y1={chartHeight * frac}
                    x2={chartWidth}
                    y2={chartHeight * frac}
                    stroke="rgba(255,255,255,0.04)"
                    strokeDasharray="4 4"
                  />
                ))}
                {/* Area fill */}
                <polygon
                  points={areaPoints}
                  fill="url(#greenGradient)"
                  opacity="0.15"
                />
                {/* Line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke="#00e676"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Last point dot */}
                {(() => {
                  const lastPoint = points.split(" ").pop()?.split(",");
                  if (!lastPoint) return null;
                  return (
                    <circle
                      cx={lastPoint[0]}
                      cy={lastPoint[1]}
                      r="4"
                      fill="#00e676"
                      filter="url(#glow)"
                    />
                  );
                })()}
                <defs>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e676" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00e676" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            </div>
          </div>

          {/* ===== TABS: Positions / Trades / Strategies ===== */}
          <div className="card-glass rounded-2xl overflow-hidden">
            {/* Tab headers */}
            <div className="flex border-b border-white/5">
              {(
                [
                  { key: "positions", label: "Open Positions", count: positions.length },
                  { key: "trades", label: "Recent Trades", count: recentTrades.length },
                  { key: "strategies", label: "Strategy Stats", count: strategyStats.length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3.5 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? "bg-brand-500/20 text-brand-400"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-0">
              {/* Positions */}
              {activeTab === "positions" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                        <th className="text-left px-6 py-3">Market</th>
                        <th className="text-left px-4 py-3">Side</th>
                        <th className="text-right px-4 py-3">Size</th>
                        <th className="text-right px-4 py-3">Entry</th>
                        <th className="text-right px-4 py-3">Current</th>
                        <th className="text-right px-4 py-3">P&L</th>
                        <th className="text-left px-4 py-3">Strategy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/3 hover:bg-white/2 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-white max-w-[250px] truncate">
                            {pos.market}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                pos.side === "YES"
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {pos.side}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-slate-300 font-mono">
                            {pos.size}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-slate-400 font-mono">
                            ${pos.entry.toFixed(3)}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-white font-mono">
                            ${pos.current.toFixed(3)}
                          </td>
                          <td
                            className={`px-4 py-4 text-right text-sm font-mono font-bold ${
                              pos.pnl >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500 font-mono">
                            {pos.strategy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Recent Trades */}
              {activeTab === "trades" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                        <th className="text-left px-6 py-3">Time</th>
                        <th className="text-left px-4 py-3">Market</th>
                        <th className="text-left px-4 py-3">Side</th>
                        <th className="text-right px-4 py-3">Price</th>
                        <th className="text-right px-4 py-3">Size</th>
                        <th className="text-right px-4 py-3">Latency</th>
                        <th className="text-left px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTrades.map((trade, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/3 hover:bg-white/2 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                            {trade.time}
                          </td>
                          <td className="px-4 py-4 text-sm text-white truncate max-w-[200px]">
                            {trade.market}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                trade.side === "BUY"
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {trade.side}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-slate-300 font-mono">
                            ${trade.price.toFixed(3)}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-slate-300 font-mono">
                            {trade.size}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-brand-400 font-mono">
                            {trade.latency}ms
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-green-400 font-mono bg-green-500/10 px-2 py-0.5 rounded">
                              {trade.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Strategy Stats */}
              {activeTab === "strategies" && (
                <div className="p-6 grid sm:grid-cols-2 gap-4">
                  {strategyStats.map((strat, i) => (
                    <div key={i} className="bg-white/2 rounded-xl p-5 border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <h4
                          className={`text-base font-semibold ${strat.color}`}
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {strat.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">
                          {strat.trades} trades
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Win Rate</p>
                          <p className="text-xl font-bold text-white font-mono">
                            {strat.winRate}%
                          </p>
                          {/* Win rate bar */}
                          <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-400"
                              style={{ width: `${strat.winRate}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Total P&L</p>
                          <p className="text-xl font-bold text-green-400 font-mono">
                            +${strat.pnl.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
