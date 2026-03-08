import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Activity, Check } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-6 py-16 relative">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-brand-400" />
          </div>
          <span
            className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Poly<span className="text-brand-400">Bot</span>
          </span>
        </Link>
      </div>

      {/* Clerk SignUp component */}
      <div className="relative z-10">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#0c1222]/80 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl",
            },
          }}
          routing="hash"
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
        />
      </div>

      {/* Benefits below */}
      <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center gap-6">
        {["7-day free trial", "No credit card required", "Cancel anytime"].map(
          (item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs text-slate-400">{item}</span>
            </div>
          )
        )}
      </div>

      {/* Back to home */}
      <div className="relative z-10 mt-4">
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
