import { getStreak } from "../../_lib/supabase.js";
import { methodGuard, handleError } from "../../_lib/http.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const streak = await getStreak(req.query.telegramUserId);
    res.json({ streak });
  } catch (err) {
    handleError(res, err);
  }
}
