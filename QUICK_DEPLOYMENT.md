# ⚡ Quick Deployment Reference

## 🎯 Your Next Steps (In Order)

### 1️⃣ Upload to GitHub

```bash
cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
git init
git add .
git commit -m "Deploy telegram bot with real-time financial reports"
```

**Create repo on GitHub**, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

### 2️⃣ Deploy on Vercel

1. Go to: **https://vercel.com** → **New Project**
2. **Import** your GitHub repository
3. **DO NOT deploy yet!** Add environment variables first

---

### 3️⃣ Add Environment Variables in Vercel

In Vercel project setup, add these **4 variables**:

| Variable Name | Value | Check All Environments |
|--------------|-------|----------------------|
| `TELEGRAM_BOT_TOKEN` | `7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0` | ✅ Production ✅ Preview ✅ Development |
| `PERPLEXITY_API_KEY` | `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` | ✅ Production ✅ Preview ✅ Development |
| `CRON_SECRET` | `pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=` | ✅ Production ✅ Preview ✅ Development |
| `TELEGRAM_SUBSCRIBED_USERS` | `6909425236` | ✅ Production ✅ Preview ✅ Development |

**Important:** Check all three environments (Production, Preview, Development) for each variable!

---

### 4️⃣ Deploy

Click **"Deploy"** button and wait 2-5 minutes.

---

### 5️⃣ Set Telegram Webhook

After deployment, note your Vercel domain (e.g., `your-app.vercel.app`), then:

```bash
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/setWebhook?url=https://YOUR_VERCEL_DOMAIN/api/telegram"
```

**Replace `YOUR_VERCEL_DOMAIN`** with your actual domain.

---

### 6️⃣ Test

**Test Bot:**
- Open Telegram → Find `@TJ99_bot`
- Send `/start`
- Send any message (e.g., "AAPL")

**Test Cron Job:**
```
https://YOUR_VERCEL_DOMAIN/api/test-morning-brief
```

Should send you a Telegram message with financial report!

---

## ✅ Done!

Your bot is now live:
- ✅ Responds to Telegram messages
- ✅ Sends daily reports at 8 AM IST
- ✅ All users auto-subscribed when they interact

---

## 📋 Environment Variables Summary

You need these **4 variables** in Vercel:

1. **TELEGRAM_BOT_TOKEN** = `7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0`
2. **PERPLEXITY_API_KEY** = `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`
3. **CRON_SECRET** = `pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=`
4. **TELEGRAM_SUBSCRIBED_USERS** = `6909425236`

---

## 🚨 Important Notes

- **Never commit `.env.local`** to GitHub (it's already gitignored)
- **Add variables in Vercel**, not in code
- **Redeploy** after adding/changing environment variables
- **Test** after deployment to verify everything works

---

See `DEPLOYMENT_STEPS.md` for detailed step-by-step instructions.
