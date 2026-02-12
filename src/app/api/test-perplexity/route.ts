import { NextResponse } from "next/server";
import { queryPerplexity } from "@/lib/perplexity";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Quick test: open in browser to verify Perplexity API works.
 * Example: https://your-app.vercel.app/api/test-perplexity
 * Remove or ignore this route in production if you want.
 */
export async function GET() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "PERPLEXITY_API_KEY is not set (check Vercel env vars)" },
      { status: 500 }
    );
  }

  try {
    const answer = await queryPerplexity("What is the current price of AAPL? Reply in one short sentence.", apiKey);
    return NextResponse.json({
      ok: true,
      message: "Perplexity API is working.",
      sampleAnswer: answer,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: "Perplexity API request failed", details: message },
      { status: 502 }
    );
  }
}
