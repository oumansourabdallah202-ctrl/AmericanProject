#!/usr/bin/env node
/**
 * Count how many times POST /api/booking returned 500 (e.g. "Failed to save reservation").
 * Requires: npx vercel login first. Uses vercel@latest so --status-code and --since work.
 *
 * Usage:
 *   node scripts/count-booking-failures.mjs [--since 7d]
 *   npm run vercel:booking-failures
 *
 * Default: last 24 hours. Use --since 7d or --since 30d for longer.
 */

import { spawn } from "child_process";

const args = [
  "vercel@latest",
  "logs",
  "--status-code", "500",
  "--json",
  "--no-color",
];
const sinceIndex = process.argv.indexOf("--since");
if (sinceIndex !== -1 && process.argv[sinceIndex + 1]) {
  args.push("--since", process.argv[sinceIndex + 1]);
}

const child = spawn("npx", args, {
  cwd: process.cwd(),
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
});

let total500 = 0;
let booking500 = 0;
const bookingPaths = ["/api/booking", "api/booking"];
const lines = [];

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  const parts = chunk.split("\n").filter(Boolean);
  for (const line of parts) {
    total500++;
    try {
      const obj = JSON.parse(line);
      const path = obj.path ?? obj.request?.path ?? "";
      const msg = (obj.message ?? "").toString();
      const isBooking =
        bookingPaths.some((p) => path.includes(p) || path.endsWith(p)) ||
        /\[booking\]|api\/booking/.test(msg);
      if (isBooking) {
        booking500++;
        const ts = obj.timestamp ?? obj.date ?? obj.created;
        if (ts) lines.push({ ts, path: path || "(no path)" });
      }
    } catch {
      total500--;
    }
  }
});

child.stderr.on("data", (d) => process.stderr.write(d));

child.on("close", (code) => {
  if (code !== 0 && total500 === 0 && booking500 === 0) {
    console.error("Run 'npx vercel login' first, then try again.");
    process.exit(1);
  }
  console.log("--- Booking reservation failures (500) ---");
  console.log("Total 500 errors in window:", total500);
  console.log("Estimated failed reservations (POST /api/booking 500):", booking500);
  if (lines.length > 0 && lines.length <= 50) {
    console.log("\nTimestamps (UTC):");
    lines.forEach(({ ts }) => console.log(" ", ts));
  } else if (lines.length > 50) {
    console.log("\n(First 20 timestamps)");
    lines.slice(0, 20).forEach(({ ts }) => console.log(" ", ts));
  }
});
