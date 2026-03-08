import Link from "next/link";
import { Shield } from "lucide-react";

export default function RiskPage() {
  return (
    <main className="min-h-screen bg-surface-900 px-6 py-24">
      <div className="max-w-3xl mx-auto card-glass rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-brand-400" />
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Risk
          </h1>
        </div>
        <p className="text-slate-400 mb-6">
          Risk dashboard is under development. Limits are currently enforced in backend bot config.
        </p>
        <Link href="/dashboard" className="btn-primary inline-flex">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
