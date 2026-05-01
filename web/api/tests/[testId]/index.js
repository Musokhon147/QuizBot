import { getTest } from "../../_lib/supabase.js";
import { methodGuard, handleError } from "../../_lib/http.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const test = await getTest(req.query.testId);
    res.json(test);
  } catch (err) {
    res.status(404).json({ error: "Test not found" });
  }
}
