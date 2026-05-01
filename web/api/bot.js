import { webhookCallback } from "grammy";
import { createBot } from "./_lib/bot.js";

const bot = createBot();
const handler = webhookCallback(bot, "http");

export default async function vercelHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram webhook endpoint. POST only.");
  }
  return handler(req, res);
}
