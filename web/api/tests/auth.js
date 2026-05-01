import { upsertUser } from "../_lib/supabase.js";
import { methodGuard, handleError } from "../_lib/http.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  try {
    const { telegramUserId, name, username, phone } = req.body || {};
    if (!telegramUserId) return res.status(400).json({ error: "telegramUserId required" });
    const user = await upsertUser(telegramUserId, name, username, phone);
    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
}
