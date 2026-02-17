# 🚀 Complete Deployment Guide - Step by Step

## Overview

This guide walks you through deploying your Telegram Bot with Daily Financial Reports to GitHub and Vercel.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] All code files in your project folder
- [ ] Node.js installed (for local testing)
- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] All environment variable values ready

---

## Step 1: Prepare Your Project

### 1.1 Install Dependencies Locally (Optional but Recommended)

```bash
cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
npm install
```

This ensures `yahoo-finance2` and other dependencies are installed.

### 1.2 Verify Files Are Ready

Make sure these files exist:
- ✅ `src/app/api/cron/morning-brief/route.ts`
- ✅ `src/app/api/test-morning-brief/route.ts`
- ✅ `src/app/api/telegram/route.ts`
- ✅ `src/lib/user-storage.ts`
- ✅ `src/lib/perplexity.ts`
- ✅ `vercel.json`
- ✅ `package.json` (with `yahoo-finance2` dependency)
- ✅ `.gitignore` (excludes `.env.local`)

---

## Step 2: Upload to GitHub

### 2.1 Initialize Git (If New Repository)

```bash
cd "c:\Users\tejas\Downloads\Telegram Perplexity Bot"
git init
```

### 2.2 Check Status

```bash
git status
```

You should see all your files listed. Make sure `.env.local` is NOT listed (it should be ignored).

### 2.3 Add All Files

```bash
git add .
```

### 2.4 Commit

```bash
git commit -m "Add daily financial ratio report with real-time market data"
```

### 2.5 Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `telegram-perplexity-bot` (or your preferred name)
3. Description: "Telegram bot with Perplexity API and daily financial reports"
4. Choose: **Public** or **Private**
5. **DO NOT** check:
   - ❌ "Add a README file"
   - ❌ "Add .gitignore"
   - ❌ "Choose a license"
6. Click **"Create repository"**

### 2.6 Connect and Push

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

**Example:**
```bash
git remote add origin https://github.com/tejashendre/telegram-perplexity-bot.git
git branch -M main
git push -u origin main
```

### 2.7 Verify Upload

Go to your GitHub repository and verify all files are there:
- ✅ All source files
- ✅ `vercel.json`
- ✅ `package.json`
- ✅ Documentation files
- ❌ `.env.local` should NOT be there (it's gitignored)

---

## Step 3: Deploy on Vercel

### 3.1 Create Vercel Project

1. Go to: https://vercel.com
2. Click **"New Project"** (or **"Add New..."** → **"Project"**)
3. Click **"Import Git Repository"**
4. Find and select your repository (`telegram-perplexity-bot`)
5. Click **"Import"**

### 3.2 Configure Project

1. **Project Name:** Keep default or change (e.g., `telegram-bot`)
2. **Framework Preset:** Next.js (should auto-detect)
3. **Root Directory:** `./` (default)
4. **Build Command:** `npm run build` (default)
5. **Output Directory:** `.next` (default)
6. **Install Command:** `npm install` (default)

**DO NOT click "Deploy" yet!** We need to add environment variables first.

---

## Step 4: Add Environment Variables

### 4.1 Before Deploying - Add Variables

In the Vercel project setup page, scroll down to **"Environment Variables"** section.

Add these **4 variables** one by one:

#### Variable 1: TELEGRAM_BOT_TOKEN
- **Key:** `TELEGRAM_BOT_TOKEN`
- **Value:** `7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0`
- **Environments:** ✅ Production ✅ Preview ✅ Development (check all three)
- Click **"Add"**

#### Variable 2: PERPLEXITY_API_KEY
- **Key:** `PERPLEXITY_API_KEY`
- **Value:** `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`
- **Environments:** ✅ Production ✅ Preview ✅ Development (check all three)
- Click **"Add"**

#### Variable 3: CRON_SECRET
- **Key:** `CRON_SECRET`
- **Value:** `pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=`
- **Environments:** ✅ Production ✅ Preview ✅ Development (check all three)
- Click **"Add"**

#### Variable 4: TELEGRAM_SUBSCRIBED_USERS
- **Key:** `TELEGRAM_SUBSCRIBED_USERS`
- **Value:** `6909425236` (your Chat ID - add more users later with commas)
- **Environments:** ✅ Production ✅ Preview ✅ Development (check all three)
- Click **"Add"**

### 4.2 Verify All Variables Added

You should see 4 environment variables listed:
- ✅ `TELEGRAM_BOT_TOKEN`
- ✅ `PERPLEXITY_API_KEY`
- ✅ `CRON_SECRET`
- ✅ `TELEGRAM_SUBSCRIBED_USERS`

---

## Step 5: Deploy

### 5.1 Click Deploy

After adding all environment variables, click **"Deploy"** button.

### 5.2 Wait for Deployment

- Vercel will install dependencies
- Build your Next.js project
- Deploy to production
- This takes 2-5 minutes

### 5.3 Note Your Domain

After deployment completes, note your Vercel domain:
- Example: `telegram-bot-abc123.vercel.app`
- Or custom domain if you set one up

---

## Step 6: Configure Telegram Webhook

### 6.1 Set Webhook

After deployment, set your Telegram webhook:

```bash
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/setWebhook?url=https://YOUR_VERCEL_DOMAIN/api/telegram"
```

**Replace `YOUR_VERCEL_DOMAIN`** with your actual Vercel domain.

**Example:**
```bash
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/setWebhook?url=https://telegram-bot-abc123.vercel.app/api/telegram"
```

### 6.2 Verify Webhook

Check webhook status:
```bash
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/getWebhookInfo"
```

Should show your Vercel URL.

---

## Step 7: Test Everything

### 7.1 Test Telegram Bot

1. Open Telegram
2. Find your bot: `@TJ99_bot`
3. Send `/start`
4. Send `/status` - Should show your Chat ID
5. Send any message (e.g., "AAPL") - Should get response

### 7.2 Test Cron Job Manually

Open in browser:
```
https://YOUR_VERCEL_DOMAIN/api/test-morning-brief
```

**Or use curl:**
```bash
curl https://YOUR_VERCEL_DOMAIN/api/test-morning-brief
```

**Expected:**
- ✅ JSON response with `"ok": true`
- ✅ Telegram message received with financial report
- ✅ Shows execution time and timestamp

### 7.3 Test Actual Cron Endpoint (With Auth)

```bash
curl -H "Authorization: Bearer pxmcz9+ra846qWBB4nECN/QWnQPxp1vqwixKIc//dz0=" https://YOUR_VERCEL_DOMAIN/api/cron/morning-brief
```

Should return success response.

---

## Step 8: Verify Cron Schedule

### 8.1 Check Vercel Cron Configuration

1. Go to Vercel Dashboard → Your Project → **Settings** → **Cron Jobs**
2. Verify cron job is listed:
   - **Path:** `/api/cron/morning-brief`
   - **Schedule:** `30 2 * * *` (8 AM IST)

### 8.2 Cron Will Run Automatically

- **Time:** Daily at 8:00 AM IST (2:30 AM UTC)
- **Action:** Fetches real-time market data and sends to all subscribed users

---

## ✅ Deployment Checklist

After completing all steps, verify:

- [ ] Code pushed to GitHub
- [ ] All files visible in GitHub repository
- [ ] Vercel project created and deployed
- [ ] All 4 environment variables added to Vercel
- [ ] Telegram webhook set
- [ ] Bot responds to `/start` and messages
- [ ] Test endpoint works (`/api/test-morning-brief`)
- [ ] Cron endpoint works with auth (`/api/cron/morning-brief`)
- [ ] Telegram message received from test
- [ ] Vercel logs show no errors

---

## 🐛 Troubleshooting

### **Build Fails:**

1. Check Vercel build logs
2. Verify `package.json` includes `yahoo-finance2`
3. Check for TypeScript errors

### **Environment Variables Not Working:**

1. Go to Vercel → Settings → Environment Variables
2. Verify all variables are set
3. Check all environments (Production, Preview, Development) are selected
4. Redeploy after adding variables

### **Telegram Bot Not Responding:**

1. Verify webhook is set correctly
2. Check `TELEGRAM_BOT_TOKEN` is correct
3. Check Vercel logs for errors
4. Test webhook: `curl "https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo"`

### **No Telegram Messages from Cron:**

1. Verify `TELEGRAM_SUBSCRIBED_USERS` includes your Chat ID: `6909425236`
2. Check Vercel logs for cron execution
3. Test manually with `/api/test-morning-brief`
4. Verify bot token is correct

---

## 📊 Monitoring

### Check Vercel Logs:

1. Go to Vercel Dashboard → Your Project
2. Click **"Logs"** tab
3. Look for:
   - `[morning-brief]` - Cron job logs
   - `[test-morning-brief]` - Test endpoint logs
   - `[telegram]` - Bot interaction logs

### Check Cron Execution:

1. Vercel Dashboard → Settings → Cron Jobs
2. View execution history
3. Check for successful runs

---

## 🎯 Next Steps After Deployment

1. **Add More Users:**
   - Users interact with bot → Auto-subscribed
   - Or manually add Chat IDs to `TELEGRAM_SUBSCRIBED_USERS` (comma-separated)
   - Redeploy after adding users

2. **Monitor Daily Reports:**
   - Reports sent at 8 AM IST daily
   - Check Telegram for messages
   - Review Vercel logs for any issues

3. **Customize (Optional):**
   - Change stock symbols in code
   - Adjust cron schedule in `vercel.json`
   - Modify report format

---

## 📝 Summary

**You're deploying:**
1. ✅ Upload code to GitHub
2. ✅ Deploy to Vercel
3. ✅ Add 4 environment variables
4. ✅ Set Telegram webhook
5. ✅ Test everything

**After deployment:**
- Bot works immediately
- Cron runs daily at 8 AM IST
- All users receive reports automatically

---

## 🚀 Quick Command Reference

```bash
# GitHub
git add .
git commit -m "Deploy telegram bot with financial reports"
git push origin main

# Vercel (via dashboard)
# Go to vercel.com → Import repo → Add env vars → Deploy

# Set webhook
curl "https://api.telegram.org/bot7768600798:AAH8bAMCG5gUQmYlk0Zx5_wyh4jKf3sGEH0/setWebhook?url=https://YOUR_DOMAIN/api/telegram"

# Test
curl https://YOUR_DOMAIN/api/test-morning-brief
```

---

Good luck with your deployment! 🎉
