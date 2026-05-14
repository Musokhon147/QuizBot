import { setUserRole, getUserRole } from "../_lib/supabase.js";
import { methodGuard, handleError } from "../_lib/http.js";

/**
 * POST /api/admin/set-role
 * Body: { actor: <super_admin_id>, telegramUserId: <target>, role: <new role> }
 *
 * Super-admin only. Prevents super-admins from demoting themselves
 * (so the system can't get locked out).
 */
export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  try {
    const { actor, telegramUserId, role } = req.body || {};
    if (!actor || !telegramUserId || !role) {
      return res.status(400).json({ error: "actor, telegramUserId, role required" });
    }

    const actorRole = await getUserRole(String(actor));
    if (actorRole !== "super_admin") {
      return res.status(403).json({ error: "Super-admin access required" });
    }

    // Don't allow self-demotion (prevents lockout)
    if (String(actor) === String(telegramUserId) && role !== "super_admin") {
      return res.status(400).json({
        error: "Super-admins cannot demote themselves. Ask another super-admin to do it.",
      });
    }

    const updated = await setUserRole(String(telegramUserId), role);
    res.json(updated);
  } catch (err) {
    handleError(res, err);
  }
}
