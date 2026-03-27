import { getSupabase, RESERVATION_BLOCKS_TABLE } from "./_lib/supabase.js";

type Res = { status: (code: number) => { json: (body: object) => void }; setHeader?: (name: string, value: string) => void };
type Req = { method?: string };

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
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(RESERVATION_BLOCKS_TABLE)
      .select("id, start_date, end_date, start_time, end_time, reason")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) {
      res.status(200).json({ blocks: [] });
      return;
    }
    res.status(200).json({ blocks: data ?? [] });
  } catch {
    res.status(200).json({ blocks: [] });
  }
}
