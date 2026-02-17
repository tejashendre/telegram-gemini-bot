import { NextResponse } from "next/server";
import { Bot } from "grammy";
import { getSubscribedUsers } from "@/lib/user-storage";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * Simple test: sends a quick message to all subscribed users.
 * No yahoo-finance2 dependency — pure Telegram send test.
 *
 * Visit: https://your-app.vercel.app/api/test-send
 */
export async function GET() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
    }

    const users = getSubscribedUsers();
    if (users.length === 0) {
        return NextResponse.json({
            ok: false,
            error: "No subscribed users. Set TELEGRAM_SUBSCRIBED_USERS env var.",
            hint: "Format: TELEGRAM_SUBSCRIBED_USERS=123456789",
        });
    }

    const bot = new Bot(botToken);
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const message =
        `✅ Bot Test Successful!\n\n` +
        `This confirms the bot can send messages to you.\n` +
        `Time: ${timestamp} IST\n` +
        `Subscribers: ${users.length}\n\n` +
        `Your daily financial reports will arrive at 8:00 AM IST.`;

    const results = [];
    for (const chatId of users) {
        try {
            await bot.api.sendMessage(chatId, message);
            results.push({ chatId, sent: true });
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            results.push({ chatId, sent: false, error: errMsg });
        }
    }

    return NextResponse.json({
        ok: true,
        message: `Sent to ${results.filter((r) => r.sent).length}/${users.length} users`,
        results,
        timestamp,
    });
}
