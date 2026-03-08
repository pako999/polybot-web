import Link from "next/link";
import { Zap } from "lucide-react";

export default function StrategiesPage() {
  return (
    <main className="min-h-screen bg-surface-900 px-6 py-24">
      <div className="max-w-3xl mx-auto card-glass rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-brand-400" />
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Strategies
          </h1>
        </div>
        <p className="text-slate-400 mb-6">
          Strategy controls are coming next. Current bot start/stop testing is available in Account.
        </p>
        <Link href="/account" className="btn-primary inline-flex">
          Open Account
        </Link>
      </div>
    </main>
  );
}
