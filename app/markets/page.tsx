"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Filter, Search, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

const CATEGORIES = ["Politics", "Crypto", "Sports", "Science", "Finance", "All"];
const SORT_OPTIONS = ["Volume", "Liquidity", "Newest", "Closing soon"];

export default function MarketsPage() {
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Volume");
  const [minVolume, setMinVolume] = useState(1000);
  const [minLiquidity, setMinLiquidity] = useState(500);

  return (
    <DashboardShell
      title="Markets"
      subtitle="Configure which Polymarket markets the bot tracks"
    >
      <div className="max-w-4xl space-y-6">
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-400" />
            Market Filters
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Set minimum volume and liquidity thresholds. The bot only trades markets that meet these criteria.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Min Volume (USDC)
              </label>
              <input
                type="number"
                value={minVolume}
                onChange={(e) => setMinVolume(Number(e.target.value) || 0)}
                min={0}
                step={100}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Min Liquidity (USDC)
              </label>
              <input
                type="number"
                value={minLiquidity}
                onChange={(e) => setMinLiquidity(Number(e.target.value) || 0)}
                min={0}
                step={100}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
              />
            </div>
          </div>
          <button className="mt-6 btn-primary text-sm">Save Filters</button>
        </div>

        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-400" />
            Categories
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Choose which market categories to include. &quot;All&quot; tracks every category.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === c
                    ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                    : "bg-white/5 text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Sort Preference
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            How to prioritize markets when scanning for opportunities.
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-[#0c1222]">
                {opt}
              </option>
            ))}
          </select>
        </div>

        <p className="text-slate-500 text-sm">
          Changes apply when you start or restart the bot from{" "}
          <Link href="/account" className="text-brand-400 hover:underline">
            Account
          </Link>
          .
        </p>
      </div>
    </DashboardShell>
  );
}
