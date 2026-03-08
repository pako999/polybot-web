import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-surface-900 px-6 py-24">
      <div className="max-w-3xl mx-auto card-glass rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-brand-400" />
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Markets
          </h1>
        </div>
        <p className="text-slate-400 mb-6">
          Markets module is being finalized. Use Dashboard and Account controls for live testing.
        </p>
        <Link href="/dashboard" className="btn-primary inline-flex">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
