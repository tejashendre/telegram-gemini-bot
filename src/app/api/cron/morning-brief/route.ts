import { NextRequest, NextResponse } from "next/server";
import { Bot } from "grammy";
import { getSubscribedUsers } from "@/lib/user-storage";
import { generateMorningBrief } from "@/lib/brief-generator";

// STRICT NO-CACHE CONFIGURATION
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function sendTelegramMessage(chatId: string, message: string, botToken: string): Promise<void> {
  const bot = new Bot(botToken);
  await bot.api.sendMessage(chatId, message, { parse_mode: "Markdown" });
}

export async function GET(req: NextRequest) {
  console.log(`[morning-brief] Started at ${new Date().toISOString()}`);

  // Security check
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!botToken || !apiKey) {
    return NextResponse.json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN or GEMINI_API_KEY" }, { status: 500 });
  }

  const users = getSubscribedUsers();
  if (users.length === 0) {
    console.log("[morning-brief] No subscribed users, skipping.");
    return NextResponse.json({ ok: true, message: "No subscribers", userCount: 0 });
  }

  console.log(`[morning-brief] Sending to ${users.length} user(s)`);

  try {
    const { message, latencyMs } = await generateMorningBrief(apiKey);

    const results = await Promise.all(
      users.map(async (chatId) => {
        try {
          await sendTelegramMessage(chatId, message, botToken);
          return { chatId, success: true };
        } catch (error) {
          console.error(`[morning-brief] Send failed ${chatId}:`, error);
          return { chatId, success: false };
        }
      })
    );

    const ok = results.filter((r) => r.success).length;
    console.log(`[morning-brief] Done: ${ok}/${users.length} sent (${latencyMs}ms)`);

    return NextResponse.json({ ok: true, sent: ok, total: users.length, ms: latencyMs });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[morning-brief] Error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
