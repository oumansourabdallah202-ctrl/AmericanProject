/**
 * POST: delete all bookings where email = 'wix-sync@spinella.ch' (placeholder rows from Wix sync).
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
    // Delete by placeholder email only so we catch all "Guest" rows regardless of name casing
    const { data: deletedRows, error: deleteErr } = await supabase
      .from(BOOKINGS_TABLE)
      .delete()
      .eq("email", PLACEHOLDER_EMAIL)
      .select("id");
    if (deleteErr) {
      console.error("[delete-guest-placeholders] Delete error:", deleteErr);
      res.status(500).json({ error: "Failed to delete guest placeholders" });
      return;
    }
    const count = Array.isArray(deletedRows) ? deletedRows.length : 0;
    res.status(200).json({ ok: true, deleted: count, message: count === 0 ? "No guest placeholders to delete." : undefined });
  } catch (e) {
    console.error("[delete-guest-placeholders] Error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
