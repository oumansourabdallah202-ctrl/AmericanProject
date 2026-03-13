# Apology — Deposit request email sent by mistake (April 14–20, 2025)

**Date:** [Insert date]  
**Subject (use for campaign):** Our apologies — deposit request email sent in error (Spinella)

---

## 1. Get the list of affected recipients

- **From Spinella admin:** Log in at spinella.ch/admin → section “April 14–20, 2026 – Deposit request emails” → click **“List 2025 mistaken send (CSV)”**. The CSV contains all guests who received the deposit email in error (reservation dates April 14–20, **2025**).
- **From Resend:** Resend dashboard → Emails / Logs → filter by subject “Deposit to confirm your reservation (April 14-20)” and by send date (March 2026). Export or note the recipient list.

**List of affected recipients (paste or attach after downloading the CSV):**

| # | Name | Email | Reservation date (2025) |
|---|------|--------|--------------------------|
| *(Add rows from CSV or Resend export)* | | | |

**Required columns for Make.com:** the CSV from the admin has **Name**, **Email**, and more. For the apology campaign you need at least **Name** and **Email**.

---

## 2. Make.com campaign — apology email (HTML, Spinella theme)

**Ready-to-send HTML template:**  
**`docs/Apology-Deposit-Email-April2025-Campaign.html`**

That file is the apology email in Spinella’s visual style (dark background, gold header, same look as your other emails). It uses **`{{name}}`** in “Dear {{name}},” so Make.com can replace it with each recipient’s name from your Excel/CSV.

### Make.com scenario (steps)

1. **Data source:** Google Sheets or CSV with the mistaken list (columns: **Name**, **Email**; other columns optional).
2. **Iterator:** One iteration per row (per recipient).
3. **Email module (Gmail / SMTP / Resend / etc.):**
   - **To:** `{{email}}` (from current row).
   - **Subject:** `Our apologies — deposit request email sent in error (Spinella)`
   - **Body:** Paste the full HTML from **Apology-Deposit-Email-April2025-Campaign.html**. In the body, map **`{{name}}`** to the current row’s **Name** (e.g. in Make.com: replace `{{name}}` with the “Name” field from the sheet/CSV). If a row has no name, use “Valued guest”.
4. **Run** the scenario once to send the apology to everyone on the list.

**Sender:** Use the same “from” address as Spinella (e.g. **info@spinella.ch**) in your Make.com email connection so replies go to the restaurant.

---

## 3. Plain-text version (for reference)

**To:** All guests who received the deposit request email in error  

**Subject:** Our apologies — deposit request email sent in error (Spinella)

---

Dear [Guest name / Valued guest],

We are writing to apologise for the email you recently received regarding a deposit for a reservation on **April 14–20**, which referred to a request for payment.

**What happened**  
Due to a **technical error** in our reservation system, that deposit request was sent to a number of guests for whom it was **not intended**. The message was meant only for guests with reservations for the **April 14–20, 2026** period. Because of a configuration mistake, it was also sent to some of our guests who had dined with us in **April 2025**. You received it as a result of that error.

**What we want you to know**  
- You are **not** required to take any action or to pay any deposit in relation to that email.  
- We are sorry for the confusion and any concern it may have caused.  
- We have corrected the system so that this cannot happen again.  
- We are very grateful for your past visit and hope we had the pleasure of welcoming you at Spinella. We would be delighted to see you again whenever you wish to reserve.

If you have any questions or would like to speak with us, please do not hesitate to contact us at **info@spinella.ch** or **+41 22 734 58 98**.

Thank you for your understanding.

Sincerely,  
**The Spinella Team**  
Restaurant & Bar · Geneva  
[spinella.ch](https://spinella.ch)

---

## Short version (e.g. for quick replies to individuals)

You can use this for a brief reply to someone who has already written to you (e.g. after a reply like “Not sure why you’ve emailed me about a reservation made a year ago?”):

---

We are very sorry for the confusion. The deposit request email was sent by mistake due to a technical error in our system—it was intended only for guests with reservations in **April 2026**, and was incorrectly sent to some of our 2025 guests. You do not need to do anything, and we apologise for any inconvenience. We are glad you had a good time when you visited and hope to welcome you again. Thank you for your understanding.  
— The Spinella Team

---

*This document is for internal use and for sending the apology to affected guests. Update the “List of affected recipients” section. Use the HTML file (section 2) for the Make.com campaign; update the table above after downloading the CSV from the admin or Resend.*
