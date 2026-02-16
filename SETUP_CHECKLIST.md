# Daily Financial Ratio Report - Setup Checklist

## ✅ Cron Schedule Updated
- **Schedule:** `30 2 * * *` (8:00 AM IST / 2:30 AM UTC)
- **File:** `vercel.json` ✅ Updated

---

## 📋 What You Need to Provide/Fetch

### 1. **Install Dependencies** (Run in project folder)
```bash
npm install yahoo-finance2
```

### 2. **Environment Variables** (Add to Vercel Dashboard)

You need **4 environment variables** in your Vercel project:

#### a) **CRON_SECRET** (NEW - Required)
- **What:** A secret token to secure your cron job endpoint
- **How to get:** Generate a random string (e.g., use `openssl rand -hex 32` or any password generator)
- **Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Where to add:** Vercel Dashboard → Your Project → Settings → Environment Variables

#### b) **TELEGRAM_CHAT_ID** (NEW - Required)
- **What:** Your Telegram chat ID where reports will be sent
- **How to get:**
  1. Open Telegram and search for `@userinfobot`
  2. Start a conversation with the bot
  3. It will reply with your Chat ID (a number like `123456789`)
  4. Copy that number
- **Where to add:** Vercel Dashboard → Environment Variables

#### c) **TELEGRAM_BOT_TOKEN** (Already have)
- **What:** Your Telegram bot token
- **Status:** ✅ You already have this
- **Verify:** Check if it's in Vercel environment variables

#### d) **PERPLEXITY_API_KEY** (Already have)
- **What:** Your Perplexity API key
- **Status:** ✅ You already have this
- **Verify:** Check if it's in Vercel environment variables

---

## 🚀 Steps to Complete Setup

### Step 1: Install Dependency Locally
```bash
cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
npm install yahoo-finance2
```

### Step 2: Get Your Telegram Chat ID
1. Open Telegram app
2. Search for `@userinfobot`
3. Click "Start"
4. Copy the Chat ID number (e.g., `123456789`)

### Step 3: Generate CRON_SECRET
Use one of these methods:
- **Option A:** Online generator: https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")
- **Option B:** PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`
- **Option C:** Any random string (at least 32 characters)

### Step 4: Add Environment Variables to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:
   - `CRON_SECRET` = (your generated secret)
   - `TELEGRAM_CHAT_ID` = (your chat ID from Step 2)
   - Verify `TELEGRAM_BOT_TOKEN` exists
   - Verify `PERPLEXITY_API_KEY` exists

### Step 5: Test the Cron Job (Optional)
After deploying, test manually:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/morning-brief
```

---

## 📤 Upload to GitHub

### If this is a NEW repository:

1. **Initialize Git** (if not already done):
```bash
cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
git init
```

2. **Add all files**:
```bash
git add .
```

3. **Commit**:
```bash
git commit -m "Add daily financial ratio report cron job"
```

4. **Create repository on GitHub**:
   - Go to https://github.com/new
   - Name it (e.g., `telegram-perplexity-bot`)
   - **Don't** initialize with README or .gitignore
   - Click "Create repository"

5. **Connect and push**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### If this is an EXISTING repository:

1. **Check current status**:
```bash
cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
git status
```

2. **Add and commit changes**:
```bash
git add .
git commit -m "Add daily financial ratio report cron job with IST schedule"
```

3. **Push to GitHub**:
```bash
git push origin main
```

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] `yahoo-finance2` installed (`npm install yahoo-finance2` completed)
- [ ] `CRON_SECRET` added to Vercel environment variables
- [ ] `TELEGRAM_CHAT_ID` added to Vercel environment variables
- [ ] `TELEGRAM_BOT_TOKEN` exists in Vercel environment variables
- [ ] `PERPLEXITY_API_KEY` exists in Vercel environment variables
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Cron job scheduled: `30 2 * * *` (8 AM IST)

---

## 🎯 Expected Behavior

- **Daily at 8:00 AM IST:** Cron job triggers automatically
- **Fetches:** Financial data for AAPL, MSFT, NVDA
- **Calculates:** Current Price, P/E Ratio, ROE, Debt-to-Equity
- **Sends:** Formatted report to your Telegram chat with AI analysis

---

## 🐛 Troubleshooting

**Cron not running?**
- Check Vercel logs: Dashboard → Your Project → Logs
- Verify cron schedule in `vercel.json`: `"30 2 * * *"`
- Ensure `CRON_SECRET` matches in environment variables

**No Telegram message received?**
- Verify `TELEGRAM_CHAT_ID` is correct (use @userinfobot)
- Check `TELEGRAM_BOT_TOKEN` is valid
- Look at Vercel function logs for errors

**Yahoo Finance errors?**
- Check Vercel logs for specific error messages
- Verify internet connectivity from Vercel functions
- Stock symbols are correct: AAPL, MSFT, NVDA
