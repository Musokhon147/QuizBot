import { listAllUsersWithStats, getUserRole } from "../_lib/supabase.js";
import { methodGuard, handleError } from "../_lib/http.js";

/**
 * GET /api/admin/users?actor=<super_admin_telegram_id>
 * Returns the full user roster with roles. Super-admin gated.
 */
export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const actor = req.query.actor ? String(req.query.actor) : null;
    if (!actor) return res.status(400).json({ error: "actor query param required" });

    const actorRole = await getUserRole(actor);
    if (actorRole !== "super_admin") {
      return res.status(403).json({ error: "Super-admin access required" });
    }

    const users = await listAllUsersWithStats(500);
    res.json(users);
  } catch (err) {
    handleError(res, err);
  }
}
