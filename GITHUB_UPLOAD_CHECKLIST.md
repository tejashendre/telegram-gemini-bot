# 🚀 GitHub Upload Checklist - Final Steps

## ✅ Pre-Upload Verification

### 1. **Install Dependencies**
```bash
cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
npm install
```

This will install `yahoo-finance2` and all other dependencies.

### 2. **Verify Files Are Ready**
Check that these files exist:
- ✅ `src/app/api/cron/morning-brief/route.ts` - Cron job route
- ✅ `vercel.json` - Cron schedule configured
- ✅ `package.json` - Includes yahoo-finance2
- ✅ `.gitignore` - Excludes .env files
- ✅ `README.md` - Updated documentation
- ✅ `SETUP_CHECKLIST.md` - Setup guide
- ✅ `GET_ENV_VARIABLES.md` - Environment variable guide
- ✅ `.env.local.example` - Example env file

### 3. **Environment Variables (For Vercel)**
You have all the values ready:
- ✅ CRON_SECRET: `pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=`
- ✅ TELEGRAM_CHAT_ID: `6909425236`
- ✅ TELEGRAM_BOT_TOKEN: `7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0`
- ✅ GEMINI_API_KEY: `AIzaSyDL2ksHSxxwctm2K9HAsID_5S5mblATj44`

**⚠️ Important:** Add these to Vercel AFTER deploying, NOT in the code!

---

## 📤 Upload to GitHub

### Option A: New Repository

**Step 1:** Initialize Git (if not already done)
```bash
cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
git init
```

**Step 2:** Check what will be committed
```bash
git status
```

**Step 3:** Add all files
```bash
git add .
```

**Step 4:** Commit
```bash
git commit -m "Add daily financial ratio report cron job feature"
```

**Step 5:** Create repository on GitHub
1. Go to: https://github.com/new
2. Repository name: `telegram-gemini-bot` (or your preferred name)
3. Description: "Telegram bot with Gemini API and daily financial reports"
4. Choose: **Public** or **Private**
5. **DO NOT** check "Add a README file" (you already have one)
6. **DO NOT** check "Add .gitignore" (you already have one)
7. Click **"Create repository"**

**Step 6:** Connect and push
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

### Option B: Existing Repository

**Step 1:** Check current status
```bash
cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
git status
```

**Step 2:** Add all changes
```bash
git add .
```

**Step 3:** Commit
```bash
git commit -m "Add daily financial ratio report cron job with IST schedule"
```

**Step 4:** Push to GitHub
```bash
git push origin main
```

---

## 🔧 Post-Upload: Vercel Setup

After uploading to GitHub:

### Step 1: Deploy on Vercel
1. Go to: https://vercel.com
2. Click **"New Project"**
3. Import your GitHub repository
4. Click **"Deploy"** (don't add env vars yet)

### Step 2: Add Environment Variables
1. After deployment, go to **Settings** → **Environment Variables**
2. Add each variable:

   **Variable 1:**
   - Key: `CRON_SECRET`
   - Value: `pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=`
   - Environments: Production, Preview, Development (check all)
   - Click **"Save"**

   **Variable 2:**
   - Key: `TELEGRAM_CHAT_ID`
   - Value: `6909425236`
   - Environments: Production, Preview, Development (check all)
   - Click **"Save"**

   **Variable 3:**
   - Key: `TELEGRAM_BOT_TOKEN`
   - Value: `7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0`
   - Environments: Production, Preview, Development (check all)
   - Click **"Save"**

   **Variable 4:**
   - Key: `GEMINI_API_KEY`
   - Value: `AIzaSyDL2ksHSxxwctm2K9HAsID_5S5mblATj44`
   - Environments: Production, Preview, Development (check all)
   - Click **"Save"**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 4: Set Telegram Webhook
After deployment, set your webhook:
```bash
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/setWebhook?url=https://YOUR_VERCEL_URL/api/telegram"
```

Replace `YOUR_VERCEL_URL` with your actual Vercel domain (e.g., `your-app.vercel.app`)

### Step 5: Test Cron Job (Optional)
Test manually:
```bash
curl -H "Authorization: Bearer pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=" https://YOUR_VERCEL_URL/api/cron/morning-brief
```

---

## ✅ Final Verification

After everything is set up:

- [ ] Code pushed to GitHub
- [ ] Vercel project deployed
- [ ] All 4 environment variables added to Vercel
- [ ] Project redeployed after adding env vars
- [ ] Telegram webhook set
- [ ] Cron job scheduled: `30 2 * * *` (8 AM IST)
- [ ] Test message sent (optional)

---

## 🎯 Expected Behavior

- **Daily at 8:00 AM IST:** You'll receive a Telegram message with:
  - Financial ratios for AAPL, MSFT, NVDA
  - Current Price, P/E Ratio, ROE, Debt-to-Equity
  - AI analysis from Gemini

---

## 🐛 Troubleshooting

**If cron doesn't run:**
- Check Vercel logs: Dashboard → Your Project → Logs
- Verify cron schedule in `vercel.json`: `"30 2 * * *"`
- Ensure `CRON_SECRET` matches exactly

**If no Telegram message:**
- Verify `TELEGRAM_CHAT_ID` is correct: `6909425236`
- Check `TELEGRAM_BOT_TOKEN` is valid
- Look at Vercel function logs for errors

**If build fails:**
- Ensure `yahoo-finance2` is in `package.json` dependencies
- Run `npm install` locally to verify

---

## 📝 Summary

You're all set! The code is complete and ready for GitHub. Just:
1. Run `npm install` locally
2. Push to GitHub
3. Deploy on Vercel
4. Add environment variables
5. Redeploy

The cron job will start running automatically at 8 AM IST daily! 🎉
