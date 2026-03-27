import { getSupabase, RESERVATION_BLOCKS_TABLE } from "../_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";

type Res = { status: (code: number) => { json: (body: object) => void }; setHeader?: (name: string, value: string) => void };
type Req = {
  method?: string;
  body?: string | object;
  headers?: { authorization?: string };
};

function getAuthToken(req: Req): string {
  const auth = req.headers?.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

async function requireAuth(req: Req, res: Res): Promise<boolean> {
  if (req.method === "OPTIONS") {
    res.status(204).json({});
    return false;
  }
  const token = getAuthToken(req);
  const user = await verifySupabaseToken(token);
  if (!isAllowedAdmin(user)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader?.("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (!(await requireAuth(req, res))) return;

  const supabase = getSupabase();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from(RESERVATION_BLOCKS_TABLE)
      .select("id, start_date, end_date, start_time, end_time, reason, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      res.status(500).json({ error: "Failed to load reservation blocks", details: String(error) });
      return;
    }
    res.status(200).json({ blocks: data ?? [] });
    return;
  }

  if (req.method === "POST") {
    let body: unknown;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    } catch {
      body = {};
    }
    const b = body as {
      startDate?: string;
      endDate?: string;
      startTime?: string | null;
      endTime?: string | null;
      reason?: string | null;
    };
    const startDate = (b.startDate ?? "").trim();
    const endDate = (b.endDate ?? "").trim();
    const startTime = (b.startTime ?? "").trim();
    const endTime = (b.endTime ?? "").trim();
    const reason = (b.reason ?? "").toString().trim() || null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate > endDate) {
      res.status(400).json({ error: "Invalid date range" });
      return;
    }
    const hasTimeRange = !!startTime || !!endTime;
    if (hasTimeRange) {
      if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || startTime > endTime) {
        res.status(400).json({ error: "Invalid time range" });
        return;
      }
    }

    const { data, error } = await supabase
      .from(RESERVATION_BLOCKS_TABLE)
      .insert({
        start_date: startDate,
        end_date: endDate,
        start_time: hasTimeRange ? startTime : null,
        end_time: hasTimeRange ? endTime : null,
        reason,
        is_active: true,
      })
      .select("id, start_date, end_date, start_time, end_time, reason, is_active, created_at")
      .single();
    if (error) {
      res.status(500).json({ error: "Failed to create reservation block", details: String(error) });
      return;
    }
    res.status(200).json({ ok: true, block: data });
    return;
  }

  if (req.method === "DELETE") {
    let body: unknown;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    } catch {
      body = {};
    }
    const id = ((body as { id?: string }).id ?? "").trim();
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }
    const { error } = await supabase.from(RESERVATION_BLOCKS_TABLE).delete().eq("id", id);
    if (error) {
      res.status(500).json({ error: "Failed to delete reservation block", details: String(error) });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
