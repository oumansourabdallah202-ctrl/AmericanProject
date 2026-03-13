/**
 * GET: list all guests who mistakenly received the April 14–20 *2025* deposit-request email.
 * (The campaign was intended for April 14–20, 2026. This endpoint returns 2025 recipients for apology/follow-up.)
 * Admin only.
 */
import { getSupabase, BOOKINGS_TABLE } from "../_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";

const MISTAKE_START = "2025-04-14";
const MISTAKE_END = "2025-04-20";

type SentEmailEntry = { id: string; type: string; sentAt: string };

type Req = { method?: string; headers?: { authorization?: string } };
type Res = { status: (code: number) => { json: (body: object) => void }; setHeader?: (name: string, value: string) => void };

function getAuthToken(req: Req): string {
  const auth = req.headers?.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

function getDepositSentAt(sentEmails: SentEmailEntry[] | null | undefined): string | null {
  if (!Array.isArray(sentEmails)) return null;
  const e = sentEmails.find((x) => x.type === "deposit_request");
  return e?.sentAt ?? null;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader?.("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).json({});
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const token = getAuthToken(req);
    const user = await verifySupabaseToken(token);
    if (!user || !isAllowedAdmin(user)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let supabase;
    try {
      supabase = getSupabase();
    } catch (e) {
      console.error("[deposit-emails-recipients-2025-mistake] Supabase init:", e);
      res.status(500).json({ error: "Server configuration error", details: "Database not configured" });
      return;
    }

    const { data: rows, error } = await supabase
      .from(BOOKINGS_TABLE)
      .select("*")
      .gte("date", MISTAKE_START)
      .lte("date", MISTAKE_END);

    if (error) {
      console.error("[deposit-emails-recipients-2025-mistake] Supabase error:", error);
      res.status(500).json({ error: "Failed to load bookings", details: String(error.message ?? error) });
      return;
    }

    type Row = Record<string, unknown> & { sent_emails?: SentEmailEntry[] };
    const rawRows = Array.isArray(rows) ? rows : [];
    const recipients = rawRows
      .filter((r: Row) => getDepositSentAt(r.sent_emails) !== null)
      .map((r: Row) => ({
        id: r.id ?? "",
        name: (r.name as string) ?? "",
        email: String(r.email ?? "").trim(),
        phone: (r.phone as string) ?? "",
        date: (r.date as string) ?? "",
        time: (r.time as string) ?? "",
        partySize: Number(r.party_size) || 0,
        status: (r.status as string) ?? "",
        specialRequests: (r.special_requests as string) ?? "",
        dietaryRequirements: (r.dietary_requirements as string) ?? "",
        createdAt: (r.created_at as string) ?? "",
        depositSentAt: getDepositSentAt(r.sent_emails),
      }));

    res.status(200).json({ recipients });
  } catch (err) {
    console.error("[deposit-emails-recipients-2025-mistake] Error:", err);
    res.status(500).json({
      error: "Failed to load list",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
