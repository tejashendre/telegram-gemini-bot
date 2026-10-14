# ARCHITECTURE

- Next.js 14 App Router deployed on Vercel; Telegram posts updates to `/api/telegram`.
- grammY routes commands and replies. Handlers await Gemini and Telegram delivery before acknowledging the webhook.
- `src/lib/gemini.ts` owns shared generation with configurable primary/fallback models, header authentication, bounded requests and response validation.
- `src/lib/brief-generator.ts` fetches Yahoo quotes concurrently and assembles the daily report.
- Vercel cron invokes `/api/cron/morning-brief` at 02:30 UTC (08:00 IST), protected by CRON_SECRET.
- Local configuration is `.env.local`; production configuration must be set independently in Vercel. Secrets and key files are ignored.
- Subscribers are configured in an environment variable plus existing defaults; interactive subscription changes are in memory and do not persist across serverless instances.
