import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

export default function Privacy() {
  const { t } = useLanguage();

  const sections = [
    { title: "s1Title", body: "s1Body" },
    { title: "s2Title", body: "s2Body" },
    { title: "s3Title", body: "s3Body" },
    { title: "s4Title", body: "s4Body" },
    { title: "s5Title", body: "s5Body" },
    { title: "s6Title", body: "s6Body" },
    { title: "s7Title", body: "s7Body" },
    { title: "s8Title", body: "s8Body" },
  ] as const;

  return (
    <div className="min-h-screen pt-20">
      <section className="relative min-h-[200px] sm:min-h-[240px] flex items-center justify-center">
        <div
          className="hero-bg absolute inset-0"
          style={{ backgroundImage: "url(/interior_1.jpg)" }}
        >
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative z-10 container text-center text-foreground">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gold-text">
            {t("privacyPage.title")}
          </h1>
          <div className="gold-divider mx-auto" />
          <p className="text-sm text-muted-foreground">{t("privacyPage.lastUpdate")}</p>
        </div>
      </section>

      <section className="section-spacing cream-bg">
        <div className="container max-w-3xl prose prose-invert max-w-none">
          <div className="mb-8">
            <h2 className="text-xl font-semibold gold-text mb-2">{t("privacyPage.contactTitle")}</h2>
            <p className="text-foreground mb-1">{t("privacyPage.contactTeam")}</p>
            <a href="mailto:info@testrestaurant.com" className="gold-text hover:underline font-medium">
              {t("privacyPage.contactEmail")}
            </a>
          </div>
          <p className="text-foreground mb-10 leading-relaxed">{t("privacyPage.intro")}</p>
          <div className="space-y-8">
            {sections.map(({ title, body }) => (
              <div key={title}>
                <h3 className="text-lg font-semibold gold-text mb-2">{t(`privacyPage.${title}`)}</h3>
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                  {t(`privacyPage.${body}`)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-6 border-t border-border">
            <Link href="/" className="gold-text font-medium hover:underline">
              ← {t("nav.home")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
