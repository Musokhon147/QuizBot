# QuizBot — Telegram Mini App

A premium Telegram Mini App for taking PDF-based quizzes. Send a PDF with questions and answers, and the bot turns it into an interactive timed quiz with leaderboards, history, and streaks.

## Stack

- **Frontend** — React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion + Zustand + i18next (uz/ru/en)
- **Backend** — Node.js + Express + grammy (Telegram bot)
- **Database** — Supabase (Postgres + RLS)
- **PDF parsing** — pdf-parse + pure-text Q&A parser (no AI required)

## Project structure

```
.
├── bot/             # Telegram bot (grammy)
├── server/          # Express API + Supabase services
├── web/             # React Mini App (deploys to Vercel)
└── supabase-schema.sql
```

## Local setup

1. **Install deps**
   ```bash
   npm install
   cd web && npm install
   ```

2. **Copy `.env.example` → `.env` and fill in:**
   - `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` — from Supabase dashboard
   - `WEB_APP_URL` — your Vercel deployment URL (or http://localhost:5173 locally)

3. **Run schema** in your Supabase SQL editor: `supabase-schema.sql`

4. **Start everything**
   ```bash
   npm run dev   # bot + server + web concurrently
   ```

## Deploying

- **Web app → Vercel** — set the project root to `web/`. Set env var `VITE_API_URL` to your server's public URL.
- **Server + bot** — deploy to Railway, Fly, or any Node host. Set all `.env` vars.
- **Telegram Mini App** — in @BotFather, set your bot's Web App URL to the Vercel deployment.

## PDF format

The parser detects:
- Numbered questions: `1. Question text` or `1) Question text`
- Lettered options: `A) option`, `B) option`, etc.
- Correct answer markers: `✓`, `✔`, `*`, `+`, `★`, `●`, or the words "correct" / "to'g'ri" / "правильн"

Example:
```
1. What is 2+2?
A) 3
B) 4 ✓
C) 5
```

## License

Private.
