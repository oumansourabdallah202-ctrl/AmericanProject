import type { Language } from "@/lib/translations";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const currentLangEntry = LANGUAGES.find((l) => l.code === language);
  const currentLanguageLabel = currentLangEntry?.label ?? language.toUpperCase();

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/menu", label: t("nav.menu") },
    { href: "/gallery", label: t("nav.gallery") },
    { href: "/events", label: t("nav.events") },
    { href: "/about", label: t("nav.about") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background text-foreground shadow-lg">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img
                src="/logo.png"
                alt="Spinella"
                width={120}
                height={48}
                className="h-10 w-auto md:h-12"
              />
              <span className="brand-font text-xl font-bold gold-text hidden sm:inline">SPINELLA</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    isActive(item.href)
                      ? "gold-text"
                      : "text-foreground hover:text-[oklch(0.62_0.15_85)]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 text-sm font-medium hover:text-[oklch(0.62_0.15_85)] transition-colors"
                  aria-label={`${t("nav.language")}: ${currentLanguageLabel}`}
                >
                  <Languages size={18} />
                  <span className="font-semibold">{currentLanguageLabel}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGES.map(({ code, label }) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => setLanguage(code)}
                    className="cursor-pointer"
                  >
                    {language === code ? <Check className="w-4 h-4" /> : <span className="w-4" />}
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/reservations">
              <Button className="gold-bg text-black hover:bg-[oklch(0.52_0.15_85)] font-semibold">
                {t("nav.bookTable")}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-6 pt-2">
            <div className="flex flex-col">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`block py-3 text-sm font-medium transition-colors cursor-pointer border-b border-border/50 ${
                      isActive(item.href)
                        ? "gold-text"
                        : "text-foreground hover:text-[oklch(0.62_0.15_85)]"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
              <div className="py-3 border-b border-border/50">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                  <Languages size={18} />
                  {t("nav.language")}
                </div>
                <p className="text-xs text-muted-foreground mb-2" aria-live="polite">
                  {t("nav.currentLanguage")}: <span className="font-semibold text-foreground">{currentLanguageLabel}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(({ code, label }) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code);
                        setIsOpen(false);
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                        language === code
                          ? "gold-bg text-black"
                          : "bg-muted/50 text-foreground hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <Link href="/reservations" className="mt-4">
                <Button
                  className="gold-bg text-black hover:bg-[oklch(0.52_0.15_85)] font-semibold w-full min-h-[44px]"
                  onClick={() => setIsOpen(false)}
                >
                  {t("nav.bookTable")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
