import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Utensils, Wine } from "lucide-react";
import Reviews from "@/components/Reviews";
import { useLanguage } from "@/contexts/LanguageContext";

const HERO_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4";

export default function Home() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const heroRef = useRef<HTMLElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    if (location !== "/") return;
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-10% 0px 0px 0px" }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [location]);

  const isHome = location === "/";

  return (
    <div className="min-h-screen pt-20 md:pt-20">
      {/* Hero: video only (mobile + desktop), no static photo */}
      <section
        ref={heroRef}
        className="relative flex items-center justify-center overflow-hidden min-h-[100dvh] md:min-h-[min(100dvh,calc(100vh-5rem))] aspect-auto md:aspect-[16/10]"
        style={{ minHeight: "min(100dvh, calc(100vh - 5rem))" }}
      >
        <video
          className="absolute inset-0 w-full h-full object-cover z-[1]"
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <div className="hero-overlay absolute inset-0 z-[2]" />
        
        <div className="relative z-10 container text-center text-foreground">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 min-h-[3.5rem] md:min-h-[4.5rem] lg:min-h-[5rem]">
              Welcome to <span className="brand-font gold-text">TestRestaurant</span>
            </h1>
            <p className="text-lg md:text-xl mb-4 font-light max-w-2xl mx-auto">
              {t("home.heroParagraph1")}
            </p>
            <p className="text-base md:text-lg mb-4 font-light max-w-2xl mx-auto">
              {t("home.heroParagraph2")}
            </p>
            <p className="text-xl md:text-2xl gold-text font-medium mb-8">
              {t("home.welcomeHome")}
            </p>
            <div className="gold-divider"></div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/reservations">
                <Button size="lg" className="gold-bg text-black hover:bg-[#1d4ed8] font-semibold text-lg px-8">
                  {t("home.bookYourTable")}
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-2 border-[#2563eb] text-foreground hover:bg-[#2563eb] hover:text-black font-semibold text-lg px-8">
                  {t("home.meetBrothers")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-12 md:py-16 bg-background text-foreground">
        <div className="container max-w-3xl text-center">
          <p className="text-2xl md:text-3xl font-serif gold-text mb-4 italic">
            « {t("home.philosophyQuote")} »
          </p>
          <p className="text-base md:text-lg text-muted-foreground">
            {t("home.philosophySubline")}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing cream-bg">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Best Dining Experience in the City</h2>
            <div className="gold-divider"></div>
            <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-3xl mx-auto">
              TestRestaurant offers an exceptional dining experience with a carefully crafted menu, signature cocktails, and warm hospitality in a modern, welcoming setting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link href="/reservations">
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full hover:ring-2 hover:ring-[#2563eb] hover:ring-offset-2 hover:ring-offset-background">
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 gold-bg rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t("home.easyBooking")}</h3>
                  <p className="text-muted-foreground">
                    {t("home.easyBookingDesc")}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/menu">
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full hover:ring-2 hover:ring-[#2563eb] hover:ring-offset-2 hover:ring-offset-background">
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 gold-bg rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t("home.authenticCuisine")}</h3>
                  <p className="text-muted-foreground">
                    {t("home.authenticCuisineDesc")}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 gold-bg rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wine className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("home.cocktailBar")}</h3>
                <p className="text-muted-foreground">
                  {t("home.cocktailBarDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 gold-bg rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t("home.privateEvents")}</h3>
                <p className="text-muted-foreground">
                  {t("home.privateEventsDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="section-spacing bg-background text-foreground">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{t("home.threeBrothersTitle")}</h2>
              <div className="gold-divider mx-0"></div>
              <p className="text-lg mb-6 leading-relaxed">
                {t("home.threeBrothersDesc1")}
              </p>
              <p className="text-lg mb-8 leading-relaxed">
                {t("home.threeBrothersDesc2")}
              </p>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-2 border-[#2563eb] text-foreground hover:bg-[#2563eb] hover:text-black font-semibold">
                  {t("home.ourStory")}
                </Button>
              </Link>
            </div>
            <div className="relative min-h-[240px] sm:min-h-[280px] lg:min-h-[380px] w-full overflow-hidden rounded-lg aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"
                alt="TestRestaurant team"
                width={800}
                height={600}
                className="w-full h-full object-cover object-center rounded-lg shadow-2xl"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <Reviews />

      {/* Location Preview */}
      <section className="section-spacing cream-bg">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative min-h-[240px] sm:min-h-[280px] lg:min-h-[380px] w-full min-w-0 overflow-hidden rounded-lg aspect-[4/3] bg-muted">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                alt="TestRestaurant dining room"
                width={800}
                height={600}
                className="absolute inset-0 w-full h-full object-cover object-[50%_25%] rounded-lg shadow-2xl"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Lunch & Evening Dining</h2>
              <div className="gold-divider mx-0"></div>
              <p className="text-lg mb-6 leading-relaxed">
                Whether it's a quick lunch, a business dinner, or a relaxed evening out, TestRestaurant offers a warm and welcoming setting for every occasion.
              </p>
              <p className="text-lg mb-8 leading-relaxed">
                Enjoy our carefully crafted menu, signature cocktails, and attentive service — the perfect spot for any time of day.
              </p>
              <Link href="/contact">
                <Button size="lg" className="gold-bg text-black hover:bg-[#1d4ed8] font-semibold">
                  {t("home.getDirections")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky CTA: visible after scrolling past hero, home only. Optimized for mobile touch. */}
      {isHome && showStickyCta && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 bg-background/98 backdrop-blur-sm border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.2)] min-h-[56px] sm:min-h-0 [padding-left:max(0.75rem,env(safe-area-inset-left))] [padding-right:max(0.75rem,env(safe-area-inset-right))] [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]"
          role="banner"
          aria-label={t("home.bookYourTable")}
        >
          <div className="container max-w-lg flex flex-row items-center justify-center gap-2 sm:gap-3 w-full">
            <Link href="/reservations" className="flex-1 sm:flex-initial min-w-0">
              <Button
                size="lg"
                className="w-full min-h-[44px] gold-bg text-black hover:bg-[#1d4ed8] font-semibold text-sm sm:text-base px-4 sm:px-6 py-4 sm:py-5 rounded-lg shadow-md transition-all hover:shadow-lg active:scale-[0.98] touch-manipulation"
              >
                {t("home.bookYourTable")}
              </Button>
            </Link>
            <Link href="/about" className="flex-shrink-0 sm:flex-initial">
              <Button
                size="lg"
                variant="outline"
                className="min-h-[44px] border-2 border-[#2563eb] text-foreground hover:bg-[#2563eb] hover:text-black font-semibold text-sm sm:text-base px-4 sm:px-6 py-4 sm:py-5 rounded-lg touch-manipulation"
              >
                {t("home.meetBrothers")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
