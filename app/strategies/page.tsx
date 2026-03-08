"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Zap,
  Shield,
  Settings,
  Target,
  TrendingUp,
  ArrowRightLeft,
  Newspaper,
  GitMerge,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const strategies = [
  {
    id: "arbitrage",
    name: "Arbitrage",
    description: "Detects and exploits price discrepancies between related markets. Buys underpriced and sells overpriced contracts simultaneously for near-riskless profit.",
    icon: ArrowRightLeft,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    stats: { winRate: 94, avgProfit: "2.8%", trades: 47, totalPnl: 142.3 },
    params: [
      { label: "Min Spread", value: "1.5%" },
      { label: "Max Position", value: "$500" },
      { label: "Lookback", value: "30 min" },
    ],
    status: "active" as const,
  },
  {
    id: "convergence",
    name: "Convergence",
    description: "Trades markets where the probability is expected to converge toward a known fair value as the event approaches or new information surfaces.",
    icon: GitMerge,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    stats: { winRate: 87, avgProfit: "5.1%", trades: 31, totalPnl: 89.7 },
    params: [
      { label: "Min Edge", value: "3%" },
      { label: "Decay Factor", value: "0.85" },
      { label: "Exit Threshold", value: "1%" },
    ],
    status: "active" as const,
  },
  {
    id: "momentum",
    name: "Momentum",
    description: "Follows strong directional moves in market prices, entering in the direction of the trend with tight risk controls and trailing stops.",
    icon: TrendingUp,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    stats: { winRate: 61, avgProfit: "8.2%", trades: 23, totalPnl: 34.2 },
    params: [
      { label: "Min Move", value: "5%" },
      { label: "Lookback", value: "2 hours" },
      { label: "Trail Stop", value: "3%" },
    ],
    status: "paused" as const,
  },
  {
    id: "news",
    name: "News-Driven",
    description: "Uses AI (Claude) to analyze real-time news and social feeds, then trades before the market fully prices in the information.",
    icon: Newspaper,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    stats: { winRate: 75, avgProfit: "12.4%", trades: 8, totalPnl: 67.8 },
    params: [
      { label: "AI Model", value: "Claude 3.5" },
      { label: "Confidence", value: ">0.7" },
      { label: "Max Exposure", value: "$200" },
    ],
    status: "active" as const,
  },
];

export default function StrategiesPage() {
  const pathname = usePathname();
  const [strategyStates, setStrategyStates] = useState<Record<string, "active" | "paused">>(
    Object.fromEntries(strategies.map((s) => [s.id, s.status]))
  );

  const toggleStrategy = (id: string) => {
    setStrategyStates((prev) => ({
      ...prev,
      [id]: prev[id] === "active" ? "paused" : "active",
    }));
  };

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
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-900/90 backdrop-blur-xl px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              Strategies
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 font-mono">
                {Object.values(strategyStates).filter((s) => s === "active").length} Active
              </span>
              <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 font-mono">
                {Object.values(strategyStates).filter((s) => s === "paused").length} Paused
              </span>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total Strategies</p>
              <p className="text-2xl font-bold text-white font-mono">{strategies.length}</p>
            </div>
            <div className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Combined Win Rate</p>
              <p className="text-2xl font-bold text-brand-400 font-mono">79%</p>
            </div>
            <div className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total Trades</p>
              <p className="text-2xl font-bold text-white font-mono">109</p>
            </div>
            <div className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Combined P&L</p>
              <p className="text-2xl font-bold text-green-400 font-mono">+$334.00</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {strategies.map((strategy) => {
              const isActive = strategyStates[strategy.id] === "active";
              return (
                <div key={strategy.id} className={`card-glass rounded-2xl p-6 border ${isActive ? strategy.borderColor : "border-white/5"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${strategy.bgColor}`}>
                        <strategy.icon className={`w-5 h-5 ${strategy.color}`} />
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold ${strategy.color}`} style={{ fontFamily: "var(--font-display)" }}>
                          {strategy.name}
                        </h3>
                        <span className={`text-xs font-mono ${isActive ? "text-green-400" : "text-yellow-400"}`}>
                          {isActive ? "ACTIVE" : "PAUSED"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStrategy(strategy.id)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title={isActive ? "Pause strategy" : "Activate strategy"}
                    >
                      {isActive ? <ToggleRight className="w-6 h-6 text-brand-400" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>

                  <p className="text-sm text-slate-400 mb-5 leading-relaxed">{strategy.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Win Rate</p>
                      <p className="text-xl font-bold text-white font-mono">{strategy.stats.winRate}%</p>
                      <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-brand-400" style={{ width: `${strategy.stats.winRate}%` }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Avg Profit/Trade</p>
                      <p className="text-xl font-bold text-green-400 font-mono">{strategy.stats.avgProfit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Trades</p>
                      <p className="text-lg font-bold text-white font-mono">{strategy.stats.trades}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total P&L</p>
                      <p className="text-lg font-bold text-green-400 font-mono">+${strategy.stats.totalPnl.toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Parameters</p>
                    <div className="flex flex-wrap gap-2">
                      {strategy.params.map((param) => (
                        <div key={param.label} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-xs text-slate-500">{param.label}: </span>
                          <span className="text-xs text-white font-mono">{param.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
