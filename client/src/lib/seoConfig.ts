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
    title: "TestRestaurant - Restaurant & Bar | Fine Dining",
    description:
      "Discover TestRestaurant: a unique blend of creative cuisine, gourmet dishes and handcrafted cocktails. Book your table now!",
    keywords:
      "Restaurant italien Geneve, Cocktail Bar Geneve, Bar a vin Geneve, Cuisine sicilienne authentique, Trattoria italienne Geneve, Restaurant italien Cornavin, Restaurant proche gare Cornavin, Restaurant Geneve centre, Bar a cocktails Cornavin, Restaurant italien proche du lac Geneve, Pinsa romana Geneve, Meilleure pinsa Geneve, Pates fraiches maison, Tagliolini a la truffe, Lasagne italienne, Antipasti italiens, Burrata des Pouilles, Arancini sicilien, Cannolo sicilien, Tiramisu maison, Menu de midi Geneve, Dejeuner italien Cornavin, Plat du jour Geneve centre, Aperitivo italien Geneve, Afterwork Geneve Cornavin, Planche de charcuterie italienne",
  },
  "/menu": {
    title: "Our Menu | Creative Dishes & Cocktails | TestRestaurant",
    description:
      "Pinsa romana Geneve, pates fraiches maison, tagliolini a la truffe, antipasti italiens, burrata des Pouilles, cannolo sicilien et tiramisu maison.",
    keywords:
      "Pinsa romana Geneve, Meilleure pinsa Geneve, Pates fraiches maison, Tagliolini a la truffe, Lasagne italienne, Antipasti italiens, Burrata des Pouilles, Arancini sicilien, Cannolo sicilien, Tiramisu maison",
  },
  "/gallery": {
    title: "Gallery | TestRestaurant Restaurant & Bar",
    description:
      "Experience the ambiance of TestRestaurant. Discover our interior, terrace, and the warmth of our team.",
  },
  "/events": {
    title: "Private Events & Celebrations | TestRestaurant",
    description:
      "Host your event at TestRestaurant: birthdays, corporate dinners, cocktail parties. Custom menus for 20–50 guests.",
  },
  "/about": {
    title: "Our Story | Our Team | TestRestaurant Geneva",
    description:
      "Meet the passionate team behind TestRestaurant. Discover the story and people who make every dining experience exceptional.",
  },
  "/faq": {
    title: "FAQ | TestRestaurant Restaurant & Bar",
    description:
      "Frequently asked questions: reservations, opening hours, dietary options, parking, and more. We're here to help.",
  },
  "/contact": {
    title: "Contact | TestRestaurant Restaurant & Bar",
    description:
      "Find us easily in the city center. Opening hours, phone, email and directions to TestRestaurant.",
  },
  "/reservations": {
    title: "Reservation | TestRestaurant Restaurant & Bar",
    description:
      "Book your table at TestRestaurant: creative cuisine, handcrafted cocktails and fine wines.",
  },
};

export function getMetaForPath(path: string): RouteMeta | undefined {
  const normalized = path === "" ? "/" : path.replace(/\/$/, "") || "/";
  return routeMeta[normalized];
}
