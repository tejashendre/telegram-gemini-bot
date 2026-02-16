# 🧪 Post-Deployment Testing Guide

## ✅ Deployment Successful!

Your bot is live at: **https://telegram-perplexity-bot.vercel.app/**

---

## Step 1: Set Telegram Webhook

### 1.1 Set the Webhook

Run this command to connect your Telegram bot to Vercel:

```bash
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/setWebhook?url=https://telegram-perplexity-bot.vercel.app/api/telegram"
```

**Expected Response:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### 1.2 Verify Webhook

Check if webhook is set correctly:

```bash
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/getWebhookInfo"
```

**Expected Response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://telegram-perplexity-bot.vercel.app/api/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## Step 2: Test Telegram Bot Commands

### 2.1 Open Telegram

1. Open Telegram app (mobile or desktop)
2. Search for: **`@TJ99_bot`**
3. Click on your bot

### 2.2 Test Commands

#### Test `/start`:
```
/start
```

**Expected Response:**
- Welcome message
- Subscription confirmation
- Instructions for daily reports

#### Test `/status`:
```
/status
```

**Expected Response:**
- Your Chat ID: `6909425236`
- Subscription status: ✅ Yes
- Total subscribers count

#### Test Regular Message:
```
AAPL
```

**Expected Response:**
- "Scanning market data..."
- Then: Real-time price and market sentiment from Perplexity

#### Test `/subscribe`:
```
/subscribe
```

**Expected Response:**
- Subscription confirmation message

---

## Step 3: Test Cron Job Manually

### 3.1 Test Endpoint (No Auth Required)

**Open in Browser:**
```
https://telegram-perplexity-bot.vercel.app/api/test-morning-brief
```

**Or use curl:**
```bash
curl https://telegram-perplexity-bot.vercel.app/api/test-morning-brief
```

**Expected:**
- JSON response with `"ok": true`
- Telegram message received with:
  - S&P 500 data
  - Gold data
  - Nifty 50 data
  - Ratios (S&P 500/Gold, Nifty 50/Gold)
  - AI analysis
  - Latency and timestamp

### 3.2 Test Actual Cron Endpoint (With Auth)

```bash
curl -H "Authorization: Bearer pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=" https://telegram-perplexity-bot.vercel.app/api/cron/morning-brief
```

**Expected:**
- JSON response with execution details
- Telegram message received (same as test endpoint)

---

## Step 4: Verify Environment Variables

### 4.1 Check Vercel Dashboard

1. Go to: **https://vercel.com**
2. Select your project: **telegram-perplexity-bot**
3. Go to: **Settings** → **Environment Variables**
4. Verify all 4 variables are set:
   - ✅ `TELEGRAM_BOT_TOKEN`
   - ✅ `PERPLEXITY_API_KEY`
   - ✅ `CRON_SECRET`
   - ✅ `TELEGRAM_SUBSCRIBED_USERS` = `6909425236`

---

## Step 5: Check Vercel Logs

### 5.1 View Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Logs"** tab
3. Look for:
   - `[telegram]` - Bot interactions
   - `[morning-brief]` - Cron job executions
   - `[test-morning-brief]` - Test endpoint calls

### 5.2 What to Look For

**Successful Bot Interaction:**
```
[telegram] POST received, TELEGRAM_BOT_TOKEN present: true
[telegram] User 6909425236 started the bot
[telegram] Handled update_id: 12345
```

**Successful Cron Job:**
```
[morning-brief] Execution started at 2026-02-16T...
[morning-brief] Sending report to 1 subscribed user(s)
[yahoo-finance] Fetching ^GSPC at ...
[morning-brief] Report sent successfully to 6909425236
```

---

## Step 6: Verify Cron Schedule

### 6.1 Check Cron Configuration

1. Go to Vercel Dashboard → Your Project → **Settings** → **Cron Jobs**
2. Verify cron job is listed:
   - **Path:** `/api/cron/morning-brief`
   - **Schedule:** `30 2 * * *` (8 AM IST / 2:30 AM UTC)

### 6.2 Cron Will Run Automatically

- **Next execution:** Tomorrow at 8:00 AM IST
- **Action:** Fetches real-time market data and sends to all subscribed users

---

## ✅ Testing Checklist

After completing all steps, verify:

- [ ] Webhook set successfully
- [ ] Bot responds to `/start` command
- [ ] Bot responds to `/status` command
- [ ] Bot responds to regular messages (e.g., "AAPL")
- [ ] Test endpoint (`/api/test-morning-brief`) works
- [ ] Telegram message received from test endpoint
- [ ] Cron endpoint (`/api/cron/morning-brief`) works with auth
- [ ] All 4 environment variables set in Vercel
- [ ] Vercel logs show no errors
- [ ] Cron job scheduled correctly

---

## 🐛 Troubleshooting

### **Bot Not Responding:**

1. **Check webhook:**
   ```bash
   curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/getWebhookInfo"
   ```

2. **Re-set webhook:**
   ```bash
   curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/setWebhook?url=https://telegram-perplexity-bot.vercel.app/api/telegram"
   ```

3. **Check Vercel logs** for errors

### **No Telegram Message from Test:**

1. Verify `TELEGRAM_SUBSCRIBED_USERS` includes your Chat ID: `6909425236`
2. Check Vercel logs for errors
3. Verify `TELEGRAM_BOT_TOKEN` is correct
4. Test bot with `/start` first to ensure it's working

### **Test Endpoint Returns Error:**

1. Check Vercel logs for specific error
2. Verify all environment variables are set
3. Check if Yahoo Finance API is accessible
4. Check if Perplexity API key is valid

---

## 🎯 Quick Test Commands

**Set Webhook:**
```bash
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/setWebhook?url=https://telegram-perplexity-bot.vercel.app/api/telegram"
```

**Test Cron Job:**
```
https://telegram-perplexity-bot.vercel.app/api/test-morning-brief
```

**Check Webhook:**
```bash
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/getWebhookInfo"
```

---

## 🎉 Success Indicators

✅ **Bot is working if:**
- Responds to `/start` command
- Responds to regular messages
- Shows subscription status

✅ **Cron job is working if:**
- Test endpoint returns JSON with `"ok": true`
- Telegram message received with financial report
- Vercel logs show successful execution

✅ **Everything is ready if:**
- All tests pass
- No errors in Vercel logs
- Cron job scheduled for tomorrow 8 AM IST

---

## 📊 What Happens Next

1. **Daily at 8:00 AM IST:** Cron job runs automatically
2. **Fetches:** Real-time S&P 500, Gold, Nifty 50 data
3. **Calculates:** Ratios (S&P 500/Gold, Nifty 50/Gold)
4. **Analyzes:** Gets AI insights from Perplexity
5. **Sends:** Formatted report to all subscribed users (currently: you)

---

Your bot is now live and ready! 🚀
