/**
 * Branded email for April 14–20 deposit request (same look as confirmation/newsletter).
 */

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function depositRequestEmailHtml(data: {
  name: string;
  date: string;
  time: string;
  partySize: number;
  amountChf: number;
  iban: string;
}): string {
  const displayDate = formatDate(data.date);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservation – Deposit required · Spinella Geneva</title>
</head>
<body style="margin:0; padding:0; background-color:#0c0c0c; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0c0c0c;">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#111111; border: 1px solid #2a2520;">
          <tr>
            <td style="height: 3px; background: linear-gradient(90deg, transparent, #c9a227 20%, #e8d48b 50%, #c9a227 80%, transparent);"></td>
          </tr>
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <p style="margin:0 0 8px 0; font-size: 11px; letter-spacing: 4px; color: #8a7a5c; text-transform: uppercase;">Restaurant & Bar</p>
              <h1 style="margin:0; font-size: 42px; font-weight: 700; letter-spacing: 6px; color: #d4af37;">SPINELLA</h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; letter-spacing: 3px; color: #b8a574;">GENEVA</p>
              <table role="presentation" width="120" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top: 24px;">
                <tr><td style="height: 1px; background: linear-gradient(90deg, transparent, #c9a227, transparent);"></td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin:0; font-size: 18px; line-height: 1.7; color: #e8e4dc;">Dear ${data.name},</p>
              <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.7; color: #c4bfb5;">
                Thank you for your interest in Spinella and for your reservation request for our special period of <strong style="color:#e8e4dc;">14–20 April 2026</strong>.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 1.7; color: #c4bfb5;">
                To confirm and secure your table for these dates, we ask for a deposit of <strong style="color:#d4af37;">CHF ${data.amountChf}</strong> per reservation.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(180deg, #1a1814 0%, #151310 100%); border: 1px solid #2a2520;">
                <tr>
                  <td style="padding: 28px 32px;">
                    <p style="margin: 0 0 20px 0; font-size: 11px; letter-spacing: 3px; color: #d4af37; text-transform: uppercase;">Your reservation</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #2a2520;"><span style="font-size: 14px; color: #8a7a5c;">Date</span></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #2a2520; text-align: right;"><span style="font-size: 15px; color: #e8e4dc;">${displayDate}</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #2a2520;"><span style="font-size: 14px; color: #8a7a5c;">Time</span></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #2a2520; text-align: right;"><span style="font-size: 15px; color: #e8e4dc;">${data.time}</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #2a2520;"><span style="font-size: 14px; color: #8a7a5c;">Guests</span></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #2a2520; text-align: right;"><span style="font-size: 15px; color: #e8e4dc;">${data.partySize}</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0 0 0; border-top: 1px solid #2a2520;"><span style="font-size: 14px; color: #8a7a5c;">Deposit due</span></td>
                        <td style="padding: 16px 0 0 0; border-top: 1px solid #2a2520; text-align: right;"><span style="font-size: 15px; color: #d4af37;">CHF ${data.amountChf}</span></td>
                      </tr>
                    </table>
                    <p style="margin: 20px 0 0 0; font-size: 14px; color: #8a7a5c;">Please transfer the amount to:</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; font-family: monospace; color: #e8e4dc; letter-spacing: 1px;">${data.iban}</p>
                    <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #c4bfb5;">Once we have received your payment, we will confirm your reservation by email. If you have any questions, please contact us at <a href="mailto:info@spinella.ch" style="color:#d4af37;">info@spinella.ch</a> or <a href="tel:+41227345898" style="color:#d4af37;">+41 22 734 58 98</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #c4bfb5;">We look forward to welcoming you.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align: center; font-size: 13px; color: #8a7a5c;">
              Rue Liotard 4, 1202 Genève · <a href="https://spinella.ch" style="color:#d4af37; text-decoration:none;">spinella.ch</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Deposit rules for April 14–20, 2026 (reservation dates): 3–7 guests = 100 CHF, 8+ = 200 CHF. */
export const DEPOSIT_APRIL_14_20 = {
  start: "2026-04-14",
  end: "2026-04-20",
  amountSmall: 100,   // 3–7 guests
  amountLarge: 200,  // 8+
  iban: "CH08 0078 8000 0507 3206 8",
} as const;

export function getDepositAmount(partySize: number): number {
  if (partySize >= 8) return DEPOSIT_APRIL_14_20.amountLarge;
  return DEPOSIT_APRIL_14_20.amountSmall;
}
