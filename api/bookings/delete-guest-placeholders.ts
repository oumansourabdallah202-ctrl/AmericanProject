/**
 * POST: delete all empty/placeholder bookings:
 * - email = 'wix-sync@spinella.ch', or
 * - name empty / Guest / dash (no real guest data).
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

function isEmptyName(name: string | null | undefined): boolean {
  const s = (name ?? "").trim();
  return s === "" || s === "-" || s.toLowerCase() === "guest";
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

  try {
    const supabase = getSupabase();
    // 1) Delete by placeholder email (Wix sync placeholders)
    const { data: byEmail, error: err1 } = await supabase
      .from(BOOKINGS_TABLE)
      .delete()
      .eq("email", PLACEHOLDER_EMAIL)
      .select("id");
    if (err1) {
      console.error("[delete-guest-placeholders] Delete by email error:", err1);
      res.status(500).json({ error: "Failed to delete placeholders" });
      return;
    }
    let total = Array.isArray(byEmail) ? byEmail.length : 0;

    // 2) Delete rows with empty/Guest/dash name (fetch ids then delete by id to avoid Supabase filter limits)
    const { data: rows, error: fetchErr } = await supabase
      .from(BOOKINGS_TABLE)
      .select("id, name");
    if (!fetchErr && Array.isArray(rows)) {
      const emptyIds = (rows as { id: string; name: string | null }[])
        .filter((r) => isEmptyName(r.name))
        .map((r) => r.id);
      if (emptyIds.length > 0) {
        const { error: err2 } = await supabase.from(BOOKINGS_TABLE).delete().in("id", emptyIds);
        if (!err2) total += emptyIds.length;
        else console.error("[delete-guest-placeholders] Delete empty-name error:", err2);
      }
    }

    res.status(200).json({ ok: true, deleted: total, message: total === 0 ? "No empty reservations to delete." : undefined });
  } catch (e) {
    console.error("[delete-guest-placeholders] Error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
