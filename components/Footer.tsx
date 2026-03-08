import Link from "next/link";
import { Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <span
                className="text-lg font-bold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Poly<span className="text-brand-400">Bot</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI-powered prediction market
              <br />
              trading automation.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Product
            </h4>
            <div className="space-y-2">
              <Link href="/#features" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Pricing
              </Link>
              <Link href="/dashboard" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Resources
            </h4>
            <div className="space-y-2">
              <Link href="#" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Documentation
              </Link>
              <Link href="#" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                API Reference
              </Link>
              <Link href="#" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Status
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Legal
            </h4>
            <div className="space-y-2">
              <Link href="#" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Privacy
              </Link>
              <Link href="#" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Terms
              </Link>
              <Link href="#" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Risk Disclosure
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} PolyBot. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            Trading involves risk. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
