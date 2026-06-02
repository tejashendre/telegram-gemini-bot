const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const SYSTEM_PROMPT = (date = new Date().toISOString()) => `You are a premium, highly skilled, and ultra-concise Financial Analyst. Current time: ${date}.
Your goal is to provide a highly informative, to-the-point, and data-driven financial analysis under 250 words total based on the live market data provided.

Structure your analysis strictly into these three sections using clear line breaks:

OVERVIEW & PERFORMANCE
Provide a single, powerful summary sentence showing current price, daily change, and volume action.

TREND & OUTLOOK
- Provide 2-3 short, dense bullet points using plain text.
- Analyze the 7-day sparkline trend and key trading levels (Day Range, 52-week High/Low).

SENTIMENT & RISKS
- Provide 1-2 bullet points flagging key support/resistance levels or immediate market risks.

Rules:
- Strictly limit output to under 250 words. Focus purely on high-signal facts.
- Plain text only. Absolutely no markdown, no asterisks (* or **), no brackets.
- Separate sections with a single blank line.
- Always finish your thought completely. Plan your response carefully to never cut off mid-sentence.`;

const MAX_TOKENS = 2048;

// Common natural words mapped to their Yahoo Finance tickers
const TICKER_MAPPINGS: Record<string, string> = {
  "APPLE": "AAPL",
  "AAPL": "AAPL",
  "MICROSOFT": "MSFT",
  "MSFT": "MSFT",
  "GOOGLE": "GOOGL",
  "GOOGL": "GOOGL",
  "NVIDIA": "NVDA",
  "NVDA": "NVDA",
  "TESLA": "TSLA",
  "TSLA": "TSLA",
  "AMAZON": "AMZN",
  "AMZN": "AMZN",
  "META": "META",
  "BITCOIN": "BTC-USD",
  "BTC": "BTC-USD",
  "ETHEREUM": "ETH-USD",
  "ETH": "ETH-USD",
  "SOLANA": "SOL-USD",
  "SOL": "SOL-USD",
  "GOLD": "GC=F",
  "NIFTY": "^NSEI",
  "NIFTY50": "^NSEI",
  "SP500": "^GSPC",
  "S&P500": "^GSPC",
};

const IGNORED_WORDS = new Set([
  "WHAT", "HOW", "WHY", "WHO", "WHEN", "WHERE", "WHICH", "THIS", "THAT",
  "THE", "FOR", "AND", "BUT", "GET", "GIVE", "SHOW", "TELL", "IS",
  "ARE", "WAS", "WERE", "AM", "BE", "BEING", "BEEN", "HAVE", "HAS", "HAD",
  "DO", "DOES", "DID", "DOING", "WILL", "WOULD", "SHALL", "SHOULD", "CAN",
  "COULD", "MAY", "MIGHT", "MUST", "PRICE", "STOCK", "SHARE", "ABOUT",
  "TODAY", "NOW", "LIVE", "REAL", "TIME", "CHART", "INFO", "DATA", "NEWS",
  "RATE", "VALUE", "COST", "ANY", "SOME", "MANY", "MUCH", "MORE", "MOST",
  "FEW", "LESS", "LEAST", "OWN", "OTHER", "ANOTHER", "SUCH", "SAME", "VERY",
  "SO", "TOO", "ALSO", "ONLY", "JUST", "EVEN", "STILL", "YET", "ALREADY",
  "ALMOST", "AGAIN", "ON", "IN", "AT", "TO", "OF", "BY", "WITH", "FROM",
  "AS", "THAN", "LIKE", "INTO", "OVER", "UNDER", "ABOVE", "BELOW", "UP", "DOWN",
  "OUT", "OFF", "THROUGH", "BETWEEN", "AMONG", "HELLO", "HI", "HEY", "DEAR",
  "PLEASE", "THANKS", "THANK", "YOU", "YOUR", "ME", "MY", "I", "WE", "US", "THEY",
  "HE", "SHE", "IT", "HIM", "HER", "THEM", "ITS", "OUR", "THEIRS", "FINANCE"
]);

export interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  prevClose: number | null;
  change: number | null;
  changePercent: number | null;
  dayLow: number | null;
  dayHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  volume: number | null;
  sparkline: string;
}

/** Strip markdown/asterisks so Telegram shows clean text, but preserve newlines. */
function cleanForTelegram(text: string): string {
  return text
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
 * Extract a potential ticker or natural asset word from user query
 */
function extractTicker(text: string): string | null {
  const cleanText = text.toUpperCase().replace(/[^A-Z0-9^=\-]/g, " ").trim();
  const words = cleanText.split(/\s+/);
  
  // Check direct mappings first (Bitcoin, Gold, Nifty)
  for (const word of words) {
    if (TICKER_MAPPINGS[word]) {
      return TICKER_MAPPINGS[word];
    }
  }
  
  // Check for standard stock tickers (uppercase alphabetic of length 2-5), excluding stopwords
  for (const word of words) {
    if (
      word.length >= 2 && 
      word.length <= 5 && 
      /^[A-Z]+$/.test(word) && 
      !IGNORED_WORDS.has(word)
    ) {
      return word;
    }
  }
  
  return null;
}

/**
 * Fetch real-time price and comprehensive stats from Yahoo Finance public API
 */
async function fetchLiveQuote(symbol: string): Promise<QuoteData | null> {
  try {
    // Fetch last 7 days of daily prices to generate sparkline and capture meta
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=7d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Cache-Control": "no-cache",
      },
    });
    if (!res.ok) return null;
    const json = await res.json() as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            fiftyTwoWeekHigh?: number;
            fiftyTwoWeekLow?: number;
            regularMarketDayHigh?: number;
            regularMarketDayLow?: number;
            regularMarketVolume?: number;
            currency?: string;
            shortName?: string;
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
    if (price === null) return null;

    const name = meta?.shortName || symbol;
    const currency = meta?.currency || "USD";
    const prevClose = meta?.chartPreviousClose ?? null;
    const change = prevClose !== null ? price - prevClose : null;
    const changePercent = prevClose !== null ? (change! / prevClose) * 100 : null;

    // Extract historical close prices for sparkline
    const rawCloses = chartResult?.indicators?.quote?.[0]?.close ?? [];
    const validPrices = rawCloses.filter((p): p is number => typeof p === "number" && p !== null);
    
    // Add current live price to the end if not already there
    if (validPrices.length === 0 || validPrices[validPrices.length - 1] !== price) {
      validPrices.push(price);
    }
    
    // Generate 7-day sparkline
    const sparkline = generateSparkline(validPrices.slice(-7));

    return {
      symbol,
      name,
      price,
      currency,
      prevClose,
      change,
      changePercent,
      dayLow: meta?.regularMarketDayLow ?? null,
      dayHigh: meta?.regularMarketDayHigh ?? null,
      fiftyTwoWeekLow: meta?.fiftyTwoWeekLow ?? null,
      fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh ?? null,
      volume: meta?.regularMarketVolume ?? null,
      sparkline,
    };
  } catch {
    return null;
  }
}

export type GeminiMessage = { role: "system" | "user" | "model"; content: string };

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      if (response.status === 429 || response.status >= 500) {
        console.warn(`[Gemini API] Attempt ${attempt} failed with status ${response.status}. Retrying in ${delayMs * attempt}ms...`);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
          continue;
        }
      }
      return response;
    } catch (err) {
      console.warn(`[Gemini API] Attempt ${attempt} connection failed:`, err);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Request failed after ${retries} retries`);
}

export async function queryGemini(
  userMessage: string,
  apiKey: string
): Promise<string> {
  // Extract a ticker and fetch live data as context
  const ticker = extractTicker(userMessage);
  let liveDataPrompt = "";
  if (ticker) {
    const quote = await fetchLiveQuote(ticker);
    if (quote) {
      const changeSign = quote.change !== null && quote.change >= 0 ? "+" : "";
      const changeStr = quote.change !== null && quote.changePercent !== null
        ? `${changeSign}${quote.change.toFixed(2)} (${changeSign}${quote.changePercent.toFixed(2)}%)`
        : "N/A";
      
      const dayRangeStr = quote.dayLow !== null && quote.dayHigh !== null
        ? `$${quote.dayLow.toFixed(2)} - $${quote.dayHigh.toFixed(2)}`
        : "N/A";

      const fiftyTwoWeekRangeStr = quote.fiftyTwoWeekLow !== null && quote.fiftyTwoWeekHigh !== null
        ? `$${quote.fiftyTwoWeekLow.toFixed(2)} - $${quote.fiftyTwoWeekHigh.toFixed(2)}`
        : "N/A";

      const volumeStr = quote.volume !== null
        ? (quote.volume >= 1e6 ? `${(quote.volume / 1e6).toFixed(2)}M` : quote.volume.toLocaleString())
        : "N/A";

      liveDataPrompt = `\n\n[Real-time Live Market Data Context]:
- Asset Name: ${quote.name}
- Ticker/Symbol: ${quote.symbol}
- Current Live Price: $${quote.price.toFixed(2)} ${quote.currency}
- Daily Change: ${changeStr}
- Previous Day Close Price: $${quote.prevClose !== null ? quote.prevClose.toFixed(2) : "N/A"}
- Day's Trading Range: ${dayRangeStr}
- 52-Week Trading Range: ${fiftyTwoWeekRangeStr}
- Market Trading Volume: ${volumeStr} shares
- Recent 7-day Close Price Trend: [ ${quote.sparkline} ]

Use this live market data as the absolute, single source of truth for current prices and performance indicators. Use it to provide a highly detailed, professional, and factually accurate summary of the asset's behavior, outlook, and current market state!`;
    }
  }

  const url = `${GEMINI_API_URL}?key=${apiKey}`;
  const response = await fetchWithRetry(url, {
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
              text: userMessage + liveDataPrompt,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: SYSTEM_PROMPT(),
          },
        ],
      },
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: MAX_TOKENS,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw new Error("AI rate limit exceeded. Please wait a minute before querying again.");
    }
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
      finishReason?: string;
    }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== "string") {
    throw new Error("Unexpected Gemini response shape");
  }

  return cleanForTelegram(content.trim());
}
