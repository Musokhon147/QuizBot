import { getUserTests } from "../../_lib/supabase.js";
import { methodGuard, handleError } from "../../_lib/http.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const tests = await getUserTests(req.query.telegramUserId);
    res.json(tests);
  } catch (err) {
    handleError(res, err);
  }
}
