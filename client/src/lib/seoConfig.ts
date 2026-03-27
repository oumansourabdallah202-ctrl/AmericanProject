/**
 * SEO config: base URL and per-route title + meta description.
 * Descriptions kept to ~150–165 chars for search snippets.
 */
export const SEO_BASE_URL = "https://www.spinella.ch";

export type RouteMeta = {
  title: string;
  description: string;
  keywords?: string;
};

export const routeMeta: Record<string, RouteMeta> = {
  "/": {
    title: "Spinella - Cocktails & Wine Bar - Tapas & Restaurant | Genève",
    description:
      "Découvrez Spinella à Genève : un mélange unique de cuisine italienne traditionnelle, tapas gourmandes et cocktails artisanaux. Réservez votre table dès maintenant !",
    keywords:
      "Restaurant italien Geneve, Cocktail Bar Geneve, Bar a vin Geneve, Cuisine sicilienne authentique, Trattoria italienne Geneve, Restaurant italien Cornavin, Restaurant proche gare Cornavin, Restaurant Geneve centre, Bar a cocktails Cornavin, Restaurant italien proche du lac Geneve, Pinsa romana Geneve, Meilleure pinsa Geneve, Pates fraiches maison, Tagliolini a la truffe, Lasagne italienne, Antipasti italiens, Burrata des Pouilles, Arancini sicilien, Cannolo sicilien, Tiramisu maison, Menu de midi Geneve, Dejeuner italien Cornavin, Plat du jour Geneve centre, Aperitivo italien Geneve, Afterwork Geneve Cornavin, Planche de charcuterie italienne",
  },
  "/menu": {
    title: "Menu Italien | Pinsa, Pates fraiches & Antipasti | Spinella Geneve",
    description:
      "Pinsa romana Geneve, pates fraiches maison, tagliolini a la truffe, antipasti italiens, burrata des Pouilles, cannolo sicilien et tiramisu maison.",
    keywords:
      "Pinsa romana Geneve, Meilleure pinsa Geneve, Pates fraiches maison, Tagliolini a la truffe, Lasagne italienne, Antipasti italiens, Burrata des Pouilles, Arancini sicilien, Cannolo sicilien, Tiramisu maison",
  },
  "/gallery": {
    title: "Gallery | Spinella Restaurant & Bar Geneva",
    description:
      "Experience the ambiance of Spinella. Interior, terrace, and the warmth of Geneva's top-ranked Sicilian restaurant.",
  },
  "/events": {
    title: "Private Events & Celebrations | Spinella Geneva",
    description:
      "Host your event at Spinella: birthdays, corporate dinners, cocktail parties. Custom menus for 20–50 guests in Geneva.",
  },
  "/about": {
    title: "Our Story | The Three Brothers | Spinella Geneva",
    description:
      "Salvatore, Marco, and Gabriele: three Sicilian brothers bringing authentic soul to Geneva. Discover the story behind Spinella.",
  },
  "/faq": {
    title: "FAQ | Spinella Restaurant & Bar Geneva",
    description:
      "Frequently asked questions: reservations, opening hours, dietary options, parking, and more. We're here to help.",
  },
  "/contact": {
    title: "Contact | Restaurant proche gare Cornavin | Spinella Geneve",
    description:
      "Situe a deux pas de la gare Cornavin et du centre de Geneve. Horaires, telephone, email et itineraire pour Spinella.",
  },
  "/reservations": {
    title: "Reservation | Restaurant Italien Geneve Cornavin | Spinella",
    description:
      "Reserve votre table chez Spinella: restaurant italien Geneve centre, cuisine sicilienne authentique, cocktails et vins a Cornavin.",
  },
};

export function getMetaForPath(path: string): RouteMeta | undefined {
  const normalized = path === "" ? "/" : path.replace(/\/$/, "") || "/";
  return routeMeta[normalized];
}
