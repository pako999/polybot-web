"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Zap, Crown, Rocket } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Starter",
    icon: Zap,
    description: "For beginners exploring prediction market trading.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      "1 active strategy",
      "Arbitrage scanner",
      "Up to $500 position limit",
      "5 markets tracked",
      "Basic dashboard",
      "Email support",
      "Paper trading mode",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    icon: Rocket,
    description: "For serious traders who want full automation.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    features: [
      "All 4 strategies",
      "Unlimited markets tracked",
      "Up to $5,000 position limit",
      "AI news analysis (Claude)",
      "Real-time WebSocket feed",
      "Advanced risk controls",
      "Telegram alerts",
      "Priority support",
      "Custom strategy params",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    icon: Crown,
    description: "For funds and professional trading operations.",
    monthlyPrice: 499,
    yearlyPrice: 399,
    features: [
      "Everything in Pro",
      "Unlimited position limits",
      "Dedicated VPS hosting",
      "Custom strategy development",
      "Multi-wallet support",
      "API access & webhooks",
      "White-label dashboard",
      "1-on-1 onboarding",
      "SLA guarantee (99.9%)",
      "Direct Slack support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    q: "Is this non-custodial?",
    a: "Yes. PolyBot never holds your funds. You connect your own Polygon wallet and the bot trades through signed orders. You can revoke access anytime.",
  },
  {
    q: "Do I need crypto experience?",
    a: "Basic familiarity with crypto wallets and USDC on Polygon is helpful. Our setup guide walks you through everything in under 5 minutes.",
  },
  {
    q: "What's the minimum investment?",
    a: "You can start with as little as $100 USDC in your wallet. We recommend at least $500 for meaningful returns.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel your subscription anytime from your dashboard. Your bot will gracefully close all positions and stop trading.",
  },
  {
    q: "What are the actual returns?",
    a: "Returns vary based on market conditions and strategy selection. Arbitrage averages 2-5% per trade, convergence 3-8%. Past performance doesn't guarantee future results.",
  },
  {
    q: "How fast is the execution?",
    a: "Average order-to-fill latency is 47ms on our managed infrastructure. This is faster than 99% of manual traders on Polymarket.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <main className="min-h-screen grid-bg">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/8 rounded-full blur-[120px] pointer-events-none" />

        <h1
          className="text-4xl sm:text-6xl font-display font-900 text-white mb-4 relative z-10"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Simple, Transparent{" "}
          <span className="text-gradient">Pricing</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-lg mx-auto mb-10 relative z-10">
          Start with a 7-day free trial. No credit card required.
          Cancel anytime.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12 relative z-10">
          <span
            className={`text-sm font-medium ${!annual ? "text-white" : "text-slate-500"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
              annual ? "bg-brand-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                annual ? "translate-x-7.5 left-auto right-0.5" : "left-0.5"
              }`}
              style={{
                transform: annual ? "translateX(28px)" : "translateX(0)",
                left: "2px",
              }}
            />
          </button>
          <span
            className={`text-sm font-medium ${annual ? "text-white" : "text-slate-500"}`}
          >
            Yearly{" "}
            <span className="text-brand-400 text-xs font-mono">SAVE 20%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 border transition-all duration-300 relative ${
                plan.popular
                  ? "pricing-popular border-brand-500/30"
                  : "card-glass border-white/5"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-bold bg-brand-500 text-surface-900 tracking-wider uppercase">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.popular ? "bg-brand-500/20" : "bg-white/5"
                  }`}
                >
                  <plan.icon
                    className={`w-5 h-5 ${
                      plan.popular ? "text-brand-400" : "text-slate-400"
                    }`}
                  />
                </div>
                <h3
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {plan.name}
                </h3>
              </div>

              <p className="text-sm text-slate-400 mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-5xl font-black text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    ${annual ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                {annual && (
                  <p
                    className="text-xs text-brand-400 mt-1"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    ${plan.yearlyPrice * 12}/year — save $
                    {(plan.monthlyPrice - plan.yearlyPrice) * 12}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-300">{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/signup"
                className={`block text-center rounded-lg py-3.5 font-semibold text-sm transition-all duration-200 ${
                  plan.popular
                    ? "btn-primary"
                    : "btn-secondary"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-3xl font-display font-800 text-white text-center mb-12"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="card-glass rounded-xl p-6">
                <h3
                  className="text-base font-semibold text-white mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {faq.q}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
