"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Zap,
  Shield,
  Target,
  BarChart3,
  Settings,
  Newspaper,
  RefreshCw,
  Bell,
  Play,
  Pause,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  ExternalLink,
  Brain,
  Radio,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";

type MarketImpact = {
  marketId: string;
  question: string;
  currentYesPrice: number;
  estimatedYesPrice: number;
  probabilityShift: number;
  direction: "up" | "down" | "neutral";
  reasoning: string;
  suggestedAction: "buy_yes" | "buy_no" | "hold" | "exit";
  confidence: number;
};

type EventSignal = {
  id: string;
  headline: string;
  summary: string;
  newsSource: string;
  newsUrl: string;
  publishedAt: string;
  detectedAt: string;
  relevantMarkets: MarketImpact[];
  overallConfidence: number;
  urgency: "low" | "medium" | "high" | "critical";
  category: string;
};

type ScanResult = {
  signals: EventSignal[];
  newsCount: number;
  marketsCount: number;
  scannedAt: string;
};

const urgencyConfig = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "CRITICAL", icon: "🚨" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", label: "HIGH", icon: "⚡" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", label: "MEDIUM", icon: "⚠️" },
  low: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "LOW", icon: "📌" },
};

const categoryColors: Record<string, string> = {
  politics: "text-purple-400 bg-purple-500/10",
  crypto: "text-orange-400 bg-orange-500/10",
  sports: "text-green-400 bg-green-500/10",
  finance: "text-blue-400 bg-blue-500/10",
  tech: "text-cyan-400 bg-cyan-500/10",
  world: "text-pink-400 bg-pink-500/10",
  science: "text-teal-400 bg-teal-500/10",
};

const actionConfig = {
  buy_yes: { label: "BUY YES", color: "text-green-400 bg-green-500/10 border-green-500/30" },
  buy_no: { label: "BUY NO", color: "text-red-400 bg-red-500/10 border-red-500/30" },
  hold: { label: "HOLD", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
  exit: { label: "EXIT", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
};

const DEMO_SIGNALS: EventSignal[] = [
  {
    id: "demo_1",
    headline: "Federal Reserve signals potential rate cut in upcoming meeting",
    summary: "Fed Chair indicated openness to monetary easing given recent inflation data. This significantly impacts markets related to Fed policy decisions and has downstream effects on crypto and equity prediction markets.",
    newsSource: "Reuters Business",
    newsUrl: "#",
    publishedAt: new Date(Date.now() - 1800000).toISOString(),
    detectedAt: new Date(Date.now() - 1700000).toISOString(),
    relevantMarkets: [
      {
        marketId: "demo_m1",
        question: "Will the Fed cut rates in June 2026?",
        currentYesPrice: 0.62,
        estimatedYesPrice: 0.74,
        probabilityShift: 12,
        direction: "up",
        reasoning: "Chair's dovish language directly signals inclination toward rate cut",
        suggestedAction: "buy_yes",
        confidence: 85,
      },
      {
        marketId: "demo_m2",
        question: "Will Bitcoin exceed $120K by July 2026?",
        currentYesPrice: 0.45,
        estimatedYesPrice: 0.51,
        probabilityShift: 6,
        direction: "up",
        reasoning: "Rate cuts historically bullish for risk assets including crypto",
        suggestedAction: "buy_yes",
        confidence: 65,
      },
    ],
    overallConfidence: 82,
    urgency: "high",
    category: "finance",
  },
  {
    id: "demo_2",
    headline: "Ukraine-Russia ceasefire talks resume with new framework proposal",
    summary: "Both sides have agreed to a new negotiating framework with territorial compromise provisions. European leaders express cautious optimism. This could impact geopolitical and conflict-related prediction markets.",
    newsSource: "AP Top News",
    newsUrl: "#",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    detectedAt: new Date(Date.now() - 3500000).toISOString(),
    relevantMarkets: [
      {
        marketId: "demo_m3",
        question: "Ukraine ceasefire agreement before September 2026?",
        currentYesPrice: 0.22,
        estimatedYesPrice: 0.34,
        probabilityShift: 12,
        direction: "up",
        reasoning: "New framework with concrete territorial provisions is a significant step forward",
        suggestedAction: "buy_yes",
        confidence: 72,
      },
    ],
    overallConfidence: 75,
    urgency: "high",
    category: "world",
  },
  {
    id: "demo_3",
    headline: "NBA injury report: LeBron James listed as day-to-day with knee issue",
    summary: "Lakers star LeBron James has been downgraded to day-to-day with a knee contusion ahead of playoff push. Team officials say it's precautionary but he may miss 2-3 games.",
    newsSource: "ESPN",
    newsUrl: "#",
    publishedAt: new Date(Date.now() - 5400000).toISOString(),
    detectedAt: new Date(Date.now() - 5300000).toISOString(),
    relevantMarkets: [
      {
        marketId: "demo_m4",
        question: "Lakers win NBA Championship 2026?",
        currentYesPrice: 0.12,
        estimatedYesPrice: 0.09,
        probabilityShift: -3,
        direction: "down",
        reasoning: "Key player injury during playoff push reduces championship probability",
        suggestedAction: "buy_no",
        confidence: 68,
      },
    ],
    overallConfidence: 70,
    urgency: "medium",
    category: "sports",
  },
  {
    id: "demo_4",
    headline: "Ethereum ETF sees record $2.1B weekly inflow",
    summary: "Spot Ethereum ETF products recorded their highest ever weekly inflow, driven by institutional demand. Analysts note this could signal a broader shift in institutional crypto allocation.",
    newsSource: "CoinDesk",
    newsUrl: "#",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    detectedAt: new Date(Date.now() - 7100000).toISOString(),
    relevantMarkets: [
      {
        marketId: "demo_m5",
        question: "Will Ethereum exceed $5000 by June 2026?",
        currentYesPrice: 0.38,
        estimatedYesPrice: 0.44,
        probabilityShift: 6,
        direction: "up",
        reasoning: "Record institutional inflow is a strong bullish signal for ETH price",
        suggestedAction: "buy_yes",
        confidence: 74,
      },
    ],
    overallConfidence: 72,
    urgency: "medium",
    category: "crypto",
  },
];

function timeAgo(dateString: string): string {
  const ms = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function DirectionIcon({ direction }: { direction: "up" | "down" | "neutral" }) {
  if (direction === "up") return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (direction === "down") return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

export default function EventsPage() {
  const [signals, setSignals] = useState<EventSignal[]>(DEMO_SIGNALS);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanStats, setScanStats] = useState<{ newsCount: number; marketsCount: number } | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<EventSignal | null>(null);
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isDemo, setIsDemo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [botRunning, setBotRunning] = useState(true);
  const pathname = usePathname();
  const { user } = useUser();

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch("/api/events/latest");
      if (!res.ok) return;
      const data = await res.json();
      if (data.signals && data.signals.length > 0) {
        setSignals(data.signals);
        setLastScan(data.lastScanAt);
        setIsDemo(false);
      }
    } catch {
      // Keep demo data on failure
    }
  }, []);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const runScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/events/scan", { method: "POST" });
      const data: ScanResult & { error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "Scan failed");
        return;
      }
      setSignals(data.signals.length > 0 ? data.signals : DEMO_SIGNALS);
      setIsDemo(data.signals.length === 0);
      setLastScan(data.scannedAt);
      setScanStats({ newsCount: data.newsCount, marketsCount: data.marketsCount });
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setScanning(false);
    }
  };

  const filteredSignals = signals.filter((s) => {
    if (filterUrgency !== "all" && s.urgency !== filterUrgency) return false;
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    return true;
  });

  const criticalCount = signals.filter((s) => s.urgency === "critical" || s.urgency === "high").length;

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Sidebar */}
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
            { icon: Brain, label: "AI Events", href: "/events" },
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
              {item.href === "/events" && criticalCount > 0 && (
                <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-mono">
                  {criticalCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="card-glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Bot Status</span>
              <div className={`flex items-center gap-1.5 ${botRunning ? "text-brand-400" : "text-red-400"}`}>
                <div className={`w-2 h-2 rounded-full ${botRunning ? "bg-brand-400 animate-pulse" : "bg-red-400"}`} />
                <span className="text-xs font-mono">{botRunning ? "LIVE" : "STOPPED"}</span>
              </div>
            </div>
            <button
              onClick={() => setBotRunning(!botRunning)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                botRunning ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-brand-500/10 text-brand-400 hover:bg-brand-500/20"
              }`}
            >
              {botRunning ? <><Pause className="w-4 h-4" /> Stop Bot</> : <><Play className="w-4 h-4" /> Start Bot</>}
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4 px-2">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.firstName || "Pro Plan"}</p>
              <p className="text-xs text-slate-500">AI Events Active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-900/90 backdrop-blur-xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                AI Event Detection
              </h1>
              {isDemo && (
                <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-mono">
                  DEMO DATA
                </span>
              )}
              {lastScan && (
                <span className="text-xs text-slate-500 font-mono">
                  Last scan: {timeAgo(lastScan)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={runScan}
                disabled={scanning}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  scanning
                    ? "bg-brand-500/10 text-brand-400 cursor-wait"
                    : "bg-brand-500/20 text-brand-400 hover:bg-brand-500/30"
                }`}
              >
                {scanning ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning...</>
                ) : (
                  <><Radio className="w-4 h-4" /> Run AI Scan</>
                )}
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
                <Bell className="w-4 h-4 text-slate-400" />
                {criticalCount > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />}
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-xs hover:text-red-300">dismiss</button>
            </div>
          )}

          {/* Stats bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Signals", value: signals.length.toString(), icon: Brain, color: "text-brand-400" },
              { label: "High Priority", value: criticalCount.toString(), icon: AlertTriangle, color: criticalCount > 0 ? "text-red-400" : "text-slate-500" },
              { label: "News Scanned", value: scanStats ? scanStats.newsCount.toString() : "—", icon: Newspaper, color: "text-blue-400" },
              { label: "Markets Matched", value: scanStats ? scanStats.marketsCount.toString() : "—", icon: Target, color: "text-purple-400" },
            ].map((stat, i) => (
              <div key={i} className="card-glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-mono)" }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>
            <div className="flex gap-1">
              {["all", "critical", "high", "medium", "low"].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterUrgency(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    filterUrgency === level ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex gap-1 flex-wrap">
              {["all", "politics", "finance", "crypto", "sports", "tech", "world"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    filterCategory === cat ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Signals list */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Signal cards column */}
            <div className={`space-y-3 ${selectedSignal ? "lg:col-span-1" : "lg:col-span-3"}`}>
              {filteredSignals.length === 0 && (
                <div className="card-glass rounded-2xl p-12 text-center">
                  <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">No signals match your filters.</p>
                  <p className="text-slate-500 text-xs mt-1">Try adjusting filters or run a new scan.</p>
                </div>
              )}
              {filteredSignals.map((signal) => {
                const uc = urgencyConfig[signal.urgency];
                const cc = categoryColors[signal.category] || "text-slate-400 bg-slate-500/10";
                const isSelected = selectedSignal?.id === signal.id;

                return (
                  <button
                    key={signal.id}
                    onClick={() => setSelectedSignal(isSelected ? null : signal)}
                    className={`w-full text-left card-glass rounded-xl p-5 transition-all duration-200 ${
                      isSelected ? "ring-1 ring-brand-500/50 bg-brand-500/5" : "hover:bg-white/3"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${uc.bg} ${uc.color} border ${uc.border}`}>
                          {uc.icon} {uc.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${cc}`}>{signal.category}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono shrink-0">{timeAgo(signal.publishedAt)}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-2 leading-snug" style={{ fontFamily: "var(--font-display)" }}>
                      {signal.headline}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{signal.summary}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {signal.newsSource}
                        </span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500 font-mono">
                          Confidence: {signal.overallConfidence}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {signal.relevantMarkets.map((m) => (
                          <DirectionIcon key={m.marketId} direction={m.direction} />
                        ))}
                        <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            {selectedSignal && (
              <div className="lg:col-span-2 space-y-4">
                <div className="card-glass rounded-2xl p-6 sticky top-20">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${urgencyConfig[selectedSignal.urgency].bg} ${urgencyConfig[selectedSignal.urgency].color} border ${urgencyConfig[selectedSignal.urgency].border}`}>
                          {urgencyConfig[selectedSignal.urgency].icon} {urgencyConfig[selectedSignal.urgency].label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[selectedSignal.category] || "text-slate-400 bg-slate-500/10"}`}>
                          {selectedSignal.category}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white leading-snug" style={{ fontFamily: "var(--font-display)" }}>
                        {selectedSignal.headline}
                      </h2>
                    </div>
                    <button onClick={() => setSelectedSignal(null)} className="text-slate-500 hover:text-slate-300 text-xs">
                      close ✕
                    </button>
                  </div>

                  {/* Analysis */}
                  <div className="mb-6 p-4 rounded-xl bg-surface-950 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-brand-400" />
                      <span className="text-xs text-brand-400 font-mono uppercase tracking-wider">AI Analysis</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{selectedSignal.summary}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-slate-500">
                        Source: <span className="text-slate-400">{selectedSignal.newsSource}</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        Detected: <span className="text-slate-400">{timeAgo(selectedSignal.detectedAt)}</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        Confidence: <span className="text-white font-mono font-bold">{selectedSignal.overallConfidence}%</span>
                      </span>
                      {selectedSignal.newsUrl && selectedSignal.newsUrl !== "#" && (
                        <a href={selectedSignal.newsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                          Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Market impacts */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
                      Affected Markets ({selectedSignal.relevantMarkets.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedSignal.relevantMarkets.map((market) => {
                        const action = actionConfig[market.suggestedAction];
                        const shiftColor = market.direction === "up" ? "text-green-400" : market.direction === "down" ? "text-red-400" : "text-slate-400";
                        const shiftSign = market.probabilityShift > 0 ? "+" : "";

                        return (
                          <div key={market.marketId} className="p-4 rounded-xl bg-white/2 border border-white/5 hover:border-brand-500/20 transition-colors">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <h4 className="text-sm text-white font-medium leading-snug flex-1">{market.question}</h4>
                              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border shrink-0 ${action.color}`}>
                                {action.label}
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Current</p>
                                <p className="text-sm font-mono text-slate-300">${market.currentYesPrice.toFixed(3)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Estimated</p>
                                <p className="text-sm font-mono text-white font-bold">${market.estimatedYesPrice.toFixed(3)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Shift</p>
                                <div className="flex items-center gap-1">
                                  <DirectionIcon direction={market.direction} />
                                  <p className={`text-sm font-mono font-bold ${shiftColor}`}>
                                    {shiftSign}{market.probabilityShift.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Confidence</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-mono text-white">{market.confidence}%</p>
                                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-brand-400" style={{ width: `${market.confidence}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">{market.reasoning}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="card-glass rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
              How AI Event Detection Works
            </h3>
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { step: "1", title: "News Ingestion", desc: "Scans 9+ RSS feeds (Reuters, AP, BBC, CoinDesk, ESPN, Politico) every scan cycle", icon: Newspaper },
                { step: "2", title: "Market Matching", desc: "Fetches top 40 active Polymarket events with their current prices and volume", icon: Target },
                { step: "3", title: "AI Analysis", desc: "Claude AI reads news + markets together, estimates probability shifts and confidence", icon: Brain },
                { step: "4", title: "Signal & Alert", desc: "High-priority signals trigger Telegram alerts and appear in your dashboard", icon: Bell },
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-xl bg-white/2 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-brand-400" />
                    </div>
                    <span className="text-xs text-brand-400 font-mono">STEP {item.step}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
