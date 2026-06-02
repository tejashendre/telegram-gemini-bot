import { fetchWithRetry } from "./gemini";

// Real-time market symbols (Yahoo Finance v8 API)
export const SYMBOLS = {
  SP500: "^GSPC",
  GOLD: "GC=F",
  NIFTY: "^NSEI",
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  USDINR: "INR=X",
};

export interface MarketData {
  symbol: string;
  name: string;
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePercent: number | null;
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
 * Fetch quote via Yahoo Finance public API
 */
export async function fetchLiveQuote(symbol: string): Promise<MarketData> {
  try {
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
            chartPreviousClose?: number;
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
    const prevClose = meta?.chartPreviousClose ?? null;
    const marketTime = meta?.regularMarketTime ?? null;
    const name = meta?.shortName || symbol;

    const change = (price !== null && prevClose !== null) ? price - prevClose : null;
    const changePercent = (price !== null && prevClose !== null) ? (change! / prevClose) * 100 : null;

    const rawCloses = chartResult?.indicators?.quote?.[0]?.close ?? [];
    const validPrices = rawCloses.filter((p): p is number => typeof p === "number" && p !== null);
    
    if (price !== null && (validPrices.length === 0 || validPrices[validPrices.length - 1] !== price)) {
      validPrices.push(price);
    }
    
    const sparkline = generateSparkline(validPrices.slice(-7));

    let isLive = false;
    let status: "LIVE" | "Closing Price" = "Closing Price";
    if (marketTime !== null) {
      const ageMs = Date.now() - marketTime * 1000;
      isLive = ageMs < 15 * 60 * 1000;
      status = isLive ? "LIVE" : "Closing Price";
    }

    return {
      symbol,
      name,
      price,
      prevClose,
      change,
      changePercent,
      marketTime,
      isLive,
      status,
      sparkline,
    };
  } catch (error) {
    console.error(`[yahoo] Error ${symbol}:`, error);
    return {
      symbol,
      name: symbol,
      price: null,
      prevClose: null,
      change: null,
      changePercent: null,
      marketTime: null,
      isLive: false,
      status: "Closing Price",
      sparkline: "",
    };
  }
}

export function convertGoldToINRPerGram(goldPriceUSD: number): number {
  return (goldPriceUSD / 31.1035) * 83;
}

export function formatMarketData(data: MarketData): string {
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

    // Append daily change and percent change if available
    if (data.change !== null && data.changePercent !== null) {
      const sign = data.change >= 0 ? "+" : "";
      priceStr += ` (${sign}${data.change.toFixed(2)} / ${sign}${data.changePercent.toFixed(2)}%)`;
    }
  }

  const timeStr =
    data.marketTime !== null
      ? new Date(data.marketTime * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })
      : "N/A";

  const trendStr = data.sparkline ? `  \`[ ${data.sparkline} ]\`` : "";

  return `*${data.name}* (${data.symbol})\nPrice: ${priceStr}${trendStr}\nStatus: ${data.status === "LIVE" ? "🟢 LIVE" : "🔴 Closing Price"}\nTime: ${timeStr}`;
}

/**
 * Generate the complete Morning Brief report markdown string
 */
export async function generateMorningBrief(apiKey: string): Promise<{ message: string; latencyMs: number }> {
  const executionStart = Date.now();

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
    const dataSummary = `
- S&P 500: $${sp500.price.toFixed(2)} (Prev Close: $${sp500.prevClose?.toFixed(2)}, Change: ${sp500.change?.toFixed(2)}, % Change: ${sp500.changePercent?.toFixed(2)}%)
- Gold: $${gold.price.toFixed(2)}/oz (Prev Close: $${gold.prevClose?.toFixed(2)}, Change: ${gold.change?.toFixed(2)}, % Change: ${gold.changePercent?.toFixed(2)}%)
- Nifty 50: ${nifty.price !== null ? nifty.price.toFixed(2) : "N/A"} (Prev Close: ${nifty.prevClose?.toFixed(2)}, Change: ${nifty.change?.toFixed(2)}, % Change: ${nifty.changePercent?.toFixed(2)}%)
- BTC: $${btc.price !== null ? btc.price.toFixed(2) : "N/A"} (Prev Close: $${btc.prevClose?.toFixed(2)}, Change: ${btc.change?.toFixed(2)}, % Change: ${btc.changePercent?.toFixed(2)}%)
- ETH: $${eth.price !== null ? eth.price.toFixed(2) : "N/A"} (Prev Close: $${eth.prevClose?.toFixed(2)}, Change: ${eth.change?.toFixed(2)}, % Change: ${eth.changePercent?.toFixed(2)}%)
- USD/INR: ₹${usdinr.price !== null ? usdinr.price.toFixed(2) : "N/A"} (Prev Close: ${usdinr.prevClose?.toFixed(2)}, Change: ${usdinr.change?.toFixed(2)}, % Change: ${usdinr.changePercent?.toFixed(2)}%)
`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const res = await fetchWithRetry(url, {
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
                text: `Here is the comprehensive real-time financial market data:\n${dataSummary}\n\nProvide the required concise sentiment summary, trends, and risk assessment based on this data.`,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: `You are a premium, ultra-concise Real-Time Financial Terminal. Current time: ${new Date().toISOString()}.
Your goal is to provide a highly informative, to-the-point, and data-driven market summary under 200 words total.
Structure your analysis strictly into these three sections using clear line breaks:

SENTIMENT SUMMARY
Provide a single, powerful sentence summarizing the overall market direction and mood (bullish, bearish, or mixed) based on the price movements.

KEY TRENDS & COMPARISONS
- Provide 2-3 short, dense bullet points using plain text.
- Directly compare equities vs gold and highlight crypto/forex performance using the percentage changes.

PRIMARY RISKS
- Provide 1-2 bullet points flagging key immediate risks based on the day's data.

Rules:
- Strictly limit output to under 200 words. Focus purely on high-signal data.
- Plain text only. Absolutely no markdown, no asterisks (* or **), no brackets.
- Plan your response carefully so that it is fully completed and never cuts off mid-sentence.`,
            },
          ],
        },
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error("API Rate Limit Exceeded");
      }
      throw new Error(`Gemini API error ${res.status}`);
    }

    const data = await res.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    aiSummary = content
      .replace(/\*/g, "")
      .replace(/_/g, " ")
      .replace(/[\[\]]/g, "")
      .replace(/`/g, "")
      .replace(/\[[\d\s,]+\]/g, "")
      .replace(/\[\^?\d+\]/g, "")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .trim();
  } catch (err) {
    console.error("[brief-generator] AI summary failed:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("Rate Limit") || errMsg.includes("429")) {
      aiSummary = "AI analysis temporarily unavailable due to rate limits. Please try again in a minute.";
    } else {
      aiSummary = "AI analysis temporarily unavailable.";
    }
  }

  const latencyMs = Date.now() - executionStart;
  const message = `📊 *Real-Time Financial Report*\n\n${marketSections}\n\n---\n🌐 *Crypto & Forex:*\n\n${cryptoForexSections}\n\n---\n${ratios}\n\n---\n*AI Analysis (Gemini):*\n${aiSummary}\n\n---\n⏱ *Latency:* ${latencyMs} ms`;

  return { message, latencyMs };
}
