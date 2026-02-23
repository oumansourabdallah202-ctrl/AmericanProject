# Sitelinks « 404 », « Menu », « Salvatore » (Google)

La section « Galerie » avec les liens **404**, **Menu** et **Salvatore** dans les résultats de recherche vient des **sitelinks** générés par Google, pas d’une liste codée sur le site.

## Ce qui a été fait

- **Page 404** : la page d’erreur a maintenant `<meta name="robots" content="noindex, follow">`. Google ne doit plus l’indexer et pourra à terme ne plus la proposer comme sitelink.

## Si « Menu » et « Salvatore » doivent disparaître

On ne peut pas les retirer par le code : Google choisit les sitelinks. Vous pouvez :

1. **Google Search Console**  
   - Aller sur [search.google.com/search-console](https://search.google.com/search-console).  
   - Sélectionner la propriété **www.spinella.ch**.  
   - Utiliser **Suppression d’URL** (temporaire) pour les URLs concernées si besoin.  
   - Les sitelinks se mettent à jour au fil des prochains crawl/indexations.

2. **Laisser le temps**  
   Après la mise en ligne du noindex sur la 404, attendre quelques semaines : Google met à jour les sitelinks tout seul.

3. **Ne pas créer de liens vers la 404**  
   Aucun lien interne ne pointe vers `/404` ; le sitemap ne contient pas cette URL.
