import { Utensils, Wine, ConciergeBell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function Careers() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-20">
      <section className="relative min-h-[280px] sm:min-h-[320px] md:h-80 lg:h-96 flex items-center justify-center">
        <div
          className="hero-bg absolute inset-0"
          style={{ backgroundImage: "url(/spinella_exterior.jpg)" }}
        >
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative z-10 container text-center text-foreground">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">{t("careers.title")}</h1>
          <div className="gold-divider"></div>
          <p className="text-xl">{t("careers.subtitle")}</p>
        </div>
      </section>

      <section className="section-spacing cream-bg">
        <div className="container max-w-3xl">
          <p className="text-lg text-muted-foreground mb-8 text-center">
            {t("careers.intro")}
          </p>
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            <Card className="border-none shadow-md">
              <CardContent className="pt-6 text-center">
                <Utensils className="w-10 h-10 mx-auto mb-3 text-[oklch(0.62_0.15_85)]" />
                <h3 className="font-bold text-lg">{t("contact.specialtyKitchen")}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6 text-center">
                <Wine className="w-10 h-10 mx-auto mb-3 text-[oklch(0.62_0.15_85)]" />
                <h3 className="font-bold text-lg">{t("contact.specialtyBar")}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6 text-center">
                <ConciergeBell className="w-10 h-10 mx-auto mb-3 text-[oklch(0.62_0.15_85)]" />
                <h3 className="font-bold text-lg">{t("contact.specialtyService")}</h3>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <a href="mailto:info@spinella.ch?subject=Candidature%20Spinella">
              <Button size="lg" className="gold-bg text-black hover:bg-[oklch(0.52_0.15_85)] font-semibold">
                {t("careers.apply")}
              </Button>
            </a>
            <p className="text-sm text-muted-foreground mt-4">
              {t("careers.applyNote")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
