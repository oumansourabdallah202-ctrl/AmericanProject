/**
 * Public API: unsubscribe from the newsletter via link in email.
 * GET /api/newsletter-unsubscribe?token=UUID or ?email=EMAIL
 * Sets subscribed = false in Supabase. Used by Make.com (put token in {{unsubscribe_url}}).
 */

import { getSupabase, NEWSLETTER_TABLE } from "./_lib/supabase.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Res = {
  status: (code: number) => { send: (body: string) => void; json: (body: object) => void };
  setHeader?: (name: string, value: string) => void;
};

function htmlPage(title: string, body: string, success: boolean): string {
  const color = success ? "#8a7a5c" : "#c4a574";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0c0c0c;font-family:Georgia,serif;color:#e8e4dc;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0c;">
  <tr><td align="center" style="padding:48px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:100%;background:#111;border:1px solid #2a2520;">
      <tr><td style="padding:32px 24px;text-align:center;">
        <p style="margin:0;font-size:11px;letter-spacing:4px;color:#8a7a5c;">Restaurant &amp; Bar</p>
        <h1 style="margin:8px 0 0;font-size:28px;letter-spacing:4px;color:#d4af37;">SPINELLA</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#b8a574;">GENEVA</p>
      </td></tr>
      <tr><td style="padding:0 24px 24px;text-align:center;">
        <p style="margin:0 0 16px;font-size:18px;color:${color};">${body}</p>
        <p style="margin:0;font-size:14px;"><a href="https://spinella.ch" style="color:#d4af37;text-decoration:none;">spinella.ch</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export default async function handler(
  req: { method?: string; url?: string; query?: Record<string, string | string[] | undefined> },
  res: Res
): Promise<void> {
  res.setHeader?.("Content-Type", "text/html; charset=utf-8");

  if (req.method !== "GET") {
    res.status(405).send(htmlPage("Erreur", "Méthode non autorisée.", false));
    return;
  }

  let token: string | null = null;
  let email: string | null = null;
  if (req.query?.token) {
    token = typeof req.query.token === "string" ? req.query.token.trim() : String(req.query.token[0]).trim();
  }
  if (req.query?.email) {
    email = typeof req.query.email === "string" ? req.query.email.trim() : String(req.query.email[0]).trim();
  }
  if (!token && !email && req.url) {
    const params = new URL(req.url, "https://spinella.ch").searchParams;
    token = params.get("token")?.trim() || null;
    email = params.get("email")?.trim() || null;
  }

  // Reject empty token or literal placeholder (campaign sent without personalizing the link)
  const isPlaceholder = !token || token === "{{unsubscribe_token}}" || /^\{\{.*\}\}$/.test(token);
  if (!token && !email) {
    res.status(400).send(
      htmlPage(
        "Lien invalide",
        "Lien de désabonnement invalide. Utilisez le lien reçu par e-mail ou contactez-nous à info@spinella.ch.",
        false
      )
    );
    return;
  }
  if (token && isPlaceholder) {
    res.status(400).send(
      htmlPage(
        "Lien non personnalisé",
        "Ce lien de désabonnement n'a pas été personnalisé pour votre adresse (l'e-mail a été envoyé sans remplacer le lien par votre identifiant). Pour vous désabonner : écrivez-nous à <a href=\"mailto:info@spinella.ch?subject=Désabonnement%20newsletter\" style=\"color:#d4af37;\">info@spinella.ch</a> avec l'objet « Désabonnement newsletter » et votre adresse e-mail.",
        false
      )
    );
    return;
  }

  if (email && !EMAIL_REGEX.test(email)) {
    res.status(400).send(htmlPage("Lien invalide", "Adresse e-mail invalide.", false));
    return;
  }

  try {
    const supabase = getSupabase();

    if (token) {
      const { data: row, error: fetchErr } = await supabase
        .from(NEWSLETTER_TABLE)
        .select("email")
        .eq("unsubscribe_token", token)
        .single();

      if (fetchErr || !row?.email) {
        res.status(404).send(
          htmlPage(
            "Désabonnement",
            "Ce lien n'est plus valide ou a déjà été utilisé. Vous êtes peut-être déjà désabonné(e).",
            false
          )
        );
        return;
      }

      const { error: updateErr } = await supabase
        .from(NEWSLETTER_TABLE)
        .update({ subscribed: false })
        .eq("unsubscribe_token", token);

      if (updateErr) {
        console.error("[Newsletter] Unsubscribe by token failed:", updateErr);
        res.status(500).send(
          htmlPage("Erreur", "Une erreur s'est produite. Réessayez plus tard ou contactez info@spinella.ch.", false)
        );
        return;
      }
    } else {
      const { error: updateErr } = await supabase
        .from(NEWSLETTER_TABLE)
        .update({ subscribed: false })
        .eq("email", email);

      if (updateErr) {
        console.error("[Newsletter] Unsubscribe by email failed:", updateErr);
        res.status(500).send(
          htmlPage("Erreur", "Une erreur s'est produite. Réessayez plus tard ou contactez info@spinella.ch.", false)
        );
        return;
      }
    }

    res.status(200).send(
      htmlPage(
        "Désabonnement confirmé",
        "Vous êtes désabonné(e) de notre newsletter. Vous ne recevrez plus nos e-mails. À bientôt chez Spinella !",
        true
      )
    );
  } catch (e) {
    console.error("[Newsletter] Unsubscribe error:", e);
    res.status(500).send(
      htmlPage("Erreur", "Une erreur s'est produite. Réessayez plus tard ou contactez info@spinella.ch.", false)
    );
  }
}
