import { Bot } from "grammy";
import { NextRequest, NextResponse } from "next/server";
import { queryGemini } from "@/lib/gemini";
import {
  addUser,
  removeUser,
  isUserSubscribed,
  getSubscribedUsers,
} from "@/lib/user-storage";

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
    await bot.init();

    // Set command menu lists dynamically
    await bot.api.setMyCommands([
      { command: "start", description: "Start the bot" },
      { command: "status", description: "Check subscription status" },
      { command: "subscribe", description: "Subscribe to daily reports" },
      { command: "unsubscribe", description: "Unsubscribe from daily reports" }
    ]);

    // ── COMMAND HANDLERS ──────────────────────────────────────────────
    bot.command("start", async (ctx) => {
      const chatId = String(ctx.chat.id);
      console.log(`[telegram] /start from ${chatId}`);
      const subscribeResult = addUser(chatId);
      await ctx.reply(
        `👋 Welcome to Telegram Gemini Bot! Send me a ticker or question (e.g. AAPL, Bitcoin price) for real-time prices and market sentiment.\n\n${subscribeResult.message}\n\nCommands:\n/subscribe - receive daily reports\n/unsubscribe - stop daily reports\n/status - check your subscription`,
        {
          reply_markup: { remove_keyboard: true }, // Instantly removes the custom reply keyboard from user's screen
        }
      );
    });

    bot.command("subscribe", async (ctx) => {
      const chatId = String(ctx.chat.id);
      console.log(`[telegram] /subscribe from ${chatId}`);
      const result = addUser(chatId);
      await ctx.reply(result.message, {
        reply_markup: { remove_keyboard: true },
      });
    });

    bot.command("unsubscribe", async (ctx) => {
      const chatId = String(ctx.chat.id);
      console.log(`[telegram] /unsubscribe from ${chatId}`);
      const result = removeUser(chatId);
      await ctx.reply(result.message, {
        reply_markup: { remove_keyboard: true },
      });
    });

    bot.command("status", async (ctx) => {
      const chatId = String(ctx.chat.id);
      console.log(`[telegram] /status from ${chatId}`);
      const subscribed = isUserSubscribed(chatId);
      const totalUsers = getSubscribedUsers().length;

      await ctx.reply(
        `📊 Subscription Status:\n\n` +
        `Your Chat ID: ${chatId}\n` +
        `Subscribed: ${subscribed ? "✅ Yes" : "❌ No"}\n` +
        `Total Subscribers: ${totalUsers}\n\n` +
        `Daily reports are sent at 8:00 AM IST.`,
        {
          reply_markup: { remove_keyboard: true },
        }
      );
    });

    // ── TEXT HANDLER (non-command messages only) ──────────────────────
    bot.on("message:text", async (ctx) => {
      const chatId = String(ctx.chat.id);
      const text = ctx.message.text.trim();

      console.log(`[telegram] Text: "${text}" from ${chatId}`);

      // Double-check: skip if this is a command
      if (
        text.startsWith("/") ||
        ctx.message.entities?.some((e) => e.type === "bot_command")
      ) {
        console.log(`[telegram] Skipping command in text handler: ${text}`);
        return;
      }

      // Auto-subscribe on first message
      if (!isUserSubscribed(chatId)) {
        addUser(chatId);
        console.log(`[telegram] Auto-subscribed ${chatId}`);
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return ctx.reply("Server misconfiguration. Please try again later.", {
          reply_markup: { remove_keyboard: true },
        });
      }

      const sent = await ctx.reply("Scanning market data...");

      try {
        const result = await queryGemini(text, apiKey);
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

    // ── PROCESS UPDATE ────────────────────────────────────────────────
    await bot.handleUpdate(body as unknown as Parameters<typeof bot.handleUpdate>[0]);
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
