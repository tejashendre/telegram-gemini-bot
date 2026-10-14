# LEARNINGS

- 2026-10-14: A valid local key does not fix an older production credential. Redeploy after updating Vercel environment variables.
- Model listing does not prove generation availability. Direct generation probes returned 503 for the primary model and 200 for the fallback.
- Yahoo chartPreviousClose is the start of the requested chart range; use previousClose or the previous daily candle for daily performance.
- Production build settings skip type validation, so run `npx tsc --noEmit` separately.
