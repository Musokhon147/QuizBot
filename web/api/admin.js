import {
  listAllUsersWithStats,
  getUserRole,
  setUserRole,
} from "./_lib/supabase.js";
import { setCors, handleError } from "./_lib/http.js";

/**
 * Consolidated admin endpoint. Vercel Hobby plans cap serverless functions
 * at 12, so we route by ?action= instead of splitting into 3 files.
 *
 * GET  /api/admin?action=me&userId=<id>
 *      → caller's own role (used by the frontend to decide whether to
 *        show the admin tab)
 *
 * GET  /api/admin?action=users&actor=<super_admin_id>
 *      → full user list with roles, stats. Super-admin gated.
 *
 * POST /api/admin?action=set-role
 *      body: { actor, telegramUserId, role }
 *      → change a user's role. Super-admin gated, self-demotion blocked.
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query.action;

  try {
    if (action === "me") {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
      }
      const userId = req.query.userId ? String(req.query.userId) : null;
      if (!userId) return res.status(400).json({ error: "userId required" });
      const role = await getUserRole(userId);
      return res.json({ telegramUserId: userId, role });
    }

    if (action === "users") {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
      }
      const actor = req.query.actor ? String(req.query.actor) : null;
      if (!actor) return res.status(400).json({ error: "actor required" });
      const actorRole = await getUserRole(actor);
      if (actorRole !== "super_admin") {
        return res.status(403).json({ error: "Super-admin access required" });
      }
      const users = await listAllUsersWithStats(500);
      return res.json(users);
    }

    if (action === "set-role") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }
      const { actor, telegramUserId, role } = req.body || {};
      if (!actor || !telegramUserId || !role) {
        return res.status(400).json({ error: "actor, telegramUserId, role required" });
      }
      const actorRole = await getUserRole(String(actor));
      if (actorRole !== "super_admin") {
        return res.status(403).json({ error: "Super-admin access required" });
      }
      if (String(actor) === String(telegramUserId) && role !== "super_admin") {
        return res.status(400).json({
          error: "Super-admins cannot demote themselves",
        });
      }
      const updated = await setUserRole(String(telegramUserId), role);
      return res.json(updated);
    }

    return res.status(400).json({ error: "Unknown action — use ?action=me|users|set-role" });
  } catch (err) {
    handleError(res, err);
  }
}
