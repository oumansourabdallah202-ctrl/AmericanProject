import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/** Language: user's saved choice wins; subdomain is fallback for first visit. */
function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "fr";
  const saved = localStorage.getItem("language");
  if (saved && ["en", "fr", "it", "de", "es"].includes(saved)) {
    return saved as Language;
  }
  const host = window.location.hostname.toLowerCase();
  if (host === "fr.testrestaurant.com") return "fr";
  if (host === "en.testrestaurant.com") return "en";
  if (host === "it.testrestaurant.com") return "it";
  if (host === "de.testrestaurant.com") return "de";
  if (host === "es.testrestaurant.com") return "es";
  return "fr";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem("language", language);
    const langAttr = language === "fr" ? "fr" : language === "it" ? "it" : language === "de" ? "de" : language === "es" ? "es" : "en";
    document.documentElement.lang = langAttr;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    if (value == null && language !== "en") {
      let fallback: any = translations.en;
      for (const k of keys) {
        fallback = fallback?.[k];
      }
      if (fallback != null) value = fallback;
    }
    return value ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
