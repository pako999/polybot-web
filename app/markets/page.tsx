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
  TrendingDown,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const marketCategories = ["All", "Crypto", "Politics", "Sports", "Finance", "Science"] as const;

const markets = [
  { name: "Will Bitcoin exceed $120K by July 2026?", category: "Crypto", volume: "$2.4M", liquidity: "$890K", yesPrice: 0.68, change24h: 3.2, endDate: "Jul 1, 2026" },
  { name: "Will the Fed cut rates in June 2026?", category: "Finance", volume: "$5.1M", liquidity: "$1.2M", yesPrice: 0.84, change24h: 1.5, endDate: "Jun 30, 2026" },
  { name: "Lakers win NBA Championship 2026?", category: "Sports", volume: "$1.8M", liquidity: "$620K", yesPrice: 0.09, change24h: -2.1, endDate: "Jun 15, 2026" },
  { name: "Tesla stock above $400 end of March?", category: "Finance", volume: "$3.2M", liquidity: "$950K", yesPrice: 0.42, change24h: -5.3, endDate: "Mar 31, 2026" },
  { name: "S&P 500 > 6000 by Q2 2026?", category: "Finance", volume: "$4.7M", liquidity: "$1.8M", yesPrice: 0.73, change24h: 0.8, endDate: "Jun 30, 2026" },
  { name: "Ukraine ceasefire agreement by 2026?", category: "Politics", volume: "$6.3M", liquidity: "$2.1M", yesPrice: 0.34, change24h: 4.7, endDate: "Dec 31, 2026" },
  { name: "Ethereum above $5K by June 2026?", category: "Crypto", volume: "$1.9M", liquidity: "$730K", yesPrice: 0.51, change24h: 2.9, endDate: "Jun 30, 2026" },
  { name: "SpaceX Starship orbital success by April?", category: "Science", volume: "$890K", liquidity: "$340K", yesPrice: 0.76, change24h: 1.1, endDate: "Apr 30, 2026" },
];

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState<typeof marketCategories[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const filteredMarkets = markets.filter((m) => {
    const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
              Markets
            </h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search markets..."
                  className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50 w-64"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            {marketCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/30"
                    : "bg-white/5 text-slate-400 border border-white/5 hover:border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total Markets</p>
              <p className="text-2xl font-bold text-white font-mono">{markets.length}</p>
            </div>
            <div className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total Volume</p>
              <p className="text-2xl font-bold text-white font-mono">$26.3M</p>
            </div>
            <div className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Bot Tracking</p>
              <p className="text-2xl font-bold text-brand-400 font-mono">{markets.length}</p>
            </div>
            <div className="card-glass rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Opportunities</p>
              <p className="text-2xl font-bold text-green-400 font-mono">3</p>
            </div>
          </div>

          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                    <th className="text-left px-6 py-3">Market</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-right px-4 py-3">YES Price</th>
                    <th className="text-right px-4 py-3">24h Change</th>
                    <th className="text-right px-4 py-3">Volume</th>
                    <th className="text-right px-4 py-3">Liquidity</th>
                    <th className="text-left px-4 py-3">End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkets.map((market, i) => (
                    <tr key={i} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4 text-sm text-white max-w-[280px] truncate">{market.name}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                          {market.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-white font-mono font-bold">
                        ${market.yesPrice.toFixed(2)}
                      </td>
                      <td className={`px-4 py-4 text-right text-sm font-mono ${market.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                        <span className="inline-flex items-center gap-1">
                          {market.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {market.change24h >= 0 ? "+" : ""}{market.change24h}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-300 font-mono">{market.volume}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-400 font-mono">{market.liquidity}</td>
                      <td className="px-4 py-4 text-sm text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {market.endDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
