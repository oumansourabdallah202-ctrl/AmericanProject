# Count failed reservations (500 on /api/booking)

To see how many reservation attempts failed (e.g. "Failed to save reservation" / Supabase insert error), use Vercel logs.

**Note:** The script uses `vercel@latest` (not your globally installed CLI) so that `--status-code` and `--since` work. If you still see "unknown option: --status-code", use **option 4 (Dashboard)** below to count failures.

## 1. One-time: log in to Vercel

From the project root:

```bash
npx vercel login
```

Follow the browser prompt. Then link the project if needed:

```bash
npx vercel link
```

## 2. Count failures with the script (recommended)

From the project root:

```bash
# Last 24 hours (default)
npm run vercel:booking-failures

# Last 7 days
node scripts/count-booking-failures.mjs --since 7d

# Last 30 days
node scripts/count-booking-failures.mjs --since 30d
```

The script prints:
- **Total 500 errors** in the time window (all serverless functions).
- **Estimated failed reservations**: 500s that are for `POST /api/booking` (the reservation endpoint).
- Optional list of timestamps for each failure.

## 3. Manual: Vercel CLI only

```bash
# All 500 errors (last 24h)
npx vercel logs --status-code 500 --json

# 500 errors in last 7 days
npx vercel logs --status-code 500 --since 7d --json

# With full message (to confirm it’s booking)
npx vercel logs --status-code 500 --since 7d --expand
```

Then count lines or search for `api/booking` / `[booking]` in the output.

## 4. Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) → your team → **TestRestaurant-geneva** (or the project name).
2. Open **Logs**.
3. Filter by **Status** → `500`, and optionally **Path** or search for `booking`.
4. Use the time range picker to cover the period (e.g. last 7 or 30 days).
5. The number of log rows is the number of failed requests.

**Note:** Log retention depends on your Vercel plan (e.g. 1 day on Hobby, longer on Pro). For older data, only the Dashboard may have it.
