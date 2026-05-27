const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const SYSTEM_PROMPT = (date = new Date().toISOString()) => `You are a concise Financial Analyst. Current time: ${date}. Rules:
- Reply in plain text only: no markdown, no asterisks (* or **), no brackets for citations.
- Be factual and accurate. If you cite a number, give the current/latest figure available as of ${date}.
- One or two short sentences. Only the price and one-sentence sentiment.
- Never end abruptly or mid-sentence. Ensure all sentences are complete and fully written.`;

const MAX_TOKENS = 350;

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

/** Strip markdown/asterisks so Telegram shows clean text. */
function cleanForTelegram(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\[[\d\s,]+\]/g, "")
    .replace(/\[\^?\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
 * Fetch real-time price from Yahoo Finance public API for free grounding
 */
async function fetchLiveQuote(symbol: string): Promise<{ price: number; name: string } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (!res.ok) return null;
    const json = await res.json() as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            shortName?: string;
          };
        }>;
      };
    };
    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice ?? null;
    const name = meta?.shortName || symbol;
    
    if (price === null) return null;
    return { price, name };
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
      liveDataPrompt = `\n\n[Real-time Live Market Data Context]:\n- Asset: ${quote.name} (${ticker})\n- Live Price: $${quote.price} (INR/gram if Gold)\nUse this live price data as the absolute truth to answer the user's question concisely!`;
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
