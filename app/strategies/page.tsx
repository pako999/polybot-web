"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Check, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { getAccountConfig, postAccountConfig, type BotConfig, type BotStrategyId } from "@/lib/api/client";

/** Strategies that match the bot backend (polybot-trading). */
const STRATEGY_DEFS: Array<{
  id: BotStrategyId;
  name: string;
  desc: string;
  risk: string;
}> = [
  {
    id: "arbitrage",
    name: "Arbitrage",
    desc: "Exploit price differences between YES/NO pairs across markets.",
    risk: "Low",
  },
  {
    id: "convergence",
    name: "Convergence",
    desc: "Buy near-certain outcomes (>92%) that haven't hit $1.00 yet.",
    risk: "Low-Med",
  },
  {
    id: "multi_arb",
    name: "Multi-Arb",
    desc: "Arbitrage across multiple markets and tokens.",
    risk: "Low",
  },
  {
    id: "liquidity_snipe",
    name: "Liquidity Snipe",
    desc: "Capture mispriced liquidity when it appears.",
    risk: "Medium",
  },
  {
    id: "hedging",
    name: "Hedging",
    desc: "Reduce exposure by hedging positions across markets.",
    risk: "Low-Med",
  },
  {
    id: "momentum",
    name: "Momentum",
    desc: "Detect sharp price moves and ride the trend or mean-revert.",
    risk: "Medium",
  },
  {
    id: "news_driven",
    name: "News-Driven",
    desc: "React to breaking news and sentiment shifts.",
    risk: "Medium-High",
  },
];

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<
    Array<{ id: BotStrategyId; name: string; desc: string; risk: string; enabled: boolean }>
  >(
    STRATEGY_DEFS.map((s) => ({ ...s, enabled: true }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { config } = await getAccountConfig();
      const enabledSet = new Set(config.enabledStrategies ?? STRATEGY_DEFS.map((s) => s.id));
      setStrategies(
        STRATEGY_DEFS.map((s) => ({
          ...s,
          enabled: enabledSet.has(s.id),
        }))
      );
    } catch {
      setNotice({ type: "error", message: "Could not load strategy settings." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const toggleStrategy = (id: BotStrategyId) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setNotice(null);
    try {
      const { config } = await getAccountConfig();
      const enabledStrategies = strategies.filter((s) => s.enabled).map((s) => s.id);
      await postAccountConfig({
        ...config,
        enabledStrategies,
      } as BotConfig);
      setNotice({ type: "success", message: "Strategy settings saved." });
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save strategy settings.",
      });
    } finally {
      setSaving(false);
    }
  }, [strategies]);

  return (
    <DashboardShell
      title="Strategies"
      subtitle="Enable or disable trading strategies (matches bot backend)"
    >
      <div className="max-w-4xl space-y-6">
        <p className="text-slate-400 text-sm">
          Choose which strategies the bot can use. Disabled strategies are never executed. These
          match the strategies implemented in the bot backend.
        </p>

        {notice ? (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              notice.type === "success"
                ? "bg-brand-500/10 text-brand-300 border border-brand-500/20"
                : "bg-red-500/10 text-red-300 border border-red-500/20"
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading strategy settings…</p>
        ) : (
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
        )}

        <button
          onClick={() => void handleSave()}
          disabled={loading || saving}
          className="btn-primary text-sm disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Strategy Settings"}
        </button>

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
