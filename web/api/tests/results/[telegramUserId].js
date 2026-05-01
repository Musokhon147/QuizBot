import { getResults } from "../../_lib/supabase.js";
import { methodGuard, handleError } from "../../_lib/http.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const results = await getResults(req.query.telegramUserId);
    res.json(results);
  } catch (err) {
    handleError(res, err);
  }
}
