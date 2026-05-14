import { getUserRole } from "../_lib/supabase.js";
import { methodGuard, handleError } from "../_lib/http.js";

/**
 * GET /api/admin/me?userId=<telegram_id>
 * Returns the caller's role. Used by the frontend to decide whether to
 * show the admin tab.
 */
export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const userId = req.query.userId ? String(req.query.userId) : null;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const role = await getUserRole(userId);
    res.json({ telegramUserId: userId, role });
  } catch (err) {
    handleError(res, err);
  }
}
