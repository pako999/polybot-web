import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId, isValidWalletAddress } from "@/lib/server/account-state";
import { buildChallengeMessage } from "@/lib/server/wallet-challenge";

const MESSAGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
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

  if (typeof body.walletAddress !== "string" || !isValidWalletAddress(body.walletAddress)) {
    return NextResponse.json(
      { error: "walletAddress must be a valid EVM address." },
      { status: 400 }
    );
  }

  const message = buildChallengeMessage();
  return NextResponse.json({
    nonce: message,
    message,
    expiresAt: new Date(Date.now() + MESSAGE_TTL_MS).toISOString(),
  });
}
