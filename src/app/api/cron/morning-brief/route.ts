import { NextRequest, NextResponse } from "next/server";
import { Bot } from "grammy";
import { getSubscribedUsers } from "@/lib/user-storage";

// STRICT NO-CACHE CONFIGURATION
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Real-time market symbols (Yahoo Finance v8 API)
const SYMBOLS = {
  SP500: "^GSPC",
  GOLD: "GC=F",
  NIFTY: "^NSEI",
};

interface MarketData {
  symbol: string;
  name: string;
  price: number | null;
  marketTime: number | null;
  isLive: boolean;
  status: "LIVE" | "Closing Price";
}

/**
 * Fetch quote via Yahoo Finance public API (no npm package needed)
 */
async function fetchLiveQuote(symbol: string): Promise<MarketData> {
  const fetchStart = Date.now();
  console.log(`[yahoo] Fetching ${symbol}`);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) throw new Error(`Yahoo API ${res.status}`);

    const json = await res.json() as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            regularMarketTime?: number;
            shortName?: string;
            symbol?: string;
          };
        }>;
      };
    };

    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice ?? null;
    const marketTime = meta?.regularMarketTime ?? null;
    const name = meta?.shortName || symbol;

    // Check if data is live (within 15 minutes)
    let isLive = false;
    let status: "LIVE" | "Closing Price" = "Closing Price";
    if (marketTime !== null) {
      const ageMs = Date.now() - marketTime * 1000;
      isLive = ageMs < 15 * 60 * 1000;
      status = isLive ? "LIVE" : "Closing Price";
    }

    console.log(`[yahoo] ${symbol} = ${price} (${Date.now() - fetchStart}ms)`);
    return { symbol, name, price, marketTime, isLive, status };
  } catch (error) {
    console.error(`[yahoo] Error ${symbol}:`, error);
    return { symbol, name: symbol, price: null, marketTime: null, isLive: false, status: "Closing Price" };
  }
}

/**
 * Query Perplexity API for AI analysis
 */
async function queryPerplexityRealTime(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `You are a Real-Time Financial Terminal. Current time: ${new Date().toISOString()}. Provide concise analysis in 2 sentences. Flag any risks. Use plain text only, no markdown.`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.1,
    }),
  });

  if (!res.ok) throw new Error(`Perplexity API error ${res.status}`);

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  return content.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\[[\d\s,]+\]/g, "").replace(/\[\^?\d+\]/g, "").replace(/\s+/g, " ").trim();
}

function convertGoldToINRPerGram(goldPriceUSD: number): number {
  return (goldPriceUSD / 31.1035) * 83;
}

function formatMarketData(data: MarketData): string {
  const priceStr =
    data.price !== null
      ? data.symbol === SYMBOLS.GOLD
        ? `$${data.price.toFixed(2)}/oz (≈₹${convertGoldToINRPerGram(data.price).toFixed(2)}/gram)`
        : `$${data.price.toFixed(2)}`
      : "N/A";

  const timeStr =
    data.marketTime !== null
      ? new Date(data.marketTime * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })
      : "N/A";

  return `*${data.name}* (${data.symbol})\nPrice: ${priceStr}\nStatus: ${data.status === "LIVE" ? "🟢 LIVE" : "🔴 Closing Price"}\nTime: ${timeStr}`;
}

async function sendTelegramMessage(chatId: string, message: string, botToken: string): Promise<void> {
  const bot = new Bot(botToken);
  await bot.api.sendMessage(chatId, message, { parse_mode: "Markdown" });
}

export async function GET(req: NextRequest) {
  const executionStart = Date.now();
  console.log(`[morning-brief] Started at ${new Date().toISOString()}`);

  // Security check
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!botToken || !apiKey) {
    return NextResponse.json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN or PERPLEXITY_API_KEY" }, { status: 500 });
  }

  const users = getSubscribedUsers();
  if (users.length === 0) {
    console.log("[morning-brief] No subscribed users, skipping.");
    return NextResponse.json({ ok: true, message: "No subscribers", userCount: 0 });
  }

  console.log(`[morning-brief] Sending to ${users.length} user(s)`);

  try {
    const [sp500, gold, nifty] = await Promise.all([
      fetchLiveQuote(SYMBOLS.SP500),
      fetchLiveQuote(SYMBOLS.GOLD),
      fetchLiveQuote(SYMBOLS.NIFTY),
    ]);

    if (sp500.price === null || gold.price === null) {
      throw new Error("Failed to fetch essential market data");
    }

    const sp500GoldRatio = sp500.price / gold.price;
    const goldINR = convertGoldToINRPerGram(gold.price);
    const niftyGoldRatio = nifty.price !== null ? nifty.price / goldINR : null;

    const marketSections = [formatMarketData(sp500), formatMarketData(gold), formatMarketData(nifty)].join("\n\n");
    const ratios = `*Key Ratios:*\nS&P 500 / Gold: ${sp500GoldRatio.toFixed(4)}\nNifty 50 / Gold (INR/gram): ${niftyGoldRatio?.toFixed(4) ?? "N/A"}`;

    let aiSummary: string;
    try {
      const dataSummary = `S&P 500: $${sp500.price.toFixed(2)}; Gold: $${gold.price.toFixed(2)}/oz; Nifty 50: ${nifty.price?.toFixed(2) ?? "N/A"}; S&P/Gold: ${sp500GoldRatio.toFixed(4)}`;
      aiSummary = await queryPerplexityRealTime(`Market data: ${dataSummary}. Analyze P/E ratios and earnings. What is the story? Flag risks.`, apiKey);
    } catch {
      aiSummary = "AI analysis temporarily unavailable.";
    }

    const totalTime = Date.now() - executionStart;
    const message = `📊 *Real-Time Financial Report*\n\n${marketSections}\n\n---\n${ratios}\n\n---\n*AI Analysis:*\n${aiSummary}\n\n---\n⏱ *Latency:* ${totalTime} ms`;

    const results = await Promise.all(
      users.map(async (chatId) => {
        try {
          await sendTelegramMessage(chatId, message, botToken);
          return { chatId, success: true };
        } catch (error) {
          console.error(`[morning-brief] Send failed ${chatId}:`, error);
          return { chatId, success: false };
        }
      })
    );

    const ok = results.filter((r) => r.success).length;
    console.log(`[morning-brief] Done: ${ok}/${users.length} sent (${totalTime}ms)`);

    return NextResponse.json({ ok: true, sent: ok, total: users.length, ms: totalTime });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[morning-brief] Error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
