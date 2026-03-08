import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  connectWalletForUser,
  requireAuthenticatedUserId,
} from "@/lib/server/account-state";
import { isCrossSiteRequest } from "@/lib/server/security";
import { consumeChallengeForUser } from "@/app/api/wallet/challenge/route";

type VerifyPayload = {
  walletAddress?: unknown;
  message?: unknown;
  signature?: unknown;
};

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  let body: VerifyPayload;
  try {
    body = (await req.json()) as VerifyPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(body.walletAddress)) {
    return NextResponse.json({ error: "Invalid walletAddress." }, { status: 400 });
  }
  if (typeof body.message !== "string" || !body.message) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 });
  }
  if (typeof body.signature !== "string" || !body.signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const challenge = consumeChallengeForUser(userId);
  if (!challenge) {
    return NextResponse.json({ error: "No pending challenge. Request a new one." }, { status: 400 });
  }

  if (challenge.walletAddress !== body.walletAddress.toLowerCase()) {
    return NextResponse.json({ error: "Wallet address mismatch." }, { status: 400 });
  }

  if (challenge.message !== body.message) {
    return NextResponse.json({ error: "Challenge message mismatch." }, { status: 400 });
  }

  let recoveredAddress: string;
  try {
    recoveredAddress = verifyMessage(body.message, body.signature).toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (recoveredAddress !== body.walletAddress.toLowerCase()) {
    return NextResponse.json({ error: "Signature does not match wallet address." }, { status: 403 });
  }

  const state = await connectWalletForUser(userId, body.walletAddress, null);

  console.info("[security-audit] wallet_verified_and_connected", {
    userId,
    walletAddress: state.walletAddress,
  });

  return NextResponse.json({
    ok: true,
    authToken: "",
    walletLinked: true,
    user: {
      id: userId,
      walletAddress: state.walletAddress,
    },
  });
}
