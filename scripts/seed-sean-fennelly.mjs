#!/usr/bin/env node
/**
 * Insert Sean Fennelly's reservation (25 Feb 2026, 19:00, 3 guests) into Supabase.
 * Run from project root: node scripts/seed-sean-fennelly.mjs  OR  pnpm run seed:sean
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (or environment).
 *
 * After running, open Admin → Reservations → select date 25/02/2026 → open Sean Fennelly
 * → click "Envoyer l'email de confirmation" to send the confirmation email.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env or the environment.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const BOOKINGS_TABLE = "bookings";

const booking = {
  name: "Sean Fennelly",
  email: "sef@phrd.com",
  phone: "+16789087337",
  date: "2026-02-25",
  time: "19:00",
  party_size: 3,
  special_requests: null,
  status: "confirmed",
};

async function main() {
  const { data: existing } = await supabase
    .from(BOOKINGS_TABLE)
    .select("id")
    .eq("date", booking.date)
    .eq("time", booking.time)
    .eq("email", booking.email)
    .maybeSingle();

  if (existing) {
    console.log("Sean Fennelly's reservation for 2026-02-25 19:00 already exists. ID:", existing.id);
    console.log("Open Admin → Reservations → 25/02/2026 → click the reservation → 'Send confirmation email' to send the email.");
    return;
  }

  const { data, error } = await supabase.from(BOOKINGS_TABLE).insert(booking).select("id").single();
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  console.log("Inserted reservation for Sean Fennelly (25 Feb 2026, 19:00, 3 guests). ID:", data?.id ?? "—");
  console.log("Next: Open Admin → Reservations → select 25/02/2026 → open this reservation → click 'Envoyer l'email de confirmation' to send the email.");
}

main();
