/**
 * Admin-only API: list newsletter subscribers (for admin tab + CSV export).
 * GET /api/newsletter-subscribers — returns { subscribers: [{ email, name?, subscribed, subscribedAt }] }.
 * Enriches with name from clients table when the same email exists there.
 */

import { getSupabase, NEWSLETTER_TABLE, CLIENTS_TABLE } from "./_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "./_lib/supabaseAuth.js";

type Res = { status: (code: number) => { json: (body: object) => void }; setHeader?: (name: string, value: string) => void };

function getAuthToken(req: { headers?: { authorization?: string } }): string {
  const auth = req.headers?.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

async function requireAuth(req: { method?: string }, res: Res): Promise<boolean> {
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

export type NewsletterSubscriberDoc = {
  email: string;
  name: string | null;
  subscribed: boolean;
  subscribedAt: string | null;
};

export default async function handler(
  req: { method?: string; headers?: { authorization?: string } },
  res: Res
): Promise<void> {
  res.setHeader?.("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!(await requireAuth(req, res))) return;

  try {
    const supabase = getSupabase();
    const PAGE = 1000;
    let rows: Array<{ email: string; subscribed?: boolean; subscribed_at?: string | null }> = [];
    let from = 0;
    while (true) {
      const { data: page, error } = await supabase
        .from(NEWSLETTER_TABLE)
        .select("email, subscribed, subscribed_at")
        .order("subscribed_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const list = (page ?? []) as Array<{ email: string; subscribed?: boolean; subscribed_at?: string | null }>;
      rows = rows.concat(list);
      if (list.length < PAGE) break;
      from += PAGE;
    }

    // Optional: enrich with name from clients (by email)
    const emails = [...new Set(rows.map((r) => r.email?.toLowerCase()).filter(Boolean))] as string[];
    const nameByEmail = new Map<string, string>();
    if (emails.length > 0) {
      let cFrom = 0;
      while (true) {
        const { data: clientPage, error: cErr } = await supabase
          .from(CLIENTS_TABLE)
          .select("email, name")
          .range(cFrom, cFrom + PAGE - 1);
        if (cErr) break;
        const list = (clientPage ?? []) as Array<{ email?: string; name?: string }>;
        for (const c of list) {
          const e = c.email?.toLowerCase();
          if (e && emails.includes(e) && c.name?.trim()) nameByEmail.set(e, c.name.trim());
        }
        if (list.length < PAGE) break;
        cFrom += PAGE;
      }
    }

    const subscribers: NewsletterSubscriberDoc[] = rows.map((r) => ({
      email: r.email ?? "",
      name: (r.email && nameByEmail.get(r.email.toLowerCase())) ?? null,
      subscribed: r.subscribed ?? true,
      subscribedAt: r.subscribed_at ?? null,
    }));

    res.status(200).json({ subscribers });
  } catch (err) {
    console.error("[newsletter-subscribers]", err);
    res.status(500).json({ error: "Failed to load newsletter subscribers" });
  }
}
