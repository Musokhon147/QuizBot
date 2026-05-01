import { getLeaderboard } from "../_lib/supabase.js";
import { methodGuard, handleError } from "../_lib/http.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await getLeaderboard(limit);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}
