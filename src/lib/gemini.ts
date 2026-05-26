const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const SYSTEM_PROMPT = (date = new Date().toISOString()) => `You are a concise Financial Analyst. Current time: ${date}. Rules:
- Reply in plain text only: no markdown, no asterisks (* or **), no brackets for citations.
- Be factual and accurate. If you cite a number, give the current/latest figure available as of ${date}.
- One or two short sentences. Only the price and one-sentence sentiment.`;

const MAX_TOKENS = 120;

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

export type GeminiMessage = { role: "system" | "user" | "model"; content: string };

export async function queryGemini(
  userMessage: string,
  apiKey: string
): Promise<string> {
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
              text: userMessage,
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
      tools: [
        {
          google_search: {},
        },
      ],
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
