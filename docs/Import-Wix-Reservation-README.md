# Add Brigitte Moser reservation (24 Feb 2026)

**Option A – From the project (recommended)**  
From the project root, with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your `.env`:

```bash
pnpm run seed:brigitte
```

(or `node scripts/seed-brigitte-moser.mjs`). This inserts her reservation into Supabase. You’ll see her in **Admin** → **Reservations** → **Réservations du jour** (date: **24/02/2026**).

**Option B – From Admin**  
In **Admin** → **Reservations**, use **Import JSON** and select `docs/import-wix-reservation-brigitte-moser.json`.

**After she’s in the list**  
To send the confirmation email: open her reservation, then click **Send confirmation email** in the detail panel.

Reservation: **Brigitte Moser**, brigitte.moser@bluewin.ch, +41 78 880 90 91, 4 guests, 24 Feb 2026, 19:00, status confirmed.
