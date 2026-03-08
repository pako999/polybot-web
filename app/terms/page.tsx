import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen grid-bg">
      <Navbar />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: "var(--font-display)" }}>
            Terms of Service
          </h1>
          <div className="prose-custom space-y-6 text-slate-300 text-sm leading-relaxed">
            <p className="text-slate-400 text-xs font-mono">Last updated: March 2026</p>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">1. Service Description</h2>
              <p>PolyBot is an automated trading bot for prediction markets (primarily Polymarket). The service provides algorithmic trading strategies, portfolio management tools, and a web dashboard for monitoring bot activity.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">2. Non-Custodial</h2>
              <p>PolyBot is non-custodial. We never hold, custody, or have direct access to your funds. All trades are executed through signed orders from your connected wallet. You maintain full control of your assets at all times.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">3. Risk Acknowledgment</h2>
              <p>Trading prediction markets involves significant risk of loss. Automated trading amplifies both potential gains and losses. Past performance of any strategy does not guarantee future results. You should only trade with funds you can afford to lose.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">4. No Financial Advice</h2>
              <p>PolyBot does not provide financial, investment, or legal advice. The strategies and tools provided are for informational and automation purposes only. You are solely responsible for your trading decisions.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">5. Account & Access</h2>
              <p>You are responsible for maintaining the security of your account credentials and wallet. PolyBot is not liable for unauthorized access resulting from compromised wallets or credentials.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">6. Subscription & Billing</h2>
              <p>Paid plans are billed monthly or annually. You may cancel at any time. Upon cancellation, your bot will gracefully close open positions and cease trading. Refunds are handled on a case-by-case basis.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">7. Limitation of Liability</h2>
              <p>PolyBot is provided &quot;as is&quot; without warranties. We are not liable for trading losses, missed opportunities, technical downtime, or third-party service failures. Our total liability is limited to the subscription fees paid in the preceding 12 months.</p>
            </div>

            <div className="card-glass rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">8. Changes to Terms</h2>
              <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance. Material changes will be communicated via email or dashboard notification.</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
