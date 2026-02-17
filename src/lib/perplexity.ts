const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const MODEL = "sonar";
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

export type PerplexityMessage = { role: "system" | "user" | "assistant"; content: string };

export async function queryPerplexity(
  userMessage: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey} `,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT() },
        { role: "user", content: userMessage },
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${errText} `);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected Perplexity response shape");
  }

  return cleanForTelegram(content.trim());
}
