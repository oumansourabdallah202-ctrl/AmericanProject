/**
 * SEO config: base URL and per-route title + meta description.
 * Descriptions kept to ~150–165 chars for search snippets.
 */
export const SEO_BASE_URL = "https://www.TestRestaurant.ch";

export type RouteMeta = {
  title: string;
  description: string;
  keywords?: string;
};

export const routeMeta: Record<string, RouteMeta> = {
  "/": {
    title: "TestRestaurant - Cocktails & Wine Bar - Tapas & Restaurant | Genève",
    description:
      "Découvrez TestRestaurant à Genève : un mélange unique de cuisine italienne traditionnelle, tapas gourmandes et cocktails artisanaux. Réservez votre table dès maintenant !",
    keywords:
      "Restaurant italien Geneve, Cocktail Bar Geneve, Bar a vin Geneve, Cuisine sicilienne authentique, Trattoria italienne Geneve, Restaurant italien Cornavin, Restaurant proche gare Cornavin, Restaurant Geneve centre, Bar a cocktails Cornavin, Restaurant italien proche du lac Geneve, Pinsa romana Geneve, Meilleure pinsa Geneve, Pates fraiches maison, Tagliolini a la truffe, Lasagne italienne, Antipasti italiens, Burrata des Pouilles, Arancini sicilien, Cannolo sicilien, Tiramisu maison, Menu de midi Geneve, Dejeuner italien Cornavin, Plat du jour Geneve centre, Aperitivo italien Geneve, Afterwork Geneve Cornavin, Planche de charcuterie italienne",
  },
  "/menu": {
    title: "Menu Italien | Pinsa, Pates fraiches & Antipasti | TestRestaurant Geneve",
    description:
      "Pinsa romana Geneve, pates fraiches maison, tagliolini a la truffe, antipasti italiens, burrata des Pouilles, cannolo sicilien et tiramisu maison.",
    keywords:
      "Pinsa romana Geneve, Meilleure pinsa Geneve, Pates fraiches maison, Tagliolini a la truffe, Lasagne italienne, Antipasti italiens, Burrata des Pouilles, Arancini sicilien, Cannolo sicilien, Tiramisu maison",
  },
  "/gallery": {
    title: "Gallery | TestRestaurant Restaurant & Bar Geneva",
    description:
      "Experience the ambiance of TestRestaurant. Interior, terrace, and the warmth of Geneva's top-ranked Sicilian restaurant.",
  },
  "/events": {
    title: "Private Events & Celebrations | TestRestaurant Geneva",
    description:
      "Host your event at TestRestaurant: birthdays, corporate dinners, cocktail parties. Custom menus for 20–50 guests in Geneva.",
  },
  "/about": {
    title: "Our Story | Our Team | TestRestaurant Geneva",
    description:
      "Meet the passionate team behind TestRestaurant. Discover the story and people who make every dining experience exceptional.",
  },
  "/faq": {
    title: "FAQ | TestRestaurant Restaurant & Bar Geneva",
    description:
      "Frequently asked questions: reservations, opening hours, dietary options, parking, and more. We're here to help.",
  },
  "/contact": {
    title: "Contact | Restaurant proche gare Cornavin | TestRestaurant Geneve",
    description:
      "Situe a deux pas de la gare Cornavin et du centre de Geneve. Horaires, telephone, email et itineraire pour TestRestaurant.",
  },
  "/reservations": {
    title: "Reservation | Restaurant Italien Geneve Cornavin | TestRestaurant",
    description:
      "Reserve votre table chez TestRestaurant: restaurant italien Geneve centre, cuisine sicilienne authentique, cocktails et vins a Cornavin.",
  },
};

export function getMetaForPath(path: string): RouteMeta | undefined {
  const normalized = path === "" ? "/" : path.replace(/\/$/, "") || "/";
  return routeMeta[normalized];
}
