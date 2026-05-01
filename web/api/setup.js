/**
 * One-time webhook setup endpoint.
 *
 * After deploying to Vercel, hit this URL once with your secret to set the
 * Telegram bot's webhook to your Vercel deployment:
 *
 *   GET https://YOUR-APP.vercel.app/api/setup?secret=YOUR_SUPABASE_SERVICE_KEY
 *
 * It will register the webhook at https://YOUR-APP.vercel.app/api/bot.
 */
export default async function handler(req, res) {
  const expected = process.env.SUPABASE_SERVICE_KEY;
  if (!expected || req.query.secret !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" });

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const webhookUrl = `${proto}://${host}/api/bot`;

  const tg = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    }),
  }).then((r) => r.json());

  res.json({ webhookUrl, telegram: tg });
}
