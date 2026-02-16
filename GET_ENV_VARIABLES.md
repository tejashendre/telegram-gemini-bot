# How to Get Environment Variables - Step-by-Step Guide

## 1. 🔐 CRON_SECRET (Random Secret Token)

### Method A: Online Generator (Easiest)

**Step 1:** Open your web browser

**Step 2:** Go to: https://randomkeygen.com/

**Step 3:** Scroll down to find the section labeled **"CodeIgniter Encryption Keys"**

**Step 4:** You'll see multiple keys listed. **Copy ANY one** of them (they look like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`)

**Step 5:** Paste it somewhere safe (like Notepad) - you'll need it for Vercel

**✅ Done!** You now have your CRON_SECRET.

---

## 2. 💬 TELEGRAM_CHAT_ID (Your Personal Chat ID)

**Step 1:** Open Telegram app on your phone or desktop (https://web.telegram.org)

**Step 2:** In the search bar at the top, type: `@userinfobot`

**Step 3:** Click on the bot named **"User Info Bot"** (it has a blue checkmark)

**Step 4:** Click the **"Start"** button (or send `/start`)

**Step 5:** The bot will immediately reply with your information. Look for a line that says:
   ```
   Id: 123456789
   ```
   (The number will be different - that's YOUR Chat ID)

**Step 6:** **Copy that number** (just the digits, like `123456789`)

**Step 7:** Paste it somewhere safe

**✅ Done!** You now have your TELEGRAM_CHAT_ID.

**Note:** If the bot doesn't respond, try searching for `@getidsbot` or `@chatid_echo_bot` as alternatives.

---

## 3. 🤖 TELEGRAM_BOT_TOKEN (Your Bot's Token)

### If you already have a bot:

**Step 1:** Open Telegram app

**Step 2:** Search for: `@BotFather`

**Step 3:** Click on **"BotFather"** (official Telegram bot, has a blue checkmark)

**Step 4:** Send the command: `/mybots`

**Step 5:** Select your bot from the list

**Step 6:** Click **"API Token"**

**Step 7:** Copy the token (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

**✅ Done!** You now have your TELEGRAM_BOT_TOKEN.

### If you DON'T have a bot yet:

**Step 1:** Open Telegram app

**Step 2:** Search for: `@BotFather`

**Step 3:** Click on **"BotFather"** (official Telegram bot)

**Step 4:** Send: `/newbot`

**Step 5:** Follow the prompts:
   - Enter a name for your bot (e.g., "My Financial Bot")
   - Enter a username (must end in `bot`, e.g., "myfinancialbot")

**Step 6:** BotFather will give you a token. **Copy it immediately!**

**Step 7:** Save the token somewhere safe

**✅ Done!** You now have your TELEGRAM_BOT_TOKEN.

---

## 4. 🧠 PERPLEXITY_API_KEY (Perplexity API Key)

**Step 1:** Open your web browser

**Step 2:** Go to: https://www.perplexity.ai/

**Step 3:** Click **"Sign In"** (top right) or create an account if you don't have one

**Step 4:** After signing in, go to: https://www.perplexity.ai/settings/api

   **OR** manually navigate:
   - Click your profile icon (top right)
   - Click **"Settings"**
   - Click **"API"** in the left sidebar

**Step 5:** Look for **"API Keys"** section

**Step 6:** If you see an existing key, click **"Show"** or **"Copy"** to reveal it

**Step 7:** If you DON'T have a key yet:
   - Click **"Create API Key"** or **"Generate New Key"**
   - Give it a name (e.g., "Telegram Bot")
   - Click **"Create"** or **"Generate"**

**Step 8:** **Copy the API key** immediately (it looks like: `pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

**Step 9:** Save it somewhere safe

**⚠️ Important:** You can only see the full key ONCE when it's created. If you lose it, you'll need to create a new one.

**✅ Done!** You now have your PERPLEXITY_API_KEY.

---

## 📋 Quick Summary Checklist

After following all steps above, you should have:

- [ ] **CRON_SECRET** - Random string from randomkeygen.com
- [ ] **TELEGRAM_CHAT_ID** - Number from @userinfobot
- [ ] **TELEGRAM_BOT_TOKEN** - Token from @BotFather
- [ ] **PERPLEXITY_API_KEY** - Key from perplexity.ai/settings/api

---

## 🎯 Next Steps

Once you have all 4 values, you'll add them to Vercel:

1. Go to https://vercel.com
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable one by one
5. Redeploy your project

See `SETUP_CHECKLIST.md` for detailed Vercel setup instructions.
