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
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  USDINR: "INR=X",
};

interface MarketData {
  symbol: string;
  name: string;
  price: number | null;
  marketTime: number | null;
  isLive: boolean;
  status: "LIVE" | "Closing Price";
  sparkline: string;
}

/**
 * Generate a text-based sparkline trend chart from a list of prices
 */
function generateSparkline(prices: number[]): string {
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  const sparkTicks = [" ", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  
  return prices
    .map((price) => {
      if (range === 0) return sparkTicks[4];
      const index = Math.floor(((price - min) / range) * (sparkTicks.length - 1));
      return sparkTicks[Math.max(0, Math.min(sparkTicks.length - 1, index))];
    })
    .join("");
}

/**
 * Fetch quote via Yahoo Finance public API (no npm package needed)
 */
async function fetchLiveQuote(symbol: string): Promise<MarketData> {
  const fetchStart = Date.now();
  console.log(`[yahoo] Fetching ${symbol}`);

  try {
    // Fetch last 7 days of daily prices to generate sparkline
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=7d`;
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
          indicators?: {
            quote?: Array<{
              close?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const chartResult = json.chart?.result?.[0];
    const meta = chartResult?.meta;
    const price = meta?.regularMarketPrice ?? null;
    const marketTime = meta?.regularMarketTime ?? null;
    const name = meta?.shortName || symbol;

    // Extract historical close prices for sparkline
    const rawCloses = chartResult?.indicators?.quote?.[0]?.close ?? [];
    const validPrices = rawCloses.filter((p): p is number => typeof p === "number" && p !== null);
    
    // Add current live price to the end if it's not already there
    if (price !== null && (validPrices.length === 0 || validPrices[validPrices.length - 1] !== price)) {
      validPrices.push(price);
    }
    
    const sparkline = generateSparkline(validPrices.slice(-7)); // Last 7 data points

    // Check if data is live (within 15 minutes)
    let isLive = false;
    let status: "LIVE" | "Closing Price" = "Closing Price";
    if (marketTime !== null) {
      const ageMs = Date.now() - marketTime * 1000;
      isLive = ageMs < 15 * 60 * 1000;
      status = isLive ? "LIVE" : "Closing Price";
    }

    console.log(`[yahoo] ${symbol} = ${price} (${Date.now() - fetchStart}ms)`);
    return { symbol, name, price, marketTime, isLive, status, sparkline };
  } catch (error) {
    console.error(`[yahoo] Error ${symbol}:`, error);
    return { symbol, name: symbol, price: null, marketTime: null, isLive: false, status: "Closing Price", sparkline: "" };
  }
}

function convertGoldToINRPerGram(goldPriceUSD: number): number {
  return (goldPriceUSD / 31.1035) * 83;
}

function formatMarketData(data: MarketData): string {
  let priceStr = "N/A";
  
  if (data.price !== null) {
    if (data.symbol === SYMBOLS.GOLD) {
      priceStr = `$${data.price.toFixed(2)}/oz (≈₹${convertGoldToINRPerGram(data.price).toFixed(2)}/gram)`;
    } else if (data.symbol === SYMBOLS.USDINR) {
      priceStr = `₹${data.price.toFixed(2)}`;
    } else if (data.symbol === SYMBOLS.BTC || data.symbol === SYMBOLS.ETH) {
      priceStr = `$${data.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      priceStr = `$${data.price.toFixed(2)}`;
    }
  }

  const timeStr =
    data.marketTime !== null
      ? new Date(data.marketTime * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })
      : "N/A";

  const trendStr = data.sparkline ? `  \`[ ${data.sparkline} ]\`` : "";

  return `*${data.name}* (${data.symbol})\nPrice: ${priceStr}${trendStr}\nStatus: ${data.status === "LIVE" ? "🟢 LIVE" : "🔴 Closing Price"}\nTime: ${timeStr}`;
}

async function sendTelegramMessage(chatId: string, message: string, botToken: string): Promise<void> {
  const bot = new Bot(botToken);
  await bot.api.sendMessage(chatId, message, { parse_mode: "Markdown" });
}

/**
 * Query Gemini API for AI analysis (Option B - Free Tier)
 */
async function queryGeminiRealTime(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: `You are a premium Real-Time Financial Terminal. Current time: ${new Date().toISOString()}. Provide a highly articulate, 2-3 paragraph summary of today's market conditions. Highlight the S&P 500, Gold, and Nifty movements, compare them, comment on the Crypto and USD/INR Forex trends, and clearly flag the primary market risks. Do not truncate mid-sentence. Keep it clean and readable with clear spacing. Plain text only, absolutely no markdown or asterisks.`,
          },
        ],
      },
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return content
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\[[\d\s,]+\]/g, "")
    .replace(/\[\^?\d+\]/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .trim();
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
  const apiKey = process.env.GEMINI_API_KEY;

  if (!botToken || !apiKey) {
    return NextResponse.json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN or GEMINI_API_KEY" }, { status: 500 });
  }

  const users = getSubscribedUsers();
  if (users.length === 0) {
    console.log("[morning-brief] No subscribed users, skipping.");
    return NextResponse.json({ ok: true, message: "No subscribers", userCount: 0 });
  }

  console.log(`[morning-brief] Sending to ${users.length} user(s)`);

  try {
    // Fetch all symbols including Crypto and Forex in parallel
    const [sp500, gold, nifty, btc, eth, usdinr] = await Promise.all([
      fetchLiveQuote(SYMBOLS.SP500),
      fetchLiveQuote(SYMBOLS.GOLD),
      fetchLiveQuote(SYMBOLS.NIFTY),
      fetchLiveQuote(SYMBOLS.BTC),
      fetchLiveQuote(SYMBOLS.ETH),
      fetchLiveQuote(SYMBOLS.USDINR),
    ]);

    if (sp500.price === null || gold.price === null) {
      throw new Error("Failed to fetch essential market data");
    }

    const sp500GoldRatio = sp500.price / gold.price;
    const goldINR = convertGoldToINRPerGram(gold.price);
    const niftyGoldRatio = nifty.price !== null ? nifty.price / goldINR : null;

    const marketSections = [
      formatMarketData(sp500),
      formatMarketData(gold),
      formatMarketData(nifty),
    ].join("\n\n");

    const cryptoForexSections = [
      formatMarketData(btc),
      formatMarketData(eth),
      formatMarketData(usdinr),
    ].join("\n\n");

    const ratios = `*Key Ratios:*\nS&P 500 / Gold: ${sp500GoldRatio.toFixed(4)}\nNifty 50 / Gold (INR/gram): ${niftyGoldRatio?.toFixed(4) ?? "N/A"}`;

    let aiSummary: string;
    try {
      const dataSummary = `S&P 500: $${sp500.price.toFixed(2)}; Gold: $${gold.price.toFixed(2)}/oz; Nifty 50: ${nifty.price?.toFixed(2) ?? "N/A"}; BTC: $${btc.price?.toFixed(2) ?? "N/A"}; ETH: $${eth.price?.toFixed(2) ?? "N/A"}; USD/INR: ₹${usdinr.price?.toFixed(2) ?? "N/A"}`;
      aiSummary = await queryGeminiRealTime(`Market data: ${dataSummary}. Analyze trends, ratios, crypto, and exchange rates. Provide a concise sentiment summary. Flag risks.`, apiKey);
    } catch {
      aiSummary = "AI analysis temporarily unavailable.";
    }

    const totalTime = Date.now() - executionStart;
    const message = `📊 *Real-Time Financial Report*\n\n${marketSections}\n\n---\n🌐 *Crypto & Forex:*\n\n${cryptoForexSections}\n\n---\n${ratios}\n\n---\n*AI Analysis (Gemini):*\n${aiSummary}\n\n---\n⏱ *Latency:* ${totalTime} ms`;

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
