#!/usr/bin/env node
/**
 * Insert Brigitte Moser's reservation (24 Feb 2026, 19:00) into Supabase.
 * Run from project root: node scripts/seed-brigitte-moser.mjs
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (or environment).
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
  name: "Brigitte Moser",
  email: "brigitte.moser@bluewin.ch",
  phone: "+41 78 880 90 91",
  date: "2026-02-24",
  time: "19:00",
  party_size: 4,
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
    console.log("Brigitte Moser's reservation for 2026-02-24 19:00 already exists in the database. Nothing to do.");
    return;
  }

  const { data, error } = await supabase.from(BOOKINGS_TABLE).insert(booking).select("id").single();
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  console.log("Inserted reservation for Brigitte Moser (24 Feb 2026, 19:00). ID:", data?.id ?? "—");
  console.log("You can now see her in Admin → Reservations → Réservations du jour (date: 24/02/2026).");
}

main();
