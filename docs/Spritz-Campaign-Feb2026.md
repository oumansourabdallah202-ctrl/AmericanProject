# Soirée Découverte des Spritz – Email Campaign (Feb 2026)

## 1. Get the guest list (no Resend – use Make.com or similar)

To avoid using Resend’s monthly limit, export the list of people who had a reservation **this month** and send the campaign from Make.com (or another tool).

### Option A: API export (admin auth)

- **Endpoint:** `GET /api/bookings/guests-export`
- **Query:** `year=2026&month=2` (optional; defaults to current month). Add `&format=csv` to get a `csv` field in the JSON.
- **Auth:** Same as admin: `Authorization: Bearer <supabase_access_token>`.

Example (replace `YOUR_TOKEN` and base URL):

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" "https://YOUR_DOMAIN/api/bookings/guests-export?year=2026&month=2"
```

With CSV in the response:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" "https://YOUR_DOMAIN/api/bookings/guests-export?year=2026&month=2&format=csv"
```

Response (JSON):

- `recipients`: `[{ "email": "...", "name": "..." }]` (unique by email).
- `count`: number of unique emails.
- If `format=csv`: extra field `csv` (string) and `filename` (e.g. `TestRestaurant-guests-2026-02.csv`). You can copy the CSV and paste into Make.com or save to a file.

### Option B: From Admin UI (if you add a button)

You can add an “Export guests this month” button in the Reservations admin that calls this API and downloads the CSV (using the `csv` and `filename` from the response).

---

## 2. Email copy (plain / for Make.com)

**Subject (suggestion):**  
Soirée Découverte des Spritz – 26 février · TestRestaurant

**Body (French):**

```
✨ Soirée Découverte des Spritz chez TestRestaurant ✨

Ce soir, on vous embarque pour un voyage pétillant autour des grands classiques revisités et de créations fruitées & florales 🍊🌿

Aperol, Campari, Hugo, Pêche, Basilic, Thym-citron… il y en a pour tous les goûts ! 🥂
Et pour accompagner chaque verre… un mini tiramisu maison offert 🍰

📍 TestRestaurant
Rue Liotard 4
1202 Genève

Venez trinquer avec nous et célébrer l'art du Spritz dans une ambiance chaleureuse ✨
On vous attend le 26 février ! 🍹🥂

#TestRestaurantGeneve #SpritzNight #Geneve #SoireeDecouverte #AperitivoTime
```

---

## 3. HTML template

- See **`Spritz-Campaign-Feb2026.html`** in this folder.
- Replace **`IMAGE_URL`** in the file with the final URL of your poster image (e.g. after uploading to your site or CDN).  
  Example: if you put the image in `client/public/images/spritz-soiree-2026.jpg`, use:  
  `https://TestRestaurant.ch/images/spritz-soiree-2026.jpg`
- Replace **`{{UNSUBSCRIBE_URL}}`** with your unsubscribe link so recipients can opt out. Examples:
  - Unsubscribe page: `https://TestRestaurant.ch/unsubscribe?email=RECIPIENT_EMAIL` (in Make.com, map the recipient’s email into the URL).
  - Or use a mailto: `mailto:info@TestRestaurant.ch?subject=Désabonnement%20newsletter` so they can request removal by email.

---

## 4. Image

- Your poster image (e.g. “WhatsApp Image 2026-02-20 at 23.49.35.jpeg”) should be uploaded somewhere public.
- Suggested place in this project: **`client/public/images/spritz-soiree-2026.jpg`**  
  Then the image URL is: `https://<your-domain>/images/spritz-soiree-2026.jpg`.
- Use that URL in the HTML template and in Make.com if you send HTML emails.

---

## 5. Sending with Make.com (or similar)

1. Get the guest list (API above or CSV export).
2. Create a scenario: trigger (e.g. “Run once” or “Manual”) → get list → send emails (Gmail, SMTP, Mailchimp, etc.).
3. Use the HTML from `Spritz-Campaign-Feb2026.html` (with `IMAGE_URL` replaced) as the email body.
4. Map the “email” field from the list to the recipient address.

This way you do **not** use Resend for this campaign and stay under the 3000/month limit for transactional emails.
