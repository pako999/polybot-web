import { NextRequest, NextResponse } from "next/server";
import { recoverMessageAddress } from "viem";
import { requireAuthenticatedUserId, connectWalletForUser, isValidWalletAddress } from "@/lib/server/account-state";
import { isValidChallengeMessage } from "@/lib/server/wallet-challenge";

function createWalletToken(): string {
  return `wb_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  let body: { walletAddress?: string; message?: string; signature?: string };
  try {
    body = (await req.json()) as { walletAddress?: string; message?: string; signature?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", code: "INVALID_JSON" }, { status: 400 });
  }

  const { walletAddress, message, signature } = body;
  if (
    typeof walletAddress !== "string" ||
    !isValidWalletAddress(walletAddress) ||
    typeof message !== "string" ||
    typeof signature !== "string"
  ) {
    return NextResponse.json(
      { error: "walletAddress, message, and signature are required.", code: "INVALID_WALLET_VERIFY_PAYLOAD" },
      { status: 400 }
    );
  }

  if (!isValidChallengeMessage(message)) {
    return NextResponse.json({ error: "Invalid or expired challenge message.", code: "INVALID_OR_EXPIRED_CHALLENGE" }, { status: 400 });
  }

  try {
    const recovered = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Signature does not match wallet address.", code: "WALLET_SIGNATURE_MISMATCH" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid signature.", code: "INVALID_SIGNATURE" }, { status: 400 });
  }

  await connectWalletForUser(userId, walletAddress, null);

  const authToken = createWalletToken();

  return NextResponse.json({
    ok: true,
    authToken,
    user: { id: userId, walletAddress: walletAddress.toLowerCase() },
    walletLinked: true,
  });
}
