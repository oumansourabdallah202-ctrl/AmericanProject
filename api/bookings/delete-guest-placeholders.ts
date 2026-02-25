/**
 * POST: delete all bookings where name = 'Guest' and email = 'wix-sync@spinella.ch'.
 * Admin only. Returns { ok: true, deleted: number }.
 */
import { getSupabase, BOOKINGS_TABLE } from "../_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";

type Req = {
  method?: string;
  headers?: { authorization?: string };
};
type Res = {
  status: (code: number) => { json: (body: object) => void };
  setHeader?: (name: string, value: string) => void;
};

function getAuthToken(req: Req): string {
  const auth = req.headers?.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

const GUEST_NAME = "Guest";
const PLACEHOLDER_EMAIL = "wix-sync@spinella.ch";

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

  try {
    const supabase = getSupabase();
    const { data: rows, error: fetchErr } = await supabase
      .from(BOOKINGS_TABLE)
      .select("id")
      .eq("name", GUEST_NAME)
      .eq("email", PLACEHOLDER_EMAIL);
    if (fetchErr) {
      console.error("[delete-guest-placeholders] Fetch error:", fetchErr);
      res.status(500).json({ error: "Failed to fetch guest placeholders" });
      return;
    }
    const ids = (rows ?? []).map((r: { id: string }) => r.id);
    if (ids.length === 0) {
      res.status(200).json({ ok: true, deleted: 0, message: "No guest placeholders to delete." });
      return;
    }
    const { error: deleteErr } = await supabase
      .from(BOOKINGS_TABLE)
      .delete()
      .in("id", ids);
    if (deleteErr) {
      console.error("[delete-guest-placeholders] Delete error:", deleteErr);
      res.status(500).json({ error: "Failed to delete guest placeholders" });
      return;
    }
    res.status(200).json({ ok: true, deleted: ids.length });
  } catch (e) {
    console.error("[delete-guest-placeholders] Error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
