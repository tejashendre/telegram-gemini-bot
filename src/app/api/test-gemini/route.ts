import { NextRequest, NextResponse } from "next/server";
import { queryGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Quick test: open in browser to verify Gemini API works.
 * Example: https://your-app.vercel.app/api/test-gemini
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY is not set (check .env.local or Vercel env vars)" },
      { status: 500 }
    );
  }

  try {
    const answer = await queryGemini("What is the current price of AAPL? Reply in one short sentence.", apiKey);
    return NextResponse.json({
      ok: true,
      message: "Gemini API is working with a live quote source and model fallback.",
      sampleAnswer: answer,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: "Gemini API request failed", details: message },
      { status: 502 }
    );
  }
}
