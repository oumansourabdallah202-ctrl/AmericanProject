/**
 * POST: return Resend delivery status for given email IDs (for list-view bounced flags).
 * Body: { ids: string[] }. Returns { statuses: Record<string, string> } (id -> delivered|sent|bounced|failed|...).
 * Admin only.
 */
import { Resend } from "resend";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";

type Req = { method?: string; headers?: { authorization?: string }; body?: string | object };
type Res = { status: (code: number) => { json: (body: object) => void }; setHeader?: (name: string, value: string) => void };

function getAuthToken(req: Req): string {
  const auth = req.headers?.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

function mapResendStatus(lastEvent: string | undefined): string {
  if (!lastEvent) return "sent";
  const e = lastEvent.toLowerCase();
  if (e.includes("delivered")) return "delivered";
  if (e.includes("bounced")) return "bounced";
  if (e.includes("failed") || e.includes("complained")) return "failed";
  if (e.includes("delivery_delayed")) return "delayed";
  if (e.includes("opened")) return "opened";
  if (e.includes("clicked")) return "clicked";
  if (e.includes("sent") || e.includes("queued") || e.includes("scheduled")) return "sent";
  return "sent";
}

const MAX_IDS = 300;

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

  let body: { ids?: unknown };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {}) as { ids?: unknown };
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }
  const raw = body.ids;
  const ids = Array.isArray(raw)
    ? (raw as unknown[]).filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, MAX_IDS)
    : [];
  if (ids.length === 0) {
    res.status(200).json({ statuses: {} });
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    res.status(200).json({ statuses: Object.fromEntries(ids.map((id) => [id, "sent"])) });
    return;
  }

  const resend = new Resend(resendKey);
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const got = await resend.emails.get(id);
        const d = (got as { data?: { last_event?: string } }).data;
        return [id, mapResendStatus(d?.last_event)] as const;
      } catch {
        return [id, "sent"] as const;
      }
    })
  );
  const statuses: Record<string, string> = Object.fromEntries(results);
  res.status(200).json({ statuses });
}
