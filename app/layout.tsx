import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const metadata: Metadata = {
  metadataBase: new URL("https://polybot.uk"),
  title: "PolyBot — AI-Powered Prediction Market Trading",
  description:
    "Automated trading bot for Polymarket. Arbitrage, momentum, and convergence strategies with real-time WebSocket execution. Start earning with prediction markets.",
  keywords: [
    "Polymarket",
    "trading bot",
    "prediction markets",
    "arbitrage",
    "automated trading",
    "crypto",
  ],
  openGraph: {
    title: "PolyBot — AI-Powered Prediction Market Trading",
    description: "Automated Polymarket trading. Arbitrage. Speed. Profit.",
    type: "website",
    url: "https://polybot.uk",
    siteName: "PolyBot",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: "#00e676",
          colorBackground: "#0c1222",
          colorInputBackground: "rgba(255,255,255,0.05)",
          colorInputText: "#e2e8f0",
          colorText: "#e2e8f0",
          colorTextSecondary: "#94a3b8",
          colorDanger: "#ef4444",
          borderRadius: "0.75rem",
          fontFamily: "'Outfit', sans-serif",
          fontSize: "14px",
        },
        elements: {
          card: "bg-[#0c1222] border border-white/10 shadow-2xl backdrop-blur-xl",
          headerTitle: "text-white font-bold",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton:
            "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-[#00e676]/30 transition-all",
          socialButtonsBlockButtonText: "text-slate-300 font-medium",
          formFieldLabel: "text-slate-400 text-xs uppercase tracking-wider",
          formFieldInput:
            "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#00e676]/50 focus:ring-1 focus:ring-[#00e676]/20",
          formButtonPrimary:
            "bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#070b14] font-semibold hover:shadow-lg hover:shadow-[#00e676]/25 transition-all",
          footerActionLink: "text-[#00e676] hover:text-[#69f0ae] font-medium",
          footerActionText: "text-slate-500",
          dividerLine: "bg-white/5",
          dividerText: "text-slate-500",
          userButtonAvatarBox: "w-8 h-8",
          userButtonPopoverCard:
            "bg-[#0c1222] border border-white/10 backdrop-blur-xl",
          userButtonPopoverActionButton: "text-slate-300 hover:bg-white/5",
          userButtonPopoverActionButtonText: "text-slate-300",
          userButtonPopoverFooter: "border-t border-white/5",
          identityPreviewEditButton: "text-[#00e676]",
          badge: "bg-[#00e676]/10 text-[#00e676]",
          alert: "bg-red-500/10 border-red-500/20",
          alertText: "text-red-400",
        },
      }}
      signInUrl="/login"
      signUpUrl="/signup"
      afterSignOutUrl="/"
    >
      <html lang="en" className="dark">
        <body className="noise-overlay">{children}</body>
      </html>
    </ClerkProvider>
  );
}
