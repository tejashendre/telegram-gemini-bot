# 🧪 Manual Testing Guide - Morning Brief Cron Job

## Overview

This guide shows you how to manually test the morning brief cron job function without waiting for the scheduled time.

---

## 🚀 Quick Test Methods

### Method 1: Test Endpoint (Easiest - No Auth Required)

I've created a **test endpoint** that bypasses the CRON_SECRET requirement for easy testing.

#### **Local Testing:**

1. **Start your dev server:**
   ```bash
   cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000/api/test-morning-brief
   ```

3. **Or use curl:**
   ```bash
   curl http://localhost:3000/api/test-morning-brief
   ```

#### **Vercel Testing (After Deployment):**

1. **Open in browser:**
   ```
   https://your-app.vercel.app/api/test-morning-brief
   ```

2. **Or use curl:**
   ```bash
   curl https://your-app.vercel.app/api/test-morning-brief
   ```

**What happens:**
- ✅ Fetches real-time market data (S&P 500, Gold, Nifty 50)
- ✅ Calculates ratios
- ✅ Gets AI analysis from Perplexity
- ✅ Sends report to all subscribed users on Telegram
- ✅ Returns JSON response with execution details

---

### Method 2: Test Actual Cron Endpoint (With Auth)

This tests the **actual cron endpoint** that Vercel will call.

#### **Local Testing:**

```bash
curl -H "Authorization: Bearer pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=" http://localhost:3000/api/cron/morning-brief
```

#### **Vercel Testing:**

```bash
curl -H "Authorization: Bearer pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=" https://your-app.vercel.app/api/cron/morning-brief
```

**Replace:**
- `pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=` with your actual `CRON_SECRET`
- `your-app.vercel.app` with your actual Vercel domain

---

## 📱 Testing via Telegram Bot Command (Future Enhancement)

You could also add a `/test-report` command to your bot. Let me know if you want this!

---

## 🔍 What to Check

### 1. **Browser/JSON Response:**

You should see a JSON response like:
```json
{
  "ok": true,
  "message": "TEST Report sent to 1 user(s)",
  "executionTimeMs": 2345,
  "timestamp": "2026-02-16T14:30:00.000Z",
  "successCount": 1,
  "failCount": 0,
  "totalUsers": 1,
  "testMode": true,
  "data": {
    "sp500": {
      "price": 5000.25,
      "status": "LIVE"
    },
    "gold": {
      "price": 2050.50,
      "status": "LIVE"
    },
    "nifty": {
      "price": 22000.75,
      "status": "LIVE"
    },
    "ratios": {
      "sp500Gold": 2.4390,
      "niftyGold": 107.3175
    }
  }
}
```

### 2. **Telegram Message:**

Check your Telegram chat (Chat ID: `6909425236`) - you should receive:
- 📊 Real-Time Financial Report
- S&P 500, Gold, Nifty 50 data
- Ratios (S&P 500/Gold, Nifty 50/Gold)
- AI Analysis
- Latency and timestamp footer

### 3. **Vercel Logs:**

Check Vercel Dashboard → Your Project → Logs:
- Look for `[test-morning-brief]` or `[morning-brief]` entries
- Check execution times
- Verify data freshness logs

---

## 🐛 Troubleshooting

### **No Telegram Message Received:**

1. **Check subscribed users:**
   - Verify `TELEGRAM_SUBSCRIBED_USERS` includes your Chat ID: `6909425236`
   - Check Vercel environment variables

2. **Check bot token:**
   - Verify `TELEGRAM_BOT_TOKEN` is correct
   - Test bot with `/start` command

3. **Check logs:**
   - Look for error messages in Vercel logs
   - Check if API calls are failing

### **API Errors:**

1. **Yahoo Finance errors:**
   - Check internet connectivity
   - Verify symbol names are correct
   - Market might be closed (will show "Closing Price")

2. **Perplexity errors:**
   - Verify `PERPLEXITY_API_KEY` is correct
   - Check API quota/limits
   - Error will show "AI analysis temporarily unavailable"

### **No Response in Browser:**

1. **Check environment variables:**
   - All required vars must be set in Vercel
   - For local: check `.env.local` file

2. **Check server status:**
   - Local: Is `npm run dev` running?
   - Vercel: Is deployment successful?

---

## 📊 Expected Execution Times

- **Yahoo Finance fetch:** ~500-1500ms per symbol
- **Perplexity API:** ~2000-5000ms
- **Telegram send:** ~200-500ms per user
- **Total execution:** ~3000-8000ms (3-8 seconds)

---

## ✅ Success Indicators

- ✅ JSON response shows `"ok": true`
- ✅ Telegram message received
- ✅ Data shows "LIVE" status (if market is open)
- ✅ Ratios calculated correctly
- ✅ AI analysis included
- ✅ Latency footer shows execution time

---

## 🎯 Quick Test Checklist

- [ ] Test endpoint accessible (`/api/test-morning-brief`)
- [ ] JSON response received
- [ ] Telegram message received
- [ ] Market data fetched (S&P 500, Gold, Nifty 50)
- [ ] Ratios calculated
- [ ] AI analysis included
- [ ] Latency metrics shown
- [ ] No errors in logs

---

## 🔄 Testing Workflow

1. **Deploy to Vercel** (if not already deployed)
2. **Set environment variables** in Vercel
3. **Test via browser:** `https://your-app.vercel.app/api/test-morning-brief`
4. **Check Telegram** for message
5. **Check Vercel logs** for details
6. **Verify data freshness** (should be LIVE if market open)

---

## 💡 Pro Tips

- **Test during market hours** to see "LIVE" status
- **Test after market close** to see "Closing Price" status
- **Check Vercel logs** for detailed timing information
- **Use test endpoint** for quick iterations
- **Use actual cron endpoint** to verify auth works

---

## 📝 Notes

- **Test endpoint** (`/api/test-morning-brief`) doesn't require CRON_SECRET
- **Actual cron endpoint** (`/api/cron/morning-brief`) requires CRON_SECRET header
- Both endpoints do the same thing - test endpoint is just easier for manual testing
- Test endpoint adds "(TEST)" label to Telegram message

---

Happy Testing! 🚀
