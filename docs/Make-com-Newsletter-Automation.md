# Newsletter + Make.com automation (Supabase)

This doc explains how to **send newsletter emails** only to **subscribed** contacts using **Supabase** as the source of truth and **Make.com** for automation. Recipients can unsubscribe via a link; the link is stored in Supabase so you never email unsubscribed users.

---

## 1. Supabase: newsletter table

Newsletter signups from the website are stored in Supabase in **`newsletter_subscribers`**.

- **Create/update the table** (run once in Supabase → SQL Editor): see **`docs/supabase-newsletter-table.sql`**.
- Columns used:
  - `email` – primary key
  - `subscribed_at` – when they signed up
  - `subscribed` – **boolean**: `true` = can receive emails, `false` = unsubscribed (do not email)
  - `unsubscribe_token` – **UUID**, unique per row; used in the unsubscribe link so the URL does not expose the email

Only rows with **`subscribed = true`** should receive newsletter emails.

---

## 2. Unsubscribe link (base URL)

Two equivalent URLs (use one in your emails):

- **By token (recommended):**  
  `https://TestRestaurant.ch/api/newsletter-unsubscribe?token=UNSUBSCRIBE_TOKEN`  
  Replace `UNSUBSCRIBE_TOKEN` with the `unsubscribe_token` of that row (from Supabase).
- **Friendly redirect:**  
  `https://TestRestaurant.ch/unsubscribe?token=UNSUBSCRIBE_TOKEN`  
  Same token; the page redirects to the API which performs the unsubscribe and shows a confirmation.

When the user clicks the link, the API sets **`subscribed = false`** for that row. Make.com should only send to rows where **`subscribed = true`**, so after unsubscribe they will not receive the next run.

---

## 3. Make.com scenario: “Send newsletter to Supabase subscribers”

1. **Trigger**  
   - e.g. “Run once” / “Manual” or a schedule (e.g. every campaign).

2. **Supabase: “Search rows” (or “Select data”)**
   - **Connection:** Supabase (Project URL + **service_role** key from Supabase → Project settings → API).
   - **Table:** `newsletter_subscribers`
   - **Filter:** `subscribed` = `true`  
   - So you only get contacts who are still subscribed.

3. **Iterator**  
   - Iterate over the Supabase results (one module per row).

4. **Email (Gmail / SMTP / etc.)**
   - **To:** `email` from the current row.
   - **Subject / body:** your campaign (e.g. HTML from `docs/Espresso-Time-Campaign-Mar2026.html`).
   - **Unsubscribe URL in the body:**  
     - In the HTML, use a placeholder like `{{unsubscribe_url}}`.
     - In Make.com, map:  
       `https://TestRestaurant.ch/api/newsletter-unsubscribe?token={{unsubscribe_token}}`  
     where `unsubscribe_token` is the field from the current Supabase row.

So for each recipient you send one email and put **their** `unsubscribe_token` in the link. When they click, they are unsubscribed and won’t get the next run.

---

## 4. Email template placeholder

In your HTML (e.g. Espresso Time or Spritz campaign), put the unsubscribe link where you want it (usually in the footer):

```html
<a href="{{unsubscribe_url}}" style="color:#8a7a5c;text-decoration:underline;">Se désabonner (Unsubscribe)</a>
```

In Make.com, when you build the HTML for each recipient, set:

- `{{unsubscribe_url}}` =  
  `https://TestRestaurant.ch/api/newsletter-unsubscribe?token` + **current row’s `unsubscribe_token`**

So each email gets a unique, secure unsubscribe link.

**Important:** If you send the campaign without replacing the placeholder (e.g. you use the same HTML for everyone without mapping `unsubscribe_token` from Supabase per recipient), the link will be broken and recipients will see an error. Always use a scenario that **iterates per row** and injects that row’s `unsubscribe_token` into the URL.

---

## 5. Summary

| What | Where |
|------|--------|
| Subscribers list | Supabase table `newsletter_subscribers`, filter `subscribed = true` |
| Who receives the email | Only rows with `subscribed = true` |
| Unsubscribe link | `https://TestRestaurant.ch/api/newsletter-unsubscribe?token=<unsubscribe_token>` (from same row) |
| After they unsubscribe | That row’s `subscribed` is set to `false`; next Make.com run won’t include them |

Existing reservations and the rest of the site are unchanged; only the newsletter list and unsubscribe flow use this.
