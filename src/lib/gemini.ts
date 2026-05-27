const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const SYSTEM_PROMPT = (date = new Date().toISOString()) => `You are a premium, highly skilled, professional Financial Analyst. Current time: ${date}.
Your goal is to provide insightful, articulate, and accurate financial analysis based on the live market data provided.

Structure your analysis beautifully using clean spacing, sections, or bullet points where appropriate:
1. Provide a clear overview of the current performance and daily price action (using the live price and percentage changes provided).
2. Detail the key levels (Day Range, 52-week High/Low, Volume) and explain what the visual 7-day trend shows.
3. Summarize the immediate technical outlook, market sentiment, and any notable risks to be aware of.

Rules:
- Reply in plain text only: absolutely no markdown, no asterisks (* or **), no brackets for citations. Ensure the text is extremely clean and safe for Telegram to display.
- Separate distinct paragraphs or sections with a single blank line so it looks readable and visually premium.
- Never end abruptly or mid-sentence. Always finish your thought completely. Ensure a premium, unthrottled analysis. Keep it within 3-4 structured, readable paragraphs.`;

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
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
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
  const response = await fetch(url, {
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
