"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, Menu, X } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
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

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="redirect">
              <button className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
                Log in
              </button>
            </SignInButton>
            <Link href="/signup" className="btn-primary text-sm px-5 py-2.5">
              Get Started
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="btn-primary text-sm px-5 py-2.5"
            >
              Dashboard
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border-2 border-[#00e676]/30",
                },
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-slate-400"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-surface-900/95 backdrop-blur-xl px-6 py-6 space-y-4">
          <Link href="/#features" className="block text-slate-300" onClick={() => setOpen(false)}>
            Features
          </Link>
          <Link href="/pricing" className="block text-slate-300" onClick={() => setOpen(false)}>
            Pricing
          </Link>

          <SignedIn>
            <Link href="/dashboard" className="block text-slate-300" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
          </SignedIn>

          <hr className="border-white/5" />

          <SignedOut>
            <Link href="/login" className="block text-slate-300" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <Link href="/signup" className="btn-primary block text-center" onClick={() => setOpen(false)}>
              Get Started
            </Link>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <span className="text-sm text-slate-400">Your Account</span>
            </div>
          </SignedIn>
        </div>
      )}
    </nav>
  );
}
