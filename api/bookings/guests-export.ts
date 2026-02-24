/**
 * GET: export unique guests (email, name) who had a booking in a given month. Admin only.
 * Query: year=2026&month=2 (default: current month). format=csv to download CSV.
 */
import { getSupabase, BOOKINGS_TABLE } from "../_lib/supabase.js";
import { verifySupabaseToken, isAllowedAdmin } from "../_lib/supabaseAuth.js";

type Req = {
  method?: string;
  headers?: { authorization?: string };
  query?: { year?: string; month?: string; format?: string };
};
type Res = {
  status: (code: number) => { json: (body: object) => void };
  setHeader?: (name: string, value: string) => void;
};

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
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = getAuthToken(req);
  const user = await verifySupabaseToken(token);
  if (!isAllowedAdmin(user)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const now = new Date();
  const year = parseInt(req.query?.year ?? String(now.getFullYear()), 10);
  const month = parseInt(req.query?.month ?? String(now.getMonth() + 1), 10);
  const format = (req.query?.format ?? "").toLowerCase();

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const supabase = getSupabase();
  const PAGE = 1000;
  let rows: Array<{ email: string; name: string; date: string }> = [];
  let from = 0;

  while (true) {
    const { data: page, error } = await supabase
      .from(BOOKINGS_TABLE)
      .select("email, name, date")
      .gte("date", start)
      .lte("date", end)
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("[guests-export]", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
      return;
    }
    const list = (page ?? []) as Array<{ email?: string; name?: string; date?: string }>;
    for (const r of list) {
      const email = (r.email ?? "").trim().toLowerCase();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rows.push({
          email,
          name: (r.name ?? "").trim().slice(0, 200) || email,
          date: r.date ?? "",
        });
      }
    }
    if (list.length < PAGE) break;
    from += PAGE;
  }

  // Dedupe by email, keep first occurrence (name may vary)
  const byEmail = new Map<string, { email: string; name: string }>();
  for (const r of rows) {
    if (!byEmail.has(r.email)) byEmail.set(r.email, { email: r.email, name: r.name });
  }
  const recipients = Array.from(byEmail.values()).sort((a, b) =>
    a.email.localeCompare(b.email)
  );

  if (format === "csv") {
    const header = "email,name\n";
    const body = recipients.map((r) => `"${r.email.replace(/"/g, '""')}","${r.name.replace(/"/g, '""')}"`).join("\n");
    res.status(200).json({
      year,
      month,
      count: recipients.length,
      csv: header + body,
      filename: `spinella-guests-${year}-${String(month).padStart(2, "0")}.csv`,
    });
    return;
  }

  res.status(200).json({
    year,
    month,
    start,
    end,
    count: recipients.length,
    recipients,
  });
}
