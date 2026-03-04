import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

/**
 * Newsletter unsubscribe. If URL has ?token= or ?email=, redirect to API which performs unsubscribe and returns HTML.
 * Otherwise show a short message with link to contact.
 */
export default function Unsubscribe() {
  const { t } = useLanguage();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token")?.trim();
    const email = params.get("email")?.trim();
    if (token || email) {
      const q = token ? `token=${encodeURIComponent(token)}` : `email=${encodeURIComponent(email!)}`;
      window.location.replace(`${window.location.origin}/api/newsletter-unsubscribe?${q}`);
      setHandled(true);
      return;
    }
    setHandled(true);
  }, []);

  if (!handled) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("unsubscribe.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <section className="section-spacing cream-bg">
        <div className="container max-w-xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4 gold-text">{t("unsubscribe.title")}</h1>
          <p className="text-muted-foreground mb-6">{t("unsubscribe.noLink")}</p>
          <p className="text-sm text-muted-foreground mb-8">{t("unsubscribe.contact")}</p>
          <Link href="/contact">
            <a className="gold-text font-medium hover:underline">{t("unsubscribe.contactLink")}</a>
          </Link>
        </div>
      </section>
    </div>
  );
}
