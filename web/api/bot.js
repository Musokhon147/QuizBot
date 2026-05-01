import { webhookCallback } from "grammy";
import { createBot } from "./_lib/bot.js";

// Vercel auto-parses JSON bodies; grammy's webhookCallback for "http" needs
// the body either as a stream or as a parsed object. We disable Vercel's
// parser and pass the raw stream through.
export const config = {
  api: {
    bodyParser: false,
  },
};

let _handler = null;
function getHandler() {
  if (_handler) return _handler;
  const bot = createBot();
  _handler = webhookCallback(bot, "http");
  return _handler;
}

export default async function vercelHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram webhook endpoint. POST only.");
  }
  try {
    const handler = getHandler();
    return await handler(req, res);
  } catch (err) {
    console.error("Bot handler error:", err);
    res.status(500).json({ error: err?.message || "Bot error" });
  }
}
