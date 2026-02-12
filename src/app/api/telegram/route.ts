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

/** GET: quick check that this route is deployed and env is set (no secrets shown). */
export async function GET() {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  return NextResponse.json({
    ok: true,
    route: "telegram webhook",
    TELEGRAM_BOT_TOKEN_set: hasToken,
  });
}

export async function POST(req: NextRequest) {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  console.log("[telegram] POST received, TELEGRAM_BOT_TOKEN present:", hasToken);

  let body: unknown;
  try {
    body = await req.json();
  } catch (parseErr) {
    console.error("[telegram] Failed to parse JSON body:", parseErr);
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("update_id" in body)) {
    console.error("[telegram] Invalid update body:", typeof body);
    return NextResponse.json({ ok: false, error: "Invalid update" }, { status: 400 });
  }

  const updateId = (body as { update_id?: number }).update_id ?? "?";
  console.log("[telegram] update_id:", updateId);

  try {
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

    await bot.handleUpdate(body as Parameters<Bot["handleUpdate"]>[0]);
    console.log("[telegram] Handled update_id:", updateId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    const errStack = e instanceof Error ? e.stack : undefined;
    console.error("[telegram] Webhook error:", errMsg);
    if (errStack) console.error("[telegram] Stack:", errStack);
    return NextResponse.json(
      { ok: false, error: "Webhook handler failed", details: errMsg },
      { status: 500 }
    );
  }
}
