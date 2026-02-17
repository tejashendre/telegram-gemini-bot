# 🧪 How to Test Your Cron Job

## ✅ Quick Test Method

Since the test endpoint might not be deployed yet, **test the actual cron endpoint** - it works the same way!

---

## 🚀 Method 1: Test Actual Cron Endpoint (Recommended)

### Using ReqBin (What You're Using):

1. **Go to:** https://reqbin.com/curl

2. **Set Method:** `GET`

3. **Set URL:**
   ```
   https://telegram-perplexity-bot.vercel.app/api/cron/morning-brief
   ```

4. **Add Header:**
   - **Name:** `Authorization`
   - **Value:** `Bearer pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=`

5. **Click "Send"**

**Expected Response:**
```json
{
  "ok": true,
  "message": "Report sent to 1 user(s)",
  "executionTimeMs": 3000,
  "timestamp": "2026-02-16T...",
  "successCount": 1,
  "failCount": 0,
  "totalUsers": 1
}
```

**Plus:** You'll receive a Telegram message with the financial report! 📊

---

## 🌐 Method 2: Test via Browser (Simple Check)

### Test Telegram Endpoint:

Open in browser:
```
https://telegram-perplexity-bot.vercel.app/api/telegram
```

**Expected:** JSON response showing the route is working

---

## 📱 Method 3: Test via Telegram Bot

1. **Open Telegram**
2. **Find:** `@TJ99_bot`
3. **Send:** `/status`

**Expected:** Shows your Chat ID and subscription status

---

## 🔍 Why Test Endpoint Shows 404

The test endpoint (`/api/test-morning-brief`) might not be deployed because:

1. **Vercel needs to rebuild** after you pushed files
2. **Route might not be in the latest deployment**

**Solution:** Use the actual cron endpoint (`/api/cron/morning-brief`) - it works exactly the same!

---

## ✅ What to Check After Testing

### 1. **Check Telegram:**
   - You should receive a message with:
     - S&P 500 data
     - Gold data  
     - Nifty 50 data
     - Ratios
     - AI analysis
     - Latency metrics

### 2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → **Logs**
   - Look for:
     ```
     [morning-brief] Execution started at...
     [yahoo-finance] Fetching ^GSPC...
     [morning-brief] Report sent successfully to 6909425236
     ```

### 3. **Check Response:**
   - Should return JSON with `"ok": true`
   - Should show execution time
   - Should show success count

---

## 🎯 Quick Test Checklist

- [ ] Test cron endpoint with Authorization header
- [ ] Receive Telegram message with financial report
- [ ] Check Vercel logs for successful execution
- [ ] Verify JSON response shows success

---

## 📝 ReqBin Configuration Details

**For ReqBin.com:**

```
Method: GET
URL: https://telegram-perplexity-bot.vercel.app/api/cron/morning-brief
Headers:
  Authorization: Bearer pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=
```

**Important:** Make sure the Authorization header is exactly:
```
Bearer pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=
```

(Include the word "Bearer" followed by a space, then your CRON_SECRET)

---

## 🐛 Troubleshooting

### **Still Getting 404:**

1. **Check if route exists:**
   - Verify `src/app/api/cron/morning-brief/route.ts` is in your GitHub repo
   - Check Vercel deployment logs

2. **Redeploy:**
   - Go to Vercel Dashboard
   - Click "Redeploy" on latest deployment

### **Getting 401 Unauthorized:**

- Check Authorization header format: `Bearer YOUR_SECRET`
- Verify `CRON_SECRET` in Vercel matches exactly

### **No Telegram Message:**

- Verify `TELEGRAM_SUBSCRIBED_USERS` includes your Chat ID: `6909425236`
- Check Vercel logs for errors
- Test bot with `/start` first

---

## 🎉 Success!

If you see:
- ✅ JSON response with `"ok": true`
- ✅ Telegram message received
- ✅ Vercel logs show success

**Then everything is working perfectly!** 🚀

---

**Try the ReqBin test now with the Authorization header!**
