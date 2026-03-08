"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Menu,
  Settings,
  Shield,
  Target,
  Zap,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Optional: show bot status in header (e.g. connected/offline) */
  headerExtra?: React.ReactNode;
};

const NAV_ITEMS = [
  { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
  { icon: Target, label: "Markets", href: "/markets" },
  { icon: Zap, label: "Strategies", href: "/strategies" },
  { icon: Shield, label: "Risk", href: "/risk" },
  { icon: Settings, label: "Account", href: "/account" },
];

export function DashboardShell({ children, title, subtitle, headerExtra }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface-950/95 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-brand-400" />
          </div>
          <span className="font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Poly<span className="text-brand-400">Bot</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileNavOpen((o) => !o)}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-16 bg-surface-950/98 backdrop-blur-xl">
          <nav className="flex flex-col p-4 gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                  pathname === item.href
                    ? "bg-brand-500/10 text-brand-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-white/5">
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </div>
          </nav>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-surface-950 p-4">
        <Link href="/" className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-brand-400" />
          </div>
          <span
            className="text-lg font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Poly<span className="text-brand-400">Bot</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
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
            <UserButton
              afterSignOutUrl="/"
              appearance={{ elements: { avatarBox: "w-8 h-8" } }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">Account</p>
              <p className="text-xs text-slate-500">Manage wallet & bot</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto pt-14 lg:pt-0">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-surface-900/90 backdrop-blur-xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-lg font-bold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {headerExtra}
          </div>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
