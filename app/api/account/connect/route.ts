import { NextRequest, NextResponse } from "next/server";
import {
  connectWalletForUser,
  isValidWalletAddress,
  requireAuthenticatedUserId,
} from "@/lib/server/account-state";
import { isCrossSiteRequest } from "@/lib/server/security";

type ConnectPayload = {
  walletAddress?: unknown;
  chainId?: unknown;
};

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  let payload: ConnectPayload;
  try {
    payload = (await req.json()) as ConnectPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof payload.walletAddress !== "string" || !isValidWalletAddress(payload.walletAddress)) {
    return NextResponse.json(
      { error: "walletAddress must be a valid EVM address." },
      { status: 400 }
    );
  }

  const chainId = typeof payload.chainId === "string" ? payload.chainId : null;
  const state = await connectWalletForUser(userId, payload.walletAddress, chainId);
  console.info("[security-audit] wallet_connected", {
    userId,
    walletAddress: state.walletAddress,
    chainId: state.chainId,
  });

  return NextResponse.json({
    message: "Wallet connected.",
    connected: true,
    walletAddress: state.walletAddress,
    chainId: state.chainId,
    botRunning: state.botRunning,
  });
}
