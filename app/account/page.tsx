"use client";

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
import { DashboardShell } from "@/components/DashboardShell";

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
  paperBalanceUsdc: 1000,
  minArbProfit: 0.01,
  kellyFraction: 0.2,
  stopLossPct: 0.1,
  minMarketVolume: 1000,
  minMarketLiquidity: 1000,
  paperTrade: true,
  positionSizingMode: "auto",
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

  // Paper mode setup
  const [paperBalanceUsdc, setPaperBalanceUsdc] = useState(1000);
  const [positionSizingMode, setPositionSizingMode] = useState<"auto" | "manual">("auto");
  const [maxPositionUsdc, setMaxPositionUsdc] = useState(100);
  const [maxExposureUsdc, setMaxExposureUsdc] = useState(1000);
  const [kellyFraction, setKellyFraction] = useState(0.2);

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
      const config: BotConfig = {
        ...DEFAULT_BOT_CONFIG,
        paperBalanceUsdc,
        maxPositionUsdc,
        maxExposureUsdc,
        kellyFraction,
        positionSizingMode,
      };
      await postBotStart({ config });
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
  }, [
    hydrateFromStatus,
    paperBalanceUsdc,
    maxPositionUsdc,
    maxExposureUsdc,
    kellyFraction,
    positionSizingMode,
  ]);

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
    <DashboardShell
      title="Account"
      subtitle="Connect your Polymarket wallet and control bot execution"
    >
      <div className="max-w-3xl">
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
                  No wallet detected. You can still start the bot in Paper mode — no real funds.
                </div>
              )}

              {!connected && hasWalletProvider && (
                <div className="mt-5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-300">
                  Paper mode: Start the bot without connecting a wallet. No real money is used.
                </div>
              )}

              <div className="mt-6 card-glass rounded-xl p-5 border border-brand-500/20">
                <p className="text-sm font-medium text-white mb-4">Paper mode setup</p>
                <p className="text-slate-400 text-xs mb-4">
                  Virtual budget and position sizing for testing. No real funds.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Virtual budget (USDC)
                    </label>
                    <input
                      type="number"
                      value={paperBalanceUsdc}
                      onChange={(e) => setPaperBalanceUsdc(Math.max(0, Number(e.target.value) || 0))}
                      min={10}
                      max={1_000_000}
                      step={100}
                      className="w-full max-w-[200px] rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
                    />
                    <p className="text-slate-500 text-xs mt-1">Total virtual USDC to simulate (e.g. 500, 10000)</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                      Position sizing
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sizing"
                          checked={positionSizingMode === "auto"}
                          onChange={() => setPositionSizingMode("auto")}
                          className="accent-brand-500"
                        />
                        <span className="text-sm text-slate-300">Auto (Kelly)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sizing"
                          checked={positionSizingMode === "manual"}
                          onChange={() => setPositionSizingMode("manual")}
                          className="accent-brand-500"
                        />
                        <span className="text-sm text-slate-300">Manual per trade</span>
                      </label>
                    </div>
                    {positionSizingMode === "auto" ? (
                      <div className="mt-3">
                        <label className="block text-xs text-slate-500 mb-1">Kelly fraction (0–1)</label>
                        <input
                          type="number"
                          value={kellyFraction}
                          onChange={(e) =>
                            setKellyFraction(Math.min(1, Math.max(0, Number(e.target.value) || 0)))
                          }
                          min={0.05}
                          max={1}
                          step={0.05}
                          className="w-full max-w-[120px] rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
                        />
                        <p className="text-slate-500 text-xs mt-1">Bot auto-sizes based on edge (0.2 = 20% of Kelly)</p>
                      </div>
                    ) : (
                      <div className="mt-3 grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Max per trade (USDC)</label>
                          <input
                            type="number"
                            value={maxPositionUsdc}
                            onChange={(e) => setMaxPositionUsdc(Math.max(1, Number(e.target.value) || 0))}
                            min={1}
                            max={10000}
                            step={10}
                            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Max total exposure (USDC)</label>
                          <input
                            type="number"
                            value={maxExposureUsdc}
                            onChange={(e) => setMaxExposureUsdc(Math.max(10, Number(e.target.value) || 0))}
                            min={10}
                            max={100000}
                            step={100}
                            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                  disabled={startLoading || botRunning}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {startLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Start Bot (Paper)
                </button>

                <button
                  type="button"
                  onClick={handleStopBot}
                  disabled={stopLoading || !botRunning}
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
    </DashboardShell>
  );
}
