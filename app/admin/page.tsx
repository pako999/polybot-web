"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, Square } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

type AdminUserRow = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  walletAddress: string | null;
  botRunning: boolean;
  botLifecycleState: string;
  liveModeEligible: boolean;
  liveModeAcknowledgedAt: string | null;
  lastEvent: { at: string; type: string; message: string } | null;
  eventCount: number;
};

type AdminDetailResponse = {
  userId: string;
  accountState: {
    walletAddress: string | null;
    chainId: string | null;
    botRunning: boolean;
    botLifecycleState: string;
    liveModeAcknowledgedAt: string | null;
    botConfig: Record<string, unknown>;
    botEvents: Array<{ at: string; type: string; message: string }>;
  };
  backendStatus: Record<string, unknown> | null;
  backendError: { code: string; message: string } | null;
};

type BackendDiagnosticsResponse = {
  userId: string;
  internalBaseUrlConfigured: boolean;
  internalApiTokenConfigured: boolean;
  internalBaseUrlHost: string | null;
  probeOk: boolean;
  probeError: { code: string; message: string; upstreamStatus: number | null } | null;
  probeStatus: Record<string, unknown> | null;
};

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<BackendDiagnosticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/bot-runs", { cache: "no-store" });
      const payload = (await response.json()) as { users?: AdminUserRow[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load admin users.");
      }
      setUsers(payload.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin users.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDiagnostics = useCallback(async (userId: string) => {
    setDiagnosticsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/bot-backend/diagnostics?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as BackendDiagnosticsResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load backend diagnostics.");
      }
      setDiagnostics(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load backend diagnostics.");
    } finally {
      setDiagnosticsLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (userId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/bot-runs?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as AdminDetailResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load user details.");
      }
      setDetail(payload);
      setSelectedUserId(userId);
      await loadDiagnostics(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load user details.");
    } finally {
      setDetailLoading(false);
    }
  }, [loadDiagnostics]);

  const handleAdminStop = useCallback(async () => {
    if (!selectedUserId) return;
    setStopLoading(true);
    try {
      const response = await fetch("/api/admin/bot-runs/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to stop bot.");
      }
      await Promise.all([loadUsers(), loadDetail(selectedUserId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to stop bot.");
    } finally {
      setStopLoading(false);
    }
  }, [loadDetail, loadUsers, selectedUserId]);

  useEffect(() => {
    loadUsers().catch(() => undefined);
  }, [loadUsers]);

  return (
    <DashboardShell title="Admin" subtitle="Debug user bot runs and inspect account state">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-slate-400">
            Admin-only debug tools. Review lifecycle state, config, backend status, and recent events.
          </div>
          <button
            type="button"
            onClick={() => {
              void loadUsers();
              if (selectedUserId) void loadDetail(selectedUserId);
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6">
          <section className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Users</h2>
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : null}
            </div>
            <div className="space-y-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => void loadDetail(user.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                    selectedUserId === user.id
                      ? "border-brand-500/30 bg-brand-500/10"
                      : "border-white/10 bg-black/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{user.email || user.id}</p>
                      <p className="text-xs text-slate-500 truncate">{user.id}</p>
                    </div>
                    <span
                      className={`text-xs font-mono ${
                        user.botLifecycleState === "running"
                          ? "text-brand-300"
                          : user.botLifecycleState === "error"
                            ? "text-red-300"
                            : "text-slate-300"
                      }`}
                    >
                      {user.botLifecycleState}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{user.liveModeEligible ? "live-ready" : "paper-only"}</span>
                    <span>{user.lastEvent?.type || "no-events"}</span>
                  </div>
                </button>
              ))}
              {!loading && users.length === 0 ? (
                <p className="text-sm text-slate-500">No users found.</p>
              ) : null}
            </div>
          </section>

          <section className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">User detail</h2>
              {detailLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : null}
            </div>

            {!detail ? (
              <p className="text-sm text-slate-500">Select a user to inspect bot status, config, and recent events.</p>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-3 text-sm">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-slate-500 mb-1">Lifecycle</p>
                    <p className="text-white font-mono">{detail.accountState.botLifecycleState}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-slate-500 mb-1">Wallet</p>
                    <p className="text-white font-mono break-all">{detail.accountState.walletAddress || "not connected"}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-slate-500 mb-1">Backend status</p>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(detail.backendStatus || detail.backendError, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-slate-500">Backend diagnostics</p>
                      {diagnosticsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : null}
                    </div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(diagnostics, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-slate-500 mb-1">Saved config</p>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(detail.accountState.botConfig, null, 2)}
                    </pre>
                  </div>
                </div>

                {detail.backendError ? (
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>{detail.backendError.message}</div>
                  </div>
                ) : null}

                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Recent events</h3>
                  <div className="space-y-2">
                    {detail.accountState.botEvents.map((event) => (
                      <div key={`${event.at}-${event.type}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-brand-300 font-mono">{event.type}</span>
                          <span className="text-xs text-slate-500">{new Date(event.at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1">{event.message}</p>
                      </div>
                    ))}
                    {detail.accountState.botEvents.length === 0 ? (
                      <p className="text-sm text-slate-500">No recent events.</p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleAdminStop()}
                  disabled={stopLoading}
                  className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {stopLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                  Admin Stop Bot
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
