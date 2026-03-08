import Parser from "rss-parser";

const rssParser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "PolyBot-EventDetector/1.0",
  },
});

export type RawNewsItem = {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  categories: string[];
};

type RssSourceConfig = {
  name: string;
  url: string;
  category: string;
};

const RSS_SOURCES: RssSourceConfig[] = [
  { name: "Reuters World", url: "https://feeds.reuters.com/reuters/worldNews", category: "world" },
  { name: "Reuters Business", url: "https://feeds.reuters.com/reuters/businessNews", category: "business" },
  { name: "AP Top News", url: "https://rsshub.app/apnews/topics/apf-topnews", category: "world" },
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/rss.xml", category: "world" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto" },
  { name: "CNBC", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", category: "finance" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "tech" },
  { name: "ESPN", url: "https://www.espn.com/espn/rss/news", category: "sports" },
  { name: "Politico", url: "https://rss.politico.com/politics-news.xml", category: "politics" },
];

const MAX_AGE_HOURS = 6;

function isRecent(dateString: string | undefined): boolean {
  if (!dateString) return true;
  const published = new Date(dateString);
  if (isNaN(published.getTime())) return true;
  const ageMs = Date.now() - published.getTime();
  return ageMs < MAX_AGE_HOURS * 60 * 60 * 1000;
}

async function fetchRssSource(source: RssSourceConfig): Promise<RawNewsItem[]> {
  try {
    const feed = await rssParser.parseURL(source.url);
    const items: RawNewsItem[] = [];
    for (const item of feed.items?.slice(0, 10) ?? []) {
      if (!item.title) continue;
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString();
      if (!isRecent(pubDate)) continue;

      items.push({
        title: item.title.trim(),
        summary: (item.contentSnippet || item.content || "").slice(0, 500).trim(),
        url: item.link || "",
        source: source.name,
        publishedAt: new Date(pubDate).toISOString(),
        categories: [source.category, ...(item.categories ?? []).slice(0, 3)],
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function fetchAllNews(): Promise<RawNewsItem[]> {
  const results = await Promise.allSettled(RSS_SOURCES.map(fetchRssSource));

  const allItems: RawNewsItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const seen = new Set<string>();
  return allItems.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type PolymarketEvent = {
  id: string;
  title: string;
  slug: string;
  endDate: string;
  markets: PolymarketMarket[];
};

export type PolymarketMarket = {
  id: string;
  question: string;
  outcomePrices: number[];
  outcomes: string[];
  volume: number;
  liquidity: number;
  active: boolean;
};

const POLYMARKET_API = "https://gamma-api.polymarket.com";

export async function fetchPolymarketEvents(limit = 50): Promise<PolymarketEvent[]> {
  try {
    const res = await fetch(`${POLYMARKET_API}/events?limit=${limit}&active=true&closed=false&order=volume&ascending=false`, {
      headers: { "User-Agent": "PolyBot-EventDetector/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return [];

    const data = (await res.json()) as Array<{
      id: string;
      title: string;
      slug: string;
      endDate: string;
      markets: Array<{
        id: string;
        question: string;
        outcomePrices: string;
        outcomes: string;
        volume: number;
        liquidity: number;
        active: boolean;
      }>;
    }>;

    return data.map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      endDate: event.endDate,
      markets: (event.markets || []).map((m) => {
        let prices: number[] = [];
        let outcomeLabels: string[] = [];
        try {
          prices = JSON.parse(m.outcomePrices || "[]").map(Number);
        } catch { /* empty */ }
        try {
          outcomeLabels = JSON.parse(m.outcomes || '["Yes","No"]');
        } catch { /* empty */ }
        return {
          id: m.id,
          question: m.question,
          outcomePrices: prices,
          outcomes: outcomeLabels,
          volume: m.volume || 0,
          liquidity: m.liquidity || 0,
          active: m.active,
        };
      }),
    }));
  } catch {
    return [];
  }
}
