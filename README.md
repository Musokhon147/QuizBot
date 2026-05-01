# QuizBot — Telegram Mini App

A premium Telegram Mini App for taking PDF-based quizzes. Send a PDF with questions and answers, and the bot turns it into an interactive timed quiz with leaderboards, history, streaks, and more.

**Stack:** React 19 + TypeScript + Tailwind CSS + Framer Motion + Vite (frontend) · Vercel serverless functions (API + bot webhook) · Supabase (Postgres + RLS) · grammy (Telegram bot)

Everything deploys to **Vercel** as a single project — no Railway, Render, or separate backend needed.

## Project structure

```
.
├── web/                      # ← The deployable unit
│   ├── api/                  # Vercel serverless functions
│   │   ├── _lib/             # Shared services (parser, pdf, supabase, bot)
│   │   ├── tests/            # /api/tests/* endpoints
│   │   ├── bot.js            # Telegram webhook handler
│   │   ├── setup.js          # One-time webhook URL setter
│   │   └── health.js         # Health check
│   ├── src/                  # React frontend
│   ├── package.json          # Frontend + backend deps combined
│   └── vercel.json           # Vercel config
├── bot/                      # (legacy, for local long-polling dev)
├── server/                   # (legacy, for local Express dev)
└── supabase-schema.sql       # Database schema
```

## Deploy to Vercel (5 minutes)

### 1. Sign in & import
- Go to **https://vercel.com/new**
- Sign in with GitHub
- Import this repo (`Musokhon147/QuizBot`)

### 2. Configure project
| Field | Value |
|---|---|
| **Root Directory** | `web` ⚠️ critical |
| Framework Preset | Vite (auto-detected) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### 3. Add environment variables
Click **Environment Variables** and add:

| Name | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | (from @BotFather) |
| `SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `sb_secret_...` (from Supabase API settings) |
| `WEB_APP_URL` | (your Vercel URL — fill after first deploy) |

### 4. Deploy
- Click **Deploy** — wait ~60s
- Copy the production URL (e.g. `https://quizbot.vercel.app`)
- Go to **Settings → Environment Variables**, set `WEB_APP_URL` to that URL
- Click **Deployments → ⋯ → Redeploy**

### 5. Connect Telegram webhook
Open this URL once in your browser (replace placeholders):
```
https://YOUR-APP.vercel.app/api/setup?secret=YOUR_SUPABASE_SERVICE_KEY
```
Should respond with `{"telegram":{"ok":true,"result":true,"description":"Webhook was set"}}`.

### 6. Configure the bot menu in Telegram
1. Open [@BotFather](https://t.me/BotFather)
2. `/mybots` → your bot → **Bot Settings** → **Menu Button**
3. Send your Vercel URL (e.g. `https://quizbot.vercel.app`)
4. Set button text to `Open Tests`

Done! Send your bot a PDF with questions in this format:

```
1. What is 2+2?
A) 3
B) 4 ✓
C) 5

2. Capital of Uzbekistan?
A) Bishkek
B) Tashkent ✓
C) Almaty
```

The `✓` marks the correct answer (also accepts `✔ * + ★ ●` or words "correct" / "to'g'ri" / "правильн").

## Local development

```bash
cd web
npm install
npm run dev   # → http://localhost:5173
```

API routes won't work locally without Vercel CLI. To test locally:
```bash
npm i -g vercel
cd web
vercel dev   # → runs API functions locally on http://localhost:3000
```

## Database setup

Run `supabase-schema.sql` in your Supabase SQL editor. Creates:
- 5 tables (`users`, `tests`, `questions`, `attempts`, `bookmarks`)
- `leaderboard` view (security_invoker)
- `user_streak()` function
- RLS policies + realtime on `attempts`

## License

Private.
