# Deposit & Stripe – Spec (shadow site first)

This doc captures the requirements for **deposits**, **Stripe**, and **cancellation policy**. Build and test on a **shadow / test site**, not on live spinella.ch, until everything is validated with test cards (Spinella’s or Ali’s).

---

## 1. Deposit rules

- **Tables of 8 or more:** deposit of **10 CHF per person** (e.g. 8 guests = 80 CHF).
- **Any table with a “real” special request** (birthday, cake, private event, anything that requires extra work from the restaurant): same **10 CHF per person** deposit.
- **Dietary / allergies only:** no deposit. Allergies and dietary requirements are collected separately and do not count as a special request (see booking form: “Dietary” vs “Special requests”).

So:
- **Deposit required:** party size ≥ 8 **or** special request (event/celebration/extra service).
- **No deposit:** smaller tables with only dietary/allergy information.

---

## 2. Cancellation policy (to implement with Stripe)

- **Notice:** Guests must **cancel or notify the restaurant at least 48 hours (2 days) before** the reservation.
- **If they cancel / notify in time:** deposit is **refunded** to the same payment method (card etc.) used to pay.
- **If they do not notify within that timeframe:** they **lose the deposit** (no refund). The clause/agreement must state this clearly at the time of payment.

Refunds can be done **manually** in Stripe at first, or **automatically** via the back end (see below).

---

## 3. Booking flow (target)

1. Guest fills the form (including dietary/allergies and, if applicable, special request for event).
2. For **request-only** bookings (8+ or with special request): after manual **Accept** in admin, the system asks for the **deposit** (Stripe Checkout or similar).
3. Guest pays the deposit; they must **accept the cancellation terms** (48h notice, refund if cancelled in time, loss of deposit otherwise).
4. Confirmation email is sent (with booking details). **No cancel button in the email for now** – cancellations stay manual (phone/email) until the automated cancel + refund flow is in place.

---

## 4. Cancel button (later, not now)

- **Now:** Do **not** add a “Cancel reservation” button in the confirmation email. Keep manual cancellations (phone/email to the restaurant).
- **Later (when Stripe is wired):** Add a link in the email that:
  - Opens a page where the guest can cancel.
  - Back end checks: **Is the reservation more than 48 hours away?**
    - **Yes:** Cancel the booking and **refund the deposit** (via Stripe API) to the original payment method.
    - **No:** Show a message: “Cancellation is not possible within 48 hours of your reservation. Your deposit is non-refundable as per the terms you accepted.” (No refund.)

This needs to be **tied to the calendar and to Stripe** (booking id, payment intent or similar) so the system can trigger the refund automatically when the guest cancels in time.

---

## 5. Stripe integration (summary)

- **Stripe account:** Spinella (or Ali) creates or uses an existing Stripe account.
- **Use Stripe for:** collecting the deposit (10 CHF × number of guests) when a deposit is required.
- **Where it plugs in:** Admin (spinella.ch/admin) and the booking flow: after Accept for a request-only booking that requires a deposit, send the guest a **payment link** (Stripe Checkout) for the deposit; once paid, confirm the reservation and send the confirmation email.
- **Refunds:** Either manually in Stripe Dashboard or automatically via API when the guest cancels with ≥ 48h notice (when the cancel flow is built).
- **Testing:** All of this must be tested on a **shadow site** with test cards (no live charges) before going live.

---

## 6. Checklist (shadow site)

- [ ] Stripe account (test mode) connected.
- [ ] Booking form: dietary/allergies separate from special requests; special requests = events only.
- [ ] Admin: after Accept, for 8+ or special-request bookings, trigger deposit (e.g. send payment link or redirect to Stripe Checkout).
- [ ] Payment page or email: clear **agreement / clause** (48h cancellation, refund if notified in time, loss of deposit otherwise).
- [ ] After successful payment: confirm reservation and send confirmation email (no cancel button for now).
- [ ] Manual refunds in Stripe when guest cancels by phone/email with ≥ 48h notice.
- [ ] (Later) Cancel button in email + automatic refund when ≥ 48h before reservation.

---

## 7. No cancel button for now

Per the brief: **do not add a cancel button** in the confirmation email for the moment. Keep manual cancellations while the deposit system is introduced. The cancel button with automatic refund can be added once Stripe and the 48h rule are fully integrated and tested on the shadow site.
