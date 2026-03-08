"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Loader2, Play, Power, Unplug } from "lucide-react";
import {
  clearAuthSession,
  getBotStatus,
  getCachedWalletAddress,
  postAccountDisconnect,
  postBotStart,
  postBotStop,
  postWalletChallenge,
  postWalletVerify,
  type BotConfig,
  type BotStatusResponse,
} from "@/lib/api/client";
import { getWalletOptions, type WalletOption } from "@/lib/wallet/providers";

function shortenAddress(value: string | null) {
  if (!value) return "Not connected";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unexpected error. Please try again.";
}

const DEFAULT_BOT_CONFIG: BotConfig = {
  maxPositionUsdc: 100,
  maxExposureUsdc: 1000,
  minArbProfit: 0.01,
  kellyFraction: 0.2,
  stopLossPct: 0.1,
  minMarketVolume: 1000,
  minMarketLiquidity: 1000,
  paperTrade: true,
};

export default function AccountPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [botRunning, setBotRunning] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatusResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<WalletOption["id"] | null>(null);

  const connected = Boolean(walletAddress);
  const hasWalletProvider = walletOptions.length > 0;
  const selectedWallet = useMemo(
    () => walletOptions.find((option) => option.id === selectedWalletId) || walletOptions[0],
    [walletOptions, selectedWalletId]
  );

  const statusPill = useMemo(
    () => ({
      text: connected ? "Connected" : "Not connected",
      className: connected
        ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
        : "bg-red-500/10 text-red-400 border-red-500/30",
    }),
    [connected]
  );

  const hydrateFromStatus = useCallback(async () => {
    setInitialLoading(true);
    try {
      const status = await getBotStatus();
      setBotStatus(status);
      setBotRunning(Boolean(status.running));
      setWalletAddress(status.walletAddress || getCachedWalletAddress());
    } catch (error) {
      setWalletAddress(getCachedWalletAddress());
      const message = normalizeError(error);
      if (message.toLowerCase() !== "unauthorized") {
        setNotice({ type: "error", message });
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const clearWalletState = useCallback(() => {
    setWalletAddress(null);
    setChainId(null);
    setBotRunning(false);
    setBotStatus(null);
    clearAuthSession();
  }, []);

  const handleConnectWallet = useCallback(async () => {
    if (!selectedWallet?.provider) {
      setNotice({
        type: "error",
        message: "No supported wallet provider detected. Install a wallet extension and refresh.",
      });
      return;
    }

    const provider = selectedWallet.provider;
    setConnectLoading(true);
    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const selectedAccount = accounts?.[0];
      if (!selectedAccount) {
        throw new Error("No wallet account selected.");
      }

      const nextChainId = (await provider.request({
        method: "eth_chainId",
      })) as string;
      setChainId(nextChainId || null);

      const { message } = await postWalletChallenge({
        walletAddress: selectedAccount,
      });

      const signature = (await provider.request({
        method: "personal_sign",
        params: [message, selectedAccount],
      })) as string;

      await postWalletVerify({
        walletAddress: selectedAccount,
        message,
        signature,
      });

      setWalletAddress(selectedAccount);
      await hydrateFromStatus();
      setNotice({ type: "success", message: `${selectedWallet.label} connected and account linked.` });
    } catch (error) {
      const maybeError = error as { code?: number; message?: string };
      if (maybeError?.code === 4001) {
        setNotice({ type: "error", message: "Wallet request/signature was rejected." });
      } else {
        setNotice({ type: "error", message: normalizeError(error) });
      }
    } finally {
      setConnectLoading(false);
    }
  }, [hydrateFromStatus, selectedWallet]);

  const handleDisconnectWallet = useCallback(async () => {
    setDisconnectLoading(true);
    try {
      await postAccountDisconnect();
      clearWalletState();
      setNotice({ type: "success", message: "Wallet disconnected." });
    } catch (error) {
      setNotice({ type: "error", message: normalizeError(error) });
    } finally {
      setDisconnectLoading(false);
    }
  }, [clearWalletState]);

  const handleStartBot = useCallback(async () => {
    setStartLoading(true);
    try {
      await postBotStart({ config: DEFAULT_BOT_CONFIG });
      setBotRunning(true);
      await hydrateFromStatus();
      setNotice({
        type: "success",
        message: "Bot start request sent.",
      });
    } catch (error) {
      setNotice({ type: "error", message: normalizeError(error) });
    } finally {
      setStartLoading(false);
    }
  }, [hydrateFromStatus]);

  const handleStopBot = useCallback(async () => {
    setStopLoading(true);
    try {
      await postBotStop();
      setBotRunning(false);
      await hydrateFromStatus();
      setNotice({ type: "success", message: "Bot stopped." });
    } catch (error) {
      setNotice({ type: "error", message: normalizeError(error) });
    } finally {
      setStopLoading(false);
    }
  }, [hydrateFromStatus]);

  useEffect(() => {
    hydrateFromStatus();
  }, [hydrateFromStatus]);

  useEffect(() => {
    const discovered = getWalletOptions();
    setWalletOptions(discovered);
    if (discovered.length && !selectedWalletId) {
      setSelectedWalletId(discovered[0].id);
    }
  }, [selectedWalletId]);

  useEffect(() => {
    const provider = selectedWallet?.provider;
    if (!provider) return;

    const handleAccountsChanged = async (accountsValue: unknown) => {
      const accounts = Array.isArray(accountsValue) ? (accountsValue as string[]) : [];
      const nextAddress = accounts[0];

      if (!nextAddress) {
        clearWalletState();
        setNotice({ type: "error", message: "Wallet account disconnected in provider." });
        return;
      }

      setWalletAddress(nextAddress);
      try {
        const nextChainId = (await provider.request({
          method: "eth_chainId",
        })) as string;
        setChainId(nextChainId || null);
        await hydrateFromStatus();
      } catch (error) {
        setNotice({ type: "error", message: normalizeError(error) });
      }
    };

    const handleChainChanged = (nextChainIdValue: unknown) => {
      const nextChainId = typeof nextChainIdValue === "string" ? nextChainIdValue : null;
      setChainId(nextChainId);
      hydrateFromStatus().catch((error) => {
        setNotice({ type: "error", message: normalizeError(error) });
      });
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, [clearWalletState, hydrateFromStatus, selectedWallet]);

  return (
    <main className="min-h-screen bg-surface-900 px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            Back to Dashboard
          </Link>
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mt-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Account
          </h1>
          <p className="text-slate-400 mt-2">
            Connect your Polymarket wallet and control bot execution from one place.
          </p>
        </div>

        <section className="card-glass rounded-2xl p-6 sm:p-8">
          {initialLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading account status...
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Wallet Status</p>
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${statusPill.className}`}
                  >
                    {statusPill.text}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Connected Address</p>
                  <p className="font-mono text-sm text-white">{shortenAddress(walletAddress)}</p>
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-slate-500 mb-1">Full Wallet Address</p>
                  <p className="font-mono text-white break-all">{walletAddress || "Not connected"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-slate-500 mb-1">Chain ID</p>
                  <p className="font-mono text-white">{chainId || "Unknown"}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500">Bot Status</p>
                  <p className={`font-mono ${botRunning ? "text-brand-400" : "text-slate-300"}`}>
                    {botRunning ? "RUNNING" : "STOPPED"}
                  </p>
                </div>
                <p className="text-slate-300 mt-2">
                  PnL:{" "}
                  <span className="font-mono text-white">
                    {typeof botStatus?.totalPnl === "number" ? `$${botStatus.totalPnl.toFixed(2)}` : "n/a"}
                  </span>
                </p>
                {botStatus?.lastError ? (
                  <p className="text-red-300 mt-2">Last error: {botStatus.lastError}</p>
                ) : null}
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Wallet Provider</p>
                <select
                  value={selectedWallet?.id || ""}
                  onChange={(event) => setSelectedWalletId(event.target.value as WalletOption["id"])}
                  disabled={!walletOptions.length}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 disabled:opacity-60"
                >
                  {walletOptions.length ? (
                    walletOptions.map((option) => (
                      <option key={option.id} value={option.id} className="bg-[#0c1222]">
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-[#0c1222]">
                      No wallet detected
                    </option>
                  )}
                </select>
              </div>

              {!hasWalletProvider && (
                <div className="mt-5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
                  No supported wallet provider found (MetaMask, Coinbase Wallet, Rabby, Brave, Phantom EVM).
                </div>
              )}

              {notice && (
                <div
                  className={`mt-5 rounded-lg px-4 py-3 text-sm border ${
                    notice.type === "success"
                      ? "border-brand-500/30 bg-brand-500/10 text-brand-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {notice.message}
                </div>
              )}

              <div className="mt-7 grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={connectLoading || !hasWalletProvider}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {connectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  Connect Wallet
                </button>

                <button
                  type="button"
                  onClick={handleDisconnectWallet}
                  disabled={disconnectLoading || !connected}
                  className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {disconnectLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unplug className="w-4 h-4" />
                  )}
                  Disconnect Wallet
                </button>

                <button
                  type="button"
                  onClick={handleStartBot}
                  disabled={startLoading || !connected || botRunning}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {startLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Start Bot
                </button>

                <button
                  type="button"
                  onClick={handleStopBot}
                  disabled={stopLoading || !connected || !botRunning}
                  className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {stopLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  Stop Bot
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
