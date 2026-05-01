/** Helpers for Vercel serverless functions. */

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function methodGuard(req, res, allowed) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return false;
  }
  if (!allowed.includes(req.method)) {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}

export function handleError(res, err, fallback = "Internal error") {
  console.error(err);
  res.status(500).json({ error: err?.message || fallback });
}
