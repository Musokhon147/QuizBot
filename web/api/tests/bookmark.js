import { toggleBookmark } from "../_lib/supabase.js";
import { methodGuard, handleError } from "../_lib/http.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  try {
    const { telegramUserId, questionId } = req.body || {};
    const result = await toggleBookmark(telegramUserId, questionId);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
}
