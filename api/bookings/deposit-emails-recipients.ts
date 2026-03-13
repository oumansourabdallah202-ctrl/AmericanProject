/**
 * GET: list all guests who received the April 14–20 deposit-request email.
 * Admin only. Reads from Supabase (bookings with sent_emails containing deposit_request).
 */
import { getSupabase, BOOKINGS_TABLE, type BookingRow } from "../_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";
import { DEPOSIT_APRIL_14_20 } from "../_lib/depositEmail.js";

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

  const token = getAuthToken(req);
  const user = await verifySupabaseToken(token);
  if (!user || !isAllowedAdmin(user)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const supabase = getSupabase();
  const { data: rows, error } = await supabase
    .from(BOOKINGS_TABLE)
    .select("id, name, email, phone, date, time, party_size, status, special_requests, dietary_requirements, created_at, sent_emails")
    .gte("date", DEPOSIT_APRIL_14_20.start)
    .lte("date", DEPOSIT_APRIL_14_20.end);

  if (error) {
    console.error("[deposit-emails-recipients] Supabase error:", error);
    res.status(500).json({ error: "Failed to load bookings", details: String(error) });
    return;
  }

  const recipients = (rows ?? [])
    .filter((r: BookingRow & { sent_emails?: SentEmailEntry[] }) => getDepositSentAt(r.sent_emails) !== null)
    .map((r: BookingRow & { sent_emails?: SentEmailEntry[] }) => ({
      id: r.id,
      name: r.name ?? "",
      email: (r.email ?? "").trim(),
      phone: r.phone ?? "",
      date: r.date ?? "",
      time: r.time ?? "",
      partySize: r.party_size ?? 0,
      status: r.status ?? "",
      specialRequests: r.special_requests ?? "",
      dietaryRequirements: r.dietary_requirements ?? "",
      createdAt: r.created_at ?? "",
      depositSentAt: getDepositSentAt(r.sent_emails),
    }));

  res.status(200).json({ recipients });
}
