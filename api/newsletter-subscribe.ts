/**
 * Public API: subscribe an email to the newsletter.
 * Stores in Supabase (NEWSLETTER_TABLE). Works on Vercel without tRPC/MySQL.
 */

import { getSupabase, NEWSLETTER_TABLE } from "./_lib/supabase.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Res = { status: (code: number) => { json: (body: object) => void }; setHeader?: (name: string, value: string) => void };

export default async function handler(
  req: { method?: string; body?: string | object },
  res: Res
): Promise<void> {
  res.setHeader?.("Access-Control-Allow-Origin", "*");
  res.setHeader?.("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).json({});
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body: { email?: unknown };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {}) as { email?: unknown };
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const raw = body.email;
  const email = typeof raw === "string" ? raw.trim() : "";
  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

  try {
    const supabase = getSupabase();
    // Upsert: new subscriber gets inserted; existing (e.g. unsubscribed) gets subscribed = true again
    const { error } = await supabase
      .from(NEWSLETTER_TABLE)
      .upsert(
        { email, subscribed: true, subscribed_at: new Date().toISOString() },
        { onConflict: "email", ignoreDuplicates: false }
      );
    if (error) {
      console.error("[Newsletter] Upsert failed:", error);
      res.status(500).json({ error: "Failed to subscribe" });
      return;
    }
    res.status(200).json({ success: true });
  } catch (e) {
    console.error("[Newsletter] Error:", e);
    res.status(500).json({ error: "Failed to subscribe" });
  }
}
