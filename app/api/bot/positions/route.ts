import { NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/lib/server/account-state";
import { getInternalBotPositions } from "@/lib/server/bot-backend";
import { normalizePositions, type BotPositionResponseItem } from "@/lib/server/bot-data";
import { fetchMarketsByTokenIds, looksLikeTokenId } from "@/lib/server/gamma-markets";
import { checkRateLimit } from "@/lib/server/rate-limit";

async function enrichPositionsWithGamma(positions: BotPositionResponseItem[]): Promise<BotPositionResponseItem[]> {
  const tokenIds = positions
    .filter((p) => !p.question && looksLikeTokenId(p.market))
    .map((p) => p.market);
  if (tokenIds.length === 0) return positions;

  const lookup = await fetchMarketsByTokenIds(tokenIds);
  if (lookup.size === 0) return positions;

  return positions.map((p) => {
    if (p.question) return p;
    const info = looksLikeTokenId(p.market) ? lookup.get(p.market) : undefined;
    if (!info) return p;
    return { ...p, question: info.question, outcome: info.outcome };
  });
}

export async function GET() {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const rate = await checkRateLimit(`bot_positions:${userId}`, 120, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many positions requests. Please wait.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  const result = await getInternalBotPositions(userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, code: result.code }, { status: 502 });
  }

  const normalized = normalizePositions(result.data);
  const enriched = await enrichPositionsWithGamma(normalized);
  return NextResponse.json({ positions: enriched });
}
