# Synchronizing Wix Table Reservations with the Admin Page

You can get Wix reservations into your TestRestaurant admin (Supabase) in two ways: **manual export/import** or **automated API sync**.

---

## Option 1: Manual – Export from Wix, then import

### Step 1: Export from Wix

1. In the **Wix dashboard**, go to **Reservas de mesas** (Table Reservations) → **Reservas**.
2. Optionally filter by date or status.
3. Use the **Export** option to download a **CSV** file of reservations.

### Step 2: Import into the admin

- **CSV:** In **Admin** → **Reservations** → tab **Toutes les réservations**, use **Importer CSV**. The file must have columns in this order: **date, time, name, email, phone, guests, status, notes** (one row per reservation). If your Wix export uses different column order or names, rearrange or rename columns in Excel/Sheets to match, then export as CSV again.
- **JSON:** If you prefer, convert the CSV to JSON in the format below and use **Import JSON**:

```json
{
  "bookings": [
    {
      "name": "Guest Name",
      "email": "guest@example.com",
      "phone": "+41 00 000 00 00",
      "date": "2026-02-24",
      "time": "19:00",
      "partySize": 4,
      "status": "confirmed",
      "specialRequests": null
    }
  ]
}
```

Use this when you want to sync occasionally (e.g. weekly) or for a one-off import of past Wix reservations.

---

## Option 2: Automated – “Sync from Wix” (API)

The admin has a **Sync from Wix** button that calls the Wix Table Reservations API and adds new reservations into Supabase. No export/upload needed.

### Prerequisites

1. **Wix Developer account** and access to your Wix site’s API.
2. **API key** with permission to read reservations (e.g. “Manage Reservations (Medium)”).
3. **Site ID**: your Wix site ID (from the site URL or Wix dashboard).

### Setup

1. In the [Wix Developer Center](https://dev.wix.com/), create an API key for your site and grant **Table Reservations** / **Manage Reservations (Medium)** (or the scope that allows querying reservations).
2. Get your **Site ID** (from the Wix dashboard URL or site settings) and the **API key** (from the key you created).
3. **Where to put them in Vercel:**
   - Open your project on [Vercel](https://vercel.com) → **Settings** → **Environment Variables**.
   - Add:
     - **Name:** `WIX_SITE_ID` → **Value:** your Wix site ID (e.g. `abc12345-...`).
     - **Name:** `WIX_API_KEY` → **Value:** your Wix API key (the long token).
   - Choose **Production** (and **Preview** if you want sync to work on preview deployments).
   - Save. **Redeploy** the project (Deployments → ⋮ on latest → Redeploy) so the new variables are applied.
4. In **Admin** → **Reservations**, click **Synchroniser avec Wix** (Sync from Wix). The app will:
   - Query Wix for **all** reservations (paginated, oldest first),
   - Map them to the TestRestaurant booking format,
   - **Skip** any that already exist in the admin (same date, time, and email),
   - **Insert** only the new ones into Supabase.

### New vs old reservations

- **New reservations** in Wix: run **Sync from Wix** whenever you want; only reservations not already in the admin are added.
- **Old reservations** in Wix: run **Sync from Wix** once to pull all past Wix reservations into the admin. They are deduplicated by **date + time + email**, so you can run sync multiple times without creating duplicates.
- Existing admin reservations (e.g. added manually or from TestRestaurant.ch) are never overwritten; Wix reservations with the same date, time, and email are skipped.

### If “Sync from Wix” is disabled

The button is only enabled when `WIX_SITE_ID` and `WIX_API_KEY` are set in the environment. If they are missing, use **Option 1** (CSV export + import) instead.

---

## Long-term: single source of truth

For a single place to manage all reservations:

1. Prefer **TestRestaurant.ch/reservations** for new bookings and keep the admin as the only dashboard.
2. In Wix, **disable** the table reservation form or replace it with a link to **https://www.TestRestaurant.ch/reservations**.
3. Use **Sync from Wix** or **CSV import** only to bring over existing or legacy Wix reservations, then manage everything in the admin.

See **Reservations-Wix-Single-Source.md** for the full checklist.
