"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, AlertTriangle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

export default function RiskPage() {
  const [maxPositionUsdc, setMaxPositionUsdc] = useState(100);
  const [maxExposureUsdc, setMaxExposureUsdc] = useState(1000);
  const [stopLossPct, setStopLossPct] = useState(10);
  const [kellyFraction, setKellyFraction] = useState(0.2);
  const [paperTrade, setPaperTrade] = useState(true);

  return (
    <DashboardShell
      title="Risk"
      subtitle="Configure position limits and safety controls"
    >
      <div className="max-w-4xl space-y-6">
        {paperTrade && (
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-brand-300 font-medium">Paper trading enabled</p>
              <p className="text-slate-400 text-sm mt-0.5">
                No real funds are at risk. Toggle off to trade with real USDC.
              </p>
            </div>
          </div>
        )}

        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" />
            Position Limits
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Max per position (USDC)
              </label>
              <input
                type="number"
                value={maxPositionUsdc}
                onChange={(e) => setMaxPositionUsdc(Number(e.target.value) || 0)}
                min={1}
                max={10000}
                step={10}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Max total exposure (USDC)
              </label>
              <input
                type="number"
                value={maxExposureUsdc}
                onChange={(e) => setMaxExposureUsdc(Number(e.target.value) || 0)}
                min={10}
                max={100000}
                step={100}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Safety</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Stop-loss (%)
              </label>
              <input
                type="number"
                value={stopLossPct}
                onChange={(e) => setStopLossPct(Number(e.target.value) || 0)}
                min={1}
                max={50}
                step={1}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
              />
              <p className="text-slate-500 text-xs mt-1">Close position when loss exceeds this %</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Kelly fraction
              </label>
              <input
                type="number"
                value={kellyFraction}
                onChange={(e) => setKellyFraction(Number(e.target.value) || 0)}
                min={0.05}
                max={1}
                step={0.05}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
              />
              <p className="text-slate-500 text-xs mt-1">Position sizing (0.2 = 20% of Kelly)</p>
            </div>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Paper trading</h3>
              <p className="text-slate-400 text-sm mt-0.5">
                Simulate trades without risking real funds
              </p>
            </div>
            <button
              onClick={() => setPaperTrade(!paperTrade)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                paperTrade ? "bg-brand-500" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  paperTrade ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        <button className="btn-primary text-sm">Save Risk Settings</button>

        <p className="text-slate-500 text-sm">
          Apply changes when starting the bot from{" "}
          <Link href="/account" className="text-brand-400 hover:underline">
            Account
          </Link>
          .
        </p>
      </div>
    </DashboardShell>
  );
}
