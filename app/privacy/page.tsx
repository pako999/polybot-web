import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen grid-bg">
      <Navbar />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: "var(--font-display)" }}>
            Privacy Policy
          </h1>
          <div className="prose-custom space-y-6 text-slate-300 text-sm leading-relaxed">
            <p className="text-slate-400 text-xs font-mono">Last updated: March 2026</p>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
              <p>We collect information you provide when creating an account (email, name via Clerk authentication), your connected wallet address (public address only), and usage data such as trading activity and bot configuration preferences.</p>
              <p>We do <strong className="text-white">not</strong> collect or store private keys, seed phrases, or wallet passwords. PolyBot is non-custodial.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">2. How We Use Your Information</h2>
              <p>Your information is used to provide and improve the PolyBot trading service, execute bot operations on your behalf, send transaction notifications and alerts, and provide customer support.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">3. Data Storage & Security</h2>
              <p>Account data is stored securely via Clerk (SOC 2 compliant). Bot configuration and state are stored in encrypted databases. All API communications use TLS 1.3 encryption.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">4. Third-Party Services</h2>
              <p>We use Clerk for authentication, Polymarket for market data and order execution, and Vercel for hosting. Each service has its own privacy policy governing data it processes.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">5. Your Rights</h2>
              <p>You can request deletion of your account and associated data at any time by disconnecting your wallet and contacting support. You may also export your trading history from the dashboard.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">6. Contact</h2>
              <p>For privacy-related inquiries, contact us through the support channels listed in your dashboard.</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
