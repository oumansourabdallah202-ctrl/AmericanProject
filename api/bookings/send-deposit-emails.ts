/**
 * POST: send deposit-request emails to all guests with a reservation on April 14–20
 * who have not yet received this email. Admin only. Uses Resend + Supabase.
 * Tracks sent via sent_emails type "deposit_request".
 */
import { Resend } from "resend";
import { getSupabase, BOOKINGS_TABLE, type BookingRow } from "../_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";
import {
  depositRequestEmailHtml,
  DEPOSIT_APRIL_14_20,
  getDepositAmount,
} from "../_lib/depositEmail.js";

const FROM = "TestRestaurant <info@testrestaurant.com>";
const SENT_TYPE = "deposit_request";

type SentEmailEntry = { id: string; type: string; sentAt: string };

type Req = { method?: string; headers?: { authorization?: string }; body?: string | object };
type Res = { status: (code: number) => { json: (body: object) => void }; setHeader?: (name: string, value: string) => void };

function getAuthToken(req: Req): string {
  const auth = req.headers?.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

function hasDepositEmailSent(sentEmails: SentEmailEntry[] | null | undefined): boolean {
  return Array.isArray(sentEmails) && sentEmails.some((e) => e.type === SENT_TYPE);
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

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    res.status(503).json({ error: "RESEND_API_KEY not set" });
    return;
  }

  let body: unknown;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
  } catch {
    body = {};
  }
  const testEmail = typeof (body as { testEmail?: string }).testEmail === "string"
    ? (body as { testEmail: string }).testEmail.trim()
    : "";
  const singleBookingId = typeof (body as { bookingId?: string }).bookingId === "string"
    ? (body as { bookingId: string }).bookingId.trim()
    : "";

  const resend = new Resend(resendKey);

  if (testEmail) {
    const { error: sendErr } = await resend.emails.send({
      from: FROM,
      to: [testEmail],
      subject: "TestRestaurant – Deposit to confirm your reservation (April 14–20, 2026) [TEST]",
      html: depositRequestEmailHtml({
        name: "Test Guest",
        date: "2026-04-15",
        time: "19:30",
        partySize: 4,
        amountChf: DEPOSIT_APRIL_14_20.amountSmall,
        iban: DEPOSIT_APRIL_14_20.iban,
      }),
    });
    if (sendErr) {
      console.error("[send-deposit-emails] Test send error:", sendErr);
      res.status(500).json({ error: "Failed to send test email", details: String(sendErr) });
      return;
    }
    res.status(200).json({ ok: true, sent: 1, test: true, message: `Test deposit email sent to ${testEmail}` });
    return;
  }

  const supabase = getSupabase();

  if (singleBookingId) {
    const { data: row, error: fetchErr } = await supabase
      .from(BOOKINGS_TABLE)
      .select("id, name, email, phone, date, time, party_size, sent_emails, status")
      .eq("id", singleBookingId)
      .single();

    if (fetchErr || !row) {
      res.status(404).json({ error: "Booking not found", details: fetchErr ? String(fetchErr) : undefined });
      return;
    }
    const r = row as BookingRow & { sent_emails?: SentEmailEntry[]; status?: string };
    if (r.status === "cancelled") {
      res.status(400).json({ error: "Booking is cancelled" });
      return;
    }
    if (r.date < DEPOSIT_APRIL_14_20.start || r.date > DEPOSIT_APRIL_14_20.end) {
      res.status(400).json({ error: "Booking date is not in April 14–20, 2026" });
      return;
    }
    const email = (r.email ?? "").trim();
    if (!email) {
      res.status(400).json({ error: "Booking has no email" });
      return;
    }
    if (hasDepositEmailSent(r.sent_emails)) {
      res.status(200).json({ ok: true, sent: 0, message: "Deposit email already sent for this reservation." });
      return;
    }

    const name = r.name ?? "Guest";
    const date = r.date ?? "";
    const time = r.time ?? "";
    const partySize = r.party_size ?? 0;
    const amountChf = getDepositAmount(partySize);

    const { data: sendData, error: sendErr } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: "TestRestaurant – Deposit to confirm your reservation (April 14–20, 2026)",
      html: depositRequestEmailHtml({
        name,
        date,
        time,
        partySize,
        amountChf,
        iban: DEPOSIT_APRIL_14_20.iban,
      }),
    });

    if (sendErr) {
      console.error("[send-deposit-emails] Resend error for", email, sendErr);
      res.status(500).json({ error: "Failed to send deposit email", details: String(sendErr) });
      return;
    }

    const resendId = (sendData as { id?: string })?.id ?? "";
    const prevSent = Array.isArray(r.sent_emails) ? r.sent_emails : [];
    const nextSent = [...prevSent, { id: resendId, type: SENT_TYPE, sentAt: new Date().toISOString() }];
    const { error: updateErr } = await supabase
      .from(BOOKINGS_TABLE)
      .update({ sent_emails: nextSent })
      .eq("id", r.id);

    if (updateErr) {
      console.error("[send-deposit-emails] Supabase update error for", r.id, updateErr);
      res.status(500).json({ error: "Failed to record sent email", details: String(updateErr) });
      return;
    }

    res.status(200).json({ ok: true, sent: 1, message: "Deposit email sent." });
    return;
  }

  const { data: rows, error: fetchErr } = await supabase
    .from(BOOKINGS_TABLE)
    .select("id, name, email, phone, date, time, party_size, sent_emails")
    .gte("date", DEPOSIT_APRIL_14_20.start)
    .lte("date", DEPOSIT_APRIL_14_20.end)
    .neq("status", "cancelled");

  if (fetchErr) {
    console.error("[send-deposit-emails] Supabase error:", fetchErr);
    res.status(500).json({ error: "Failed to load bookings", details: String(fetchErr) });
    return;
  }

  const toSend = (rows ?? []).filter((r: BookingRow & { sent_emails?: SentEmailEntry[] }) => {
    const email = (r.email ?? "").trim();
    return email && !hasDepositEmailSent(r.sent_emails);
  });

  if (toSend.length === 0) {
    res.status(200).json({
      ok: true,
      sent: 0,
      message: "No eligible reservations (April 14–20, 2026) or all have already received the deposit email.",
    });
    return;
  }

  let sent = 0;
  const errors: string[] = [];

  for (const row of toSend as (BookingRow & { sent_emails?: SentEmailEntry[] })[]) {
    const email = (row.email ?? "").trim();
    const name = row.name ?? "Guest";
    const date = row.date ?? "";
    const time = row.time ?? "";
    const partySize = row.party_size ?? 0;
    const amountChf = getDepositAmount(partySize);

    const { data: sendData, error: sendErr } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: "TestRestaurant – Deposit to confirm your reservation (April 14–20, 2026)",
      html: depositRequestEmailHtml({
        name,
        date,
        time,
        partySize,
        amountChf,
        iban: DEPOSIT_APRIL_14_20.iban,
      }),
    });

    if (sendErr) {
      console.error("[send-deposit-emails] Resend error for", email, sendErr);
      errors.push(`${email}: ${String(sendErr)}`);
      continue;
    }

    const resendId = (sendData as { id?: string })?.id ?? "";
    const prevSent = Array.isArray(row.sent_emails) ? row.sent_emails : [];
    const nextSent = [...prevSent, { id: resendId, type: SENT_TYPE, sentAt: new Date().toISOString() }];
    const { error: updateErr } = await supabase
      .from(BOOKINGS_TABLE)
      .update({ sent_emails: nextSent })
      .eq("id", row.id);

    if (updateErr) {
      console.error("[send-deposit-emails] Supabase update error for", row.id, updateErr);
      errors.push(`${email}: failed to record sent`);
      continue;
    }
    sent++;
  }

  res.status(200).json({
    ok: true,
    sent,
    totalEligible: toSend.length,
    errors: errors.length > 0 ? errors : undefined,
    message: sent === toSend.length
      ? `Deposit email sent to ${sent} guest(s).`
      : `Sent to ${sent} of ${toSend.length}. ${errors.length} failed.`,
  });
}


