/**
 * POST: send confirmation email for an existing booking (by id). Admin only.
 * Does not change status; only sends the email and appends to sent_emails.
 */
import { Resend } from "resend";
import { getSupabase, BOOKINGS_TABLE, type BookingRow } from "../_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";
import { confirmedEmailHtml } from "../_lib/confirmedEmail.js";
import { VALENTINES_DATE, getBaseUrl, valentinesGuestEmailHtml } from "../_lib/valentinesEmail.js";

const FROM = "TestRestaurant <info@testrestaurant.com>";
export type SentEmailEntry = { id: string; type: string; sentAt: string };

type Req = { method?: string; headers?: { authorization?: string }; body?: string | object };
type Res = { status: (code: number) => { json: (body: object) => void }; setHeader?: (name: string, value: string) => void };

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
  if (!user || !isAllowedAdmin(user)) {
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
  const id = typeof (body as { id?: string }).id === "string" ? (body as { id: string }).id.trim() : "";
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    res.status(503).json({ error: "RESEND_API_KEY not set" });
    return;
  }

  const supabase = getSupabase();
  const { data: row, error: fetchErr } = await supabase
    .from(BOOKINGS_TABLE)
    .select("name, email, phone, date, time, party_size, special_requests, sent_emails")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !row) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const r = row as BookingRow & { sent_emails?: SentEmailEntry[] };
  const email = (r.email ?? "").trim();
  if (!email) {
    res.status(400).json({ error: "Booking has no email" });
    return;
  }

  const resend = new Resend(resendKey);
  const isValentines = r.date === VALENTINES_DATE;
  const flyerUrl = `${getBaseUrl()}/valentines-menu.jpeg`;

  const { data: sendData, error: sendErr } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject: isValentines ? `Saint-Valentin à TestRestaurant – Votre table est réservée` : `TestRestaurant – Votre réservation est confirmée`,
    html: isValentines
      ? valentinesGuestEmailHtml(r.name ?? "Client", flyerUrl)
      : confirmedEmailHtml({
          name: r.name ?? "Client",
          date: r.date ?? "",
          time: r.time ?? "",
          partySize: r.party_size ?? 0,
          phone: r.phone ?? "",
          specialRequests: r.special_requests ?? null,
        }),
  });

  if (sendErr) {
    console.error("[send-confirmation] Resend error:", sendErr);
    res.status(500).json({ error: "Failed to send email", details: String(sendErr) });
    return;
  }

  const resendId = (sendData as { id?: string })?.id;
  const prevSent = Array.isArray(r.sent_emails) ? r.sent_emails : [];
  const nextSent = [...prevSent, { id: resendId ?? "", type: "confirmed", sentAt: new Date().toISOString() }];
  await supabase.from(BOOKINGS_TABLE).update({ sent_emails: nextSent }).eq("id", id);

  res.status(200).json({ ok: true, message: "Confirmation email sent" });
}



