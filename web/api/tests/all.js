import { getAllTests } from "../_lib/supabase.js";
import { methodGuard, handleError } from "../_lib/http.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const limit = parseInt(req.query.limit) || 100;
    const viewer = req.query.userId ? String(req.query.userId) : null;
    const data = await getAllTests(limit, viewer);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}
