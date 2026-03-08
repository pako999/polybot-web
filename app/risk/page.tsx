"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Zap,
  Shield,
  Settings,
  Target,
  AlertTriangle,
  Lock,
  Gauge,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const riskLimits = [
  { label: "Max Position Size", value: "$500", used: "$320", pct: 64 },
  { label: "Max Total Exposure", value: "$5,000", used: "$1,850", pct: 37 },
  { label: "Daily Loss Limit", value: "$100", used: "$14.80", pct: 15 },
  { label: "Max Open Positions", value: "10", used: "4", pct: 40 },
];

const riskEvents = [
  { time: "14:32", type: "info", message: "Position opened: BTC > $120K July (YES $150 @ 0.68)" },
  { time: "14:15", type: "warning", message: "Slippage detected: TSLA > $400 March — 0.3% above target" },
  { time: "13:41", type: "info", message: "Position opened: Ukraine ceasefire 2026 (YES $60 @ 0.34)" },
  { time: "12:55", type: "success", message: "Stop-loss NOT triggered — all positions within limits" },
  { time: "11:20", type: "warning", message: "Approaching daily exposure limit: 72% utilized" },
  { time: "09:00", type: "success", message: "Daily risk reset — all limits refreshed" },
];

const riskMetrics = [
  { label: "Sharpe Ratio", value: "2.4", status: "good" },
  { label: "Max Drawdown", value: "-3.2%", status: "good" },
  { label: "Value at Risk (95%)", value: "$47.20", status: "neutral" },
  { label: "Win/Loss Ratio", value: "3.1:1", status: "good" },
  { label: "Avg Holding Time", value: "4.2 hrs", status: "neutral" },
  { label: "Kelly Fraction", value: "0.20", status: "neutral" },
];

export default function RiskPage() {
  const pathname = usePathname();

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
              Risk Management
            </h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3" /> All Limits OK
              </span>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {riskLimits.map((limit) => (
              <div key={limit.label} className="card-glass rounded-xl p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{limit.label}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-bold text-white font-mono">{limit.used}</span>
                  <span className="text-xs text-slate-500">/ {limit.value}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      limit.pct > 80 ? "bg-red-400" : limit.pct > 60 ? "bg-yellow-400" : "bg-brand-400"
                    }`}
                    style={{ width: `${limit.pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">{limit.pct}% utilized</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Gauge className="w-4 h-4 text-brand-400" />
                <h3 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Risk Metrics
                </h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {riskMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-white/5 bg-black/20 p-4">
                    <p className="text-xs text-slate-500 mb-1">{metric.label}</p>
                    <p className={`text-lg font-bold font-mono ${
                      metric.status === "good" ? "text-green-400" : "text-white"
                    }`}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <h3 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Risk Log
                </h3>
              </div>
              <div className="space-y-3">
                {riskEvents.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xs text-slate-600 font-mono w-12 shrink-0 pt-0.5">{event.time}</span>
                    <div className="flex-1">
                      <div className={`w-1.5 h-1.5 rounded-full inline-block mr-2 ${
                        event.type === "warning" ? "bg-yellow-400" : event.type === "success" ? "bg-green-400" : "bg-slate-500"
                      }`} />
                      <span className="text-xs text-slate-300">{event.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
