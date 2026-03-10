/**
 * Polymarket Gamma API - resolve CLOB token IDs to market question/outcome.
 * Used as fallback when the bot backend does not provide question/outcome.
 */

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

type GammaMarket = {
  question?: string;
  clobTokenIds?: string;
  outcomes?: string;
};

function parseClobTokenIds(raw: string | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseOutcomes(raw: string | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Returns true if the string looks like a Polymarket CLOB token ID (long numeric).
 */
export function looksLikeTokenId(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  return /^\d{50,}$/.test(value.trim());
}

/**
 * Fetch market info from Gamma API by CLOB token IDs.
 * Returns a map: token_id -> { question, outcome }.
 */
export async function fetchMarketsByTokenIds(
  tokenIds: string[]
): Promise<Map<string, { question: string; outcome: string }>> {
  const result = new Map<string, { question: string; outcome: string }>();
  const unique = [...new Set(tokenIds.filter((id) => id && id.length > 40))];
  if (unique.length === 0) return result;

  // Gamma API accepts clob_token_ids as query param; multiple values = multiple params
  const params = new URLSearchParams();
  params.set("closed", "false");
  params.set("limit", "100");
  unique.forEach((id) => params.append("clob_token_ids", id));

  try {
    const res = await fetch(`${GAMMA_API_BASE}/markets?${params.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return result;

    const markets = (await res.json()) as GammaMarket[];
    if (!Array.isArray(markets)) return result;

    for (const m of markets) {
      const question = m.question?.trim();
      if (!question) continue;

      const ids = parseClobTokenIds(m.clobTokenIds);
      const outcomes = parseOutcomes(m.outcomes);

      for (let i = 0; i < ids.length; i++) {
        const tokenId = ids[i];
        const outcome = outcomes[i] ?? (i === 0 ? "Yes" : "No");
        result.set(tokenId, { question, outcome });
      }
    }
  } catch {
    // Silently fail - enrichment is best-effort
  }

  return result;
}
