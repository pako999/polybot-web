import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/lib/server/account-state";
import { isCrossSiteRequest } from "@/lib/server/security";

const NONCE_TTL_MS = 5 * 60 * 1000;

type StoredChallenge = {
  nonce: string;
  walletAddress: string;
  message: string;
  expiresAt: number;
};

const pendingChallenges = new Map<string, StoredChallenge>();

function pruneExpired() {
  const now = Date.now();
  pendingChallenges.forEach((entry, key) => {
    if (entry.expiresAt < now) pendingChallenges.delete(key);
  });
}

export function getChallengeForUser(userId: string): StoredChallenge | null {
  pruneExpired();
  return pendingChallenges.get(userId) ?? null;
}

export function consumeChallengeForUser(userId: string): StoredChallenge | null {
  const challenge = getChallengeForUser(userId);
  if (challenge) pendingChallenges.delete(userId);
  return challenge;
}

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  let body: { walletAddress?: unknown };
  try {
    body = (await req.json()) as { walletAddress?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(body.walletAddress)) {
    return NextResponse.json({ error: "walletAddress must be a valid EVM address." }, { status: 400 });
  }

  pruneExpired();

  const nonce = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + NONCE_TTL_MS;
  const message = [
    "PolyBot Wallet Verification",
    "",
    `Wallet: ${body.walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued: ${new Date().toISOString()}`,
  ].join("\n");

  const challenge: StoredChallenge = {
    nonce,
    walletAddress: body.walletAddress.toLowerCase(),
    message,
    expiresAt,
  };
  pendingChallenges.set(userId, challenge);

  return NextResponse.json({
    nonce,
    message,
    expiresAt: new Date(expiresAt).toISOString(),
  });
}
