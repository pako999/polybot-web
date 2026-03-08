"use client";

import Link from "next/link";
import {
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Clock,
  Globe,
  ArrowRight,
  Check,
  Activity,
  Cpu,
  Wifi,
  Lock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const stats = [
  { label: "Avg Latency", value: "47ms", sub: "order to fill" },
  { label: "Uptime", value: "99.97%", sub: "last 90 days" },
  { label: "Markets Tracked", value: "850+", sub: "real-time" },
  { label: "Total Volume", value: "$12.4M", sub: "processed" },
];

const features = [
  {
    icon: Zap,
    title: "Sub-50ms Execution",
    description:
      "WebSocket-first architecture with in-memory orderbook state. Your orders hit the market before the competition even parses the data.",
  },
  {
    icon: Shield,
    title: "Risk Management",
    description:
      "Kelly criterion sizing, fractional position limits, auto stop-losses, and daily drawdown caps. Your capital is protected 24/7.",
  },
  {
    icon: TrendingUp,
    title: "4 Core Strategies",
    description:
      "Arbitrage, resolution convergence, momentum detection, and news-driven trading. Each strategy independently configurable.",
  },
  {
    icon: BarChart3,
    title: "Live Dashboard",
    description:
      "Real-time P&L tracking, position management, latency monitoring, and market scanner — all in one professional interface.",
  },
  {
    icon: Cpu,
    title: "AI News Analysis",
    description:
      "Integrated Claude API analyzes breaking news and re-prices markets in seconds. Act on information before the crowd moves.",
  },
  {
    icon: Globe,
    title: "24/7 Cloud Trading",
    description:
      "Deploy on our managed infrastructure or your own VPS. Trades execute around the clock — even while you sleep.",
  },
];

const strategies = [
  {
    name: "Arbitrage",
    risk: "Low",
    riskColor: "text-green-400",
    avg: "2-5% per trade",
    description: "Buy YES+NO when combined price < $1.00. Risk-free profit.",
  },
  {
    name: "Convergence",
    risk: "Low-Med",
    riskColor: "text-yellow-400",
    avg: "3-8% per position",
    description: "Buy near-certain outcomes (>92%) that haven't hit $1.00 yet.",
  },
  {
    name: "Momentum",
    risk: "Medium",
    riskColor: "text-orange-400",
    avg: "5-15% per trade",
    description: "Detect sharp price moves and ride the trend or mean-revert.",
  },
  {
    name: "News-Driven",
    risk: "High",
    riskColor: "text-red-400",
    avg: "10-40% per event",
    description: "AI analyzes breaking news. Trade before the market reacts.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen grid-bg">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5">
              <div className="live-dot" />
              <span className="text-xs font-mono text-brand-400 tracking-wider uppercase">
                Live — Processing 340+ trades/hour
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-center text-5xl sm:text-6xl lg:text-8xl font-display font-900 leading-[0.95] tracking-tight mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-white">Trade Prediction</span>
            <br />
            <span className="text-gradient">Markets on Autopilot</span>
          </h1>

          <p
            className="text-center text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            AI-powered bot that trades Polymarket 24/7. Arbitrage, momentum, and
            convergence strategies with sub-50ms execution speed.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/pricing" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
              Start Trading
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
              <Activity className="w-4 h-4" />
              View Live Dashboard
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="card-glass rounded-xl p-5 text-center transition-all duration-300"
              >
                <div
                  className="text-2xl sm:text-3xl font-bold text-white mb-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TERMINAL PREVIEW ===== */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card-glass rounded-2xl overflow-hidden border border-white/5">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/30">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span
                className="text-xs text-slate-500 ml-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                polybot — live trading session
              </span>
            </div>
            {/* Terminal body */}
            <div
              className="p-6 text-sm leading-relaxed overflow-x-auto"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <p className="text-slate-500">
                [14:32:01.234] INFO &nbsp;Bot started — LIVE mode
              </p>
              <p className="text-slate-500">
                [14:32:01.891] INFO &nbsp;Scanning 847 active markets...
              </p>
              <p className="text-slate-500">
                [14:32:02.044] INFO &nbsp;Subscribed to 312 assets via WebSocket
              </p>
              <p className="text-brand-400">
                [14:32:14.887] INFO &nbsp;ARB SIGNAL: YES@0.421 + NO@0.563 =
                0.984 &lt; 1.0 | profit: $0.0157
              </p>
              <p className="text-white">
                [14:32:14.934] INFO &nbsp;ORDER PLACED: BUY 120@0.421 — latency
                47ms
              </p>
              <p className="text-white">
                [14:32:14.936] INFO &nbsp;ORDER PLACED: BUY 120@0.563 — latency
                49ms
              </p>
              <p className="text-brand-400">
                [14:32:41.221] INFO &nbsp;CONV: price=0.943, expected
                return=5.2%
              </p>
              <p className="text-white">
                [14:32:41.268] INFO &nbsp;ORDER PLACED: BUY 85@0.943 — latency
                47ms
              </p>
              <p className="text-yellow-400">
                [14:33:12.003] INFO &nbsp;MOMENTUM: +12.3% rise in 60s — trend
                following
              </p>
              <p className="text-slate-500">
                [14:35:00.000] INFO &nbsp;--- STATUS: positions=4 |
                exposure=$387.20 | PnL=+$23.41 ---
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-5xl font-display font-800 text-white mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Built for <span className="text-gradient">Speed & Profit</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Every component optimized for the fastest possible execution on
              Polymarket's CLOB.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                className="card-glass rounded-2xl p-7 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-5 group-hover:bg-brand-500/20 transition-colors">
                  <feat.icon className="w-6 h-6 text-brand-400" />
                </div>
                <h3
                  className="text-lg font-semibold text-white mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STRATEGIES ===== */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-5xl font-display font-800 text-white mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Four Strategies.{" "}
              <span className="text-gradient">One Platform.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {strategies.map((strat, i) => (
              <div
                key={i}
                className="card-glass rounded-2xl p-7 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {strat.name}
                  </h3>
                  <span className={`text-xs font-mono ${strat.riskColor}`}>
                    Risk: {strat.risk}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  {strat.description}
                </p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-400" />
                  <span
                    className="text-sm text-brand-400 font-mono"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Avg return: {strat.avg}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-5xl font-display font-800 text-white mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Live in <span className="text-gradient">3 Minutes</span>
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Choose Your Plan",
                desc: "Pick a plan that matches your trading volume. Start with Starter for $49/mo.",
              },
              {
                step: "02",
                title: "Connect Your Wallet",
                desc: "Link your Polygon wallet with USDC. We never hold your funds — fully non-custodial.",
              },
              {
                step: "03",
                title: "Configure & Launch",
                desc: "Select strategies, set risk limits, and hit Start. Watch your bot trade in real-time.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-6 items-start card-glass rounded-2xl p-7"
              >
                <div
                  className="text-4xl font-black text-brand-500/20 shrink-0"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.step}
                </div>
                <div>
                  <h3
                    className="text-xl font-bold text-white mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-5xl font-display font-800 text-white mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to <span className="text-gradient">Automate Profit?</span>
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Join traders already using PolyBot to find and execute opportunities
            on Polymarket 24/7.
          </p>
          <Link
            href="/pricing"
            className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-5"
          >
            View Pricing
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
