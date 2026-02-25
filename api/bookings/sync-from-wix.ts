/**
 * Sync reservations from Wix Table Reservations API into Supabase.
 * Admin only. Requires WIX_SITE_ID and WIX_API_KEY in env.
 * Deduplicates by (date, time, email).
 */
import { getSupabase, BOOKINGS_TABLE, type BookingRow } from "../_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";

const WIX_QUERY_URL = "https://www.wixapis.com/table-reservations/reservations/v1/reservations/query";

type Req = { method?: string; headers?: { authorization?: string } };
type Res = { status: (code: number) => { json: (body: object) => void }; setHeader?: (name: string, value: string) => void };

function getAuthToken(req: Req): string {
  const auth = req.headers?.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

interface WixReservation {
  id?: string;
  status?: string;
  details?: { startDate?: string; partySize?: number };
  reservee?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  teamMessage?: string;
}

interface WixQueryResponse {
  reservations?: WixReservation[];
  pagingMetadata?: { hasNext?: boolean; cursors?: { next?: string } };
}

function wixStatusToOurs(s: string | undefined): string {
  if (!s) return "confirmed";
  const map: Record<string, string> = {
    RESERVED: "confirmed",
    REQUESTED: "request",
    HELD: "pending",
    CANCELED: "cancelled",
    DECLINED: "cancelled",
    FINISHED: "confirmed",
    NO_SHOW: "confirmed",
    SEATED: "confirmed",
    PAYMENT_INFORMATION_PENDING: "pending",
  };
  return map[s] ?? "confirmed";
}

function isoToDateAndTime(iso: string | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  try {
    const d = new Date(iso);
    const date = d.toISOString().slice(0, 10);
    const time = d.toTimeString().slice(0, 5);
    return { date, time };
  } catch {
    return { date: "", time: "" };
  }
}

function sendError(res: Res, code: number, error: string, details?: string): void {
  try {
    res.status(code).json(details ? { error, details } : { error });
  } catch {
    // ignore
  }
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

  let token: string;
  let siteId: string | undefined;
  let apiKey: string | undefined;
  try {
    token = getAuthToken(req);
  } catch (e) {
    console.error("[sync-from-wix] Auth read error:", e);
    sendError(res, 500, "Invalid request");
    return;
  }

  let user: Awaited<ReturnType<typeof verifySupabaseToken>>;
  try {
    user = await verifySupabaseToken(token);
  } catch (e) {
    console.error("[sync-from-wix] Token verification error:", e);
    sendError(res, 500, "Authentication failed");
    return;
  }
  if (!user || !isAllowedAdmin(user)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  siteId = process.env.WIX_SITE_ID?.trim();
  apiKey = process.env.WIX_API_KEY?.trim();
  if (!siteId || !apiKey) {
    res.status(503).json({
      error: "Wix sync not configured",
      hint: "Set WIX_SITE_ID and WIX_API_KEY in your deployment environment.",
    });
    return;
  }

  let supabase: ReturnType<typeof getSupabase>;
  try {
    supabase = getSupabase();
  } catch (e) {
    console.error("[sync-from-wix] Supabase init error:", e);
    sendError(res, 503, "Database not configured");
    return;
  }

  const existingKeys = new Set<string>();

  try {
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data: page, error } = await supabase
        .from(BOOKINGS_TABLE)
        .select("date, time, email")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const list = (page ?? []) as { date: string; time: string; email: string }[];
      for (const r of list) {
        const email = (r.email ?? "").toLowerCase().trim();
        existingKeys.add(`${r.date}|${r.time}|${email}`);
      }
      if (list.length < PAGE) break;
      from += PAGE;
    }
  } catch (e) {
    console.error("[sync-from-wix] Failed to load existing bookings:", e);
    sendError(res, 500, "Failed to load existing bookings");
    return;
  }

  const toAdd: Array<Record<string, unknown>> = [];
  let cursor: string | undefined;
  let pageCount = 0;
  const maxPages = 20;

  do {
    // Wix: sort/filter cannot be specified together with cursor. First page uses sort; later pages use cursor only.
    const body: { query: { cursorPaging: { limit: number; cursor?: string }; sort?: { fieldName: string; order: string }[] } } = {
      query: {
        cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 },
      },
    };
    if (!cursor) body.query.sort = [{ fieldName: "createdDate", order: "ASC" }];

    let wixRes: Response;
    try {
      wixRes = await fetch(WIX_QUERY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
          "wix-site-id": siteId,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error("[sync-from-wix] Network error calling Wix:", e);
      sendError(res, 502, "Wix API unreachable", String((e as Error).message).slice(0, 200));
      return;
    }

    if (!wixRes.ok) {
      const text = await wixRes.text();
      console.error("[sync-from-wix] Wix API error:", wixRes.status, text);
      res.status(502).json({
        error: "Wix API error",
        status: wixRes.status,
        details: text.slice(0, 200),
      });
      return;
    }

    let json: WixQueryResponse;
    try {
      json = (await wixRes.json()) as WixQueryResponse;
    } catch (e) {
      console.error("[sync-from-wix] Wix API invalid JSON:", e);
      sendError(res, 502, "Wix API returned invalid response");
      return;
    }
    const reservations = json.reservations ?? [];
    const meta = json.pagingMetadata;
    cursor = meta?.cursors?.next;
    pageCount += 1;

    for (const r of reservations) {
      const start = r.details?.startDate;
      const { date, time } = isoToDateAndTime(start);
      const firstName = (r.reservee?.firstName ?? "").trim();
      const lastName = (r.reservee?.lastName ?? "").trim();
      const name = [firstName, lastName].filter(Boolean).join(" ") || "Guest";
      const email = (r.reservee?.email ?? "").trim();
      const phone = (r.reservee?.phone ?? "").trim();

      if (!date || !time) continue;

      const key = `${date}|${time}|${email.toLowerCase()}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);

      toAdd.push({
        name,
        email: email || "wix-sync@spinella.ch",
        phone: phone || "+41",
        date,
        time,
        party_size: Math.max(1, Number(r.details?.partySize) || 1),
        special_requests: (r.teamMessage ?? null) ? String(r.teamMessage) : null,
        status: wixStatusToOurs(r.status),
      });
    }
  } while (cursor && pageCount < maxPages);

  if (toAdd.length === 0) {
    res.status(200).json({ ok: true, added: 0, message: "No new reservations to import." });
    return;
  }

  try {
    const { error } = await supabase.from(BOOKINGS_TABLE).insert(toAdd);
    if (error) throw error;
    res.status(200).json({ ok: true, added: toAdd.length });
  } catch (err) {
    console.error("[sync-from-wix] Insert error:", err);
    res.status(500).json({ error: "Failed to save reservations to database" });
  }
}
