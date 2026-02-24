/**
 * POST: set status to "archived" for given booking ids (request/pending only). Admin only.
 * Body: { ids: string[] }. Does not delete; bookings remain in DB and no email is sent.
 */
import { getSupabase, BOOKINGS_TABLE } from "../_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";

type Req = {
  method?: string;
  headers?: { authorization?: string };
  body?: unknown;
};
type Res = {
  status: (code: number) => { json: (body: object) => void };
  setHeader?: (name: string, value: string) => void };
};

function getAuthToken(req: Req): string {
  const auth = req.headers?.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader?.("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).json({});
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = getAuthToken(req);
  const user = await verifySupabaseToken(token);
  if (!isAllowedAdmin(user)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let body: unknown;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }
  const ids = Array.isArray((body as { ids?: unknown }).ids)
    ? (body as { ids: unknown[] }).ids.filter((id): id is string => typeof id === "string" && id.trim() !== "")
    : [];
  if (ids.length === 0) {
    res.status(400).json({ error: "Missing or empty ids array" });
    return;
  }

  const supabase = getSupabase();
  const updated_at = new Date().toISOString();
  let archived = 0;
  for (const id of ids) {
    const { data: row, error: fetchErr } = await supabase
      .from(BOOKINGS_TABLE)
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (fetchErr || !row) continue;
    const status = (row as { status?: string }).status ?? "";
    if (status !== "request" && status !== "pending") continue;
    const { error: updateErr } = await supabase
      .from(BOOKINGS_TABLE)
      .update({ status: "archived", updated_at })
      .eq("id", id);
    if (!updateErr) archived++;
  }
  res.status(200).json({ ok: true, archived, total: ids.length });
}
