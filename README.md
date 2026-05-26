# Telegram Gemini Bot

Next.js 14 (App Router) Telegram bot using the Gemini API (gemini-flash-latest model) for real-time financial data and market sentiment. Uses webhooks and the interim-acknowledgment pattern for Vercel serverless.

## Setup

1. **Install dependencies** (requires Node.js 18+):

   ```bash
   npm install
   ```

2. **Environment variables**

   Use `.env.local` with:

   - `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather)
   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/)
   - `CRON_SECRET` — Random secret token for cron job security (generate with `openssl rand -hex 32`)
   - `TELEGRAM_CHAT_ID` — Your Telegram chat ID (get from [@userinfobot](https://t.me/userinfobot))

3. **Set Telegram webhook** (after deploying or using a public URL with ngrok for local dev):

   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://YOUR_DOMAIN/api/telegram"
   ```

## Run locally

```bash
npm run dev
```

Use ngrok or similar to expose `https://YOUR_NGROK_URL/api/telegram` and set that as the webhook URL.

## Push to GitHub

In the project folder (with Git installed), run:

```bash
cd C:\Users\tejas
git init
git add .
git commit -m "Initial commit: Telegram Gemini Bot"
```

Create a new repository on [GitHub](https://github.com/new) named e.g. `telegram-gemini-bot` (no need to add a README or .gitignore). Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/telegram-gemini-bot.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `telegram-gemini-bot` with your GitHub username and repo name.

## Deploy on Vercel (Option B)

1. After pushing to GitHub, go to [vercel.com](https://vercel.com) → **New Project** → **Import** your repo.
2. Add **Environment Variables**:
   - `TELEGRAM_BOT_TOKEN` — Your bot token
   - `GEMINI_API_KEY` — Your Gemini API key
   - `CRON_SECRET` — Random secret for cron job security
   - `TELEGRAM_CHAT_ID` — Your Telegram chat ID (get from [@userinfobot](https://t.me/userinfobot))
3. Deploy. Note your URL (e.g. `https://your-app.vercel.app`).
4. Set the webhook (in browser or curl):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_VERCEL_URL/api/telegram
   ```

## Daily Financial Ratio Report

The bot includes a **Daily Financial Ratio Report** feature that runs automatically via Vercel Cron:

- **Schedule:** Daily at 8:00 AM IST (2:30 AM UTC)
- **Stocks:** AAPL, MSFT, NVDA (configurable in code)
- **Metrics:** Current Price, P/E Ratio, ROE, Debt-to-Equity
- **AI Analysis:** Gemini provides qualitative insights grounded in Google Search
- **Delivery:** Sent directly to your Telegram chat

See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for detailed setup instructions.

## Bot name in Telegram

To show **Telegram Perplexity Bot** as the bot’s name in Telegram:

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Send `/setname`, select your bot, then enter: **Telegram Gemini Bot**.

## Behavior

- **Interim reply:** Bot immediately replies with "Scanning market data..." to stay under the 10s response limit.
- **Async:** Gemini is called with the user message.
- **Edit:** The same message is edited with the Gemini result (or an error).
- **Model:** Gemini `gemini-flash-latest` (fast and cost-effective). System prompt: concise Financial Analyst with real-time prices and one-sentence market sentiment, grounded in Google Search.
