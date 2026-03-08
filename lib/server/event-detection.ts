import Anthropic from "@anthropic-ai/sdk";
import { fetchAllNews, fetchPolymarketEvents, type RawNewsItem, type PolymarketEvent } from "./news-sources";
import { sendTelegramMessage } from "./telegram";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514";
const MAX_NEWS_FOR_LLM = 25;
const MAX_MARKETS_FOR_LLM = 30;

export type EventSignal = {
  id: string;
  headline: string;
  summary: string;
  newsSource: string;
  newsUrl: string;
  publishedAt: string;
  detectedAt: string;
  relevantMarkets: MarketImpact[];
  overallConfidence: number;
  urgency: "low" | "medium" | "high" | "critical";
  category: string;
};

export type MarketImpact = {
  marketId: string;
  question: string;
  currentYesPrice: number;
  estimatedYesPrice: number;
  probabilityShift: number;
  direction: "up" | "down" | "neutral";
  reasoning: string;
  suggestedAction: "buy_yes" | "buy_no" | "hold" | "exit";
  confidence: number;
};

type LlmAnalysisResult = {
  signals: Array<{
    news_index: number;
    headline: string;
    summary: string;
    category: string;
    urgency: "low" | "medium" | "high" | "critical";
    overall_confidence: number;
    market_impacts: Array<{
      market_index: number;
      estimated_yes_price: number;
      probability_shift: number;
      direction: "up" | "down" | "neutral";
      reasoning: string;
      suggested_action: "buy_yes" | "buy_no" | "hold" | "exit";
      confidence: number;
    }>;
  }>;
};

let signalCache: EventSignal[] = [];
let lastScanAt: string | null = null;

function buildAnalysisPrompt(news: RawNewsItem[], markets: PolymarketEvent[]): string {
  const newsBlock = news
    .slice(0, MAX_NEWS_FOR_LLM)
    .map(
      (n, i) =>
        `[NEWS ${i}] ${n.title}\nSource: ${n.source} | ${n.publishedAt}\n${n.summary}`
    )
    .join("\n\n");

  const marketBlock = markets
    .slice(0, MAX_MARKETS_FOR_LLM)
    .flatMap((event) =>
      event.markets.map(
        (m, mi) =>
          `[MARKET ${mi}] ${m.question}\nCurrent YES: $${m.outcomePrices[0]?.toFixed(3) || "?"} | Volume: $${Math.round(m.volume).toLocaleString()} | ID: ${m.id}`
      )
    )
    .join("\n\n");

  return `You are an expert prediction market analyst. Your job is to detect which recent news events could shift probabilities on active Polymarket prediction markets.

ACTIVE NEWS:
${newsBlock}

ACTIVE POLYMARKET MARKETS:
${marketBlock}

TASK:
1. For each news item that could materially affect any listed market, estimate the probability shift.
2. Only flag news that would move a market by at least 2 percentage points.
3. Rate urgency: "critical" (>15% shift), "high" (8-15%), "medium" (4-8%), "low" (2-4%).
4. For each impacted market, suggest an action: buy_yes, buy_no, hold, or exit.
5. Confidence 0-100 represents how certain you are of this analysis.

Respond with ONLY valid JSON matching this schema (no markdown, no explanation):
{
  "signals": [
    {
      "news_index": 0,
      "headline": "concise event headline",
      "summary": "2-3 sentence analysis of the event's market impact",
      "category": "politics|crypto|sports|finance|tech|world|science",
      "urgency": "low|medium|high|critical",
      "overall_confidence": 75,
      "market_impacts": [
        {
          "market_index": 0,
          "estimated_yes_price": 0.72,
          "probability_shift": 5.2,
          "direction": "up",
          "reasoning": "brief explanation",
          "suggested_action": "buy_yes",
          "confidence": 80
        }
      ]
    }
  ]
}

If no news materially impacts any market, return {"signals": []}.`;
}

function parseAnalysisResponse(text: string): LlmAnalysisResult {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned) as LlmAnalysisResult;
}

async function analyzeWithLlm(news: RawNewsItem[], markets: PolymarketEvent[]): Promise<LlmAnalysisResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildAnalysisPrompt(news, markets),
      },
    ],
  });

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude.");
  }

  return parseAnalysisResponse(textContent.text);
}

function buildSignals(
  analysis: LlmAnalysisResult,
  news: RawNewsItem[],
  allMarkets: PolymarketEvent[]
): EventSignal[] {
  const flatMarkets = allMarkets.flatMap((e) => e.markets);
  const now = new Date().toISOString();

  return analysis.signals.map((signal, idx) => {
    const newsItem = news[signal.news_index];

    const relevantMarkets: MarketImpact[] = signal.market_impacts
      .map((impact) => {
        const market = flatMarkets[impact.market_index];
        if (!market) return null;
        return {
          marketId: market.id,
          question: market.question,
          currentYesPrice: market.outcomePrices[0] || 0,
          estimatedYesPrice: impact.estimated_yes_price,
          probabilityShift: impact.probability_shift,
          direction: impact.direction,
          reasoning: impact.reasoning,
          suggestedAction: impact.suggested_action,
          confidence: impact.confidence,
        };
      })
      .filter((m): m is MarketImpact => m !== null);

    return {
      id: `evt_${Date.now()}_${idx}`,
      headline: signal.headline,
      summary: signal.summary,
      newsSource: newsItem?.source || "Unknown",
      newsUrl: newsItem?.url || "",
      publishedAt: newsItem?.publishedAt || now,
      detectedAt: now,
      relevantMarkets,
      overallConfidence: signal.overall_confidence,
      urgency: signal.urgency,
      category: signal.category,
    };
  });
}

async function sendHighUrgencyAlerts(signals: EventSignal[]): Promise<void> {
  const critical = signals.filter((s) => s.urgency === "critical" || s.urgency === "high");
  if (critical.length === 0) return;

  const lines = critical.map((s) => {
    const icon = s.urgency === "critical" ? "🚨" : "⚡";
    const markets = s.relevantMarkets
      .map((m) => `  → ${m.question}: ${m.direction === "up" ? "↑" : "↓"}${Math.abs(m.probabilityShift).toFixed(1)}% → ${m.suggestedAction.replace("_", " ")}`)
      .join("\n");
    return `${icon} <b>${s.headline}</b>\nConfidence: ${s.overallConfidence}% | ${s.category}\n${markets}`;
  });

  const message = `📡 <b>AI Event Detection</b>\n${critical.length} high-priority signal(s)\n\n${lines.join("\n\n")}`;

  await sendTelegramMessage(message).catch(() => {});
}

export async function runEventScan(): Promise<{
  signals: EventSignal[];
  newsCount: number;
  marketsCount: number;
  scannedAt: string;
}> {
  const [news, events] = await Promise.all([
    fetchAllNews(),
    fetchPolymarketEvents(40),
  ]);

  if (news.length === 0) {
    return { signals: [], newsCount: 0, marketsCount: 0, scannedAt: new Date().toISOString() };
  }

  const flatMarketCount = events.reduce((sum, e) => sum + e.markets.length, 0);

  const analysis = await analyzeWithLlm(news, events);
  const signals = buildSignals(analysis, news, events);

  signalCache = signals;
  lastScanAt = new Date().toISOString();

  await sendHighUrgencyAlerts(signals);

  return {
    signals,
    newsCount: news.length,
    marketsCount: flatMarketCount,
    scannedAt: lastScanAt,
  };
}

export function getLatestSignals(): { signals: EventSignal[]; lastScanAt: string | null } {
  return { signals: signalCache, lastScanAt };
}

export function getSignalsByUrgency(minUrgency: "low" | "medium" | "high" | "critical"): EventSignal[] {
  const urgencyOrder = { low: 0, medium: 1, high: 2, critical: 3 };
  const threshold = urgencyOrder[minUrgency];
  return signalCache.filter((s) => urgencyOrder[s.urgency] >= threshold);
}
