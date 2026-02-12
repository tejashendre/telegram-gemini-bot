import { Bot } from "grammy";
import { NextRequest, NextResponse } from "next/server";
import { queryPerplexity } from "@/lib/perplexity";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return new Bot(token);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bot = createBot();

    bot.command("start", (ctx) => {
      return ctx.reply(
        "Send me a ticker or question (e.g. AAPL, Bitcoin price) for real-time prices and market sentiment."
      );
    });

    bot.on("message:text", async (ctx) => {
      const text = ctx.message.text.trim();
      const apiKey = process.env.PERPLEXITY_API_KEY;
      const token = process.env.TELEGRAM_BOT_TOKEN;

      if (!apiKey || !token) {
        return ctx.reply("Server misconfiguration. Please try again later.");
      }

      const sent = await ctx.reply("Scanning market data...");

      try {
        const result = await queryPerplexity(text, apiKey);
        await ctx.api.editMessageText(ctx.chat.id, sent.message_id, result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed.";
        await ctx.api.editMessageText(
          ctx.chat.id,
          sent.message_id,
          `Error: ${message}`
        );
      }
    });

    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json(
      { ok: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
