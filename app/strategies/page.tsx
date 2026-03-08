"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Check, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

const STRATEGIES = [
  {
    id: "arbitrage",
    name: "Arbitrage",
    desc: "Exploit price differences between YES/NO pairs across markets.",
    risk: "Low",
    enabled: true,
  },
  {
    id: "convergence",
    name: "Convergence",
    desc: "Buy near-certain outcomes (>92%) that haven't hit $1.00 yet.",
    risk: "Low-Med",
    enabled: true,
  },
  {
    id: "momentum",
    name: "Momentum",
    desc: "Detect sharp price moves and ride the trend or mean-revert.",
    risk: "Medium",
    enabled: true,
  },
  {
    id: "news",
    name: "News-Driven",
    desc: "React to breaking news and sentiment shifts.",
    risk: "Medium-High",
    enabled: false,
  },
];

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState(STRATEGIES);

  const toggleStrategy = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <DashboardShell
      title="Strategies"
      subtitle="Enable or disable trading strategies"
    >
      <div className="max-w-4xl space-y-6">
        <p className="text-slate-400 text-sm">
          Choose which strategies the bot can use. Disabled strategies are never executed.
        </p>

        <div className="grid gap-4">
          {strategies.map((s) => (
            <div
              key={s.id}
              className="card-glass rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-white">{s.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      s.risk === "Low"
                        ? "bg-green-500/10 text-green-400"
                        : s.risk === "Low-Med" || s.risk === "Medium"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-orange-500/10 text-orange-400"
                    }`}
                  >
                    {s.risk}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
              <button
                onClick={() => toggleStrategy(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  s.enabled
                    ? "bg-brand-500/10 text-brand-400"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                {s.enabled ? (
                  <>
                    <Check className="w-4 h-4" /> Enabled
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" /> Disabled
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <button className="btn-primary text-sm">Save Strategy Settings</button>

        <p className="text-slate-500 text-sm">
          Start or stop the bot from{" "}
          <Link href="/account" className="text-brand-400 hover:underline">
            Account
          </Link>
          .
        </p>
      </div>
    </DashboardShell>
  );
}
