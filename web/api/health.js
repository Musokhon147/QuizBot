export default function handler(req, res) {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
      webAppUrl: process.env.WEB_APP_URL || null,
    },
  });
}
