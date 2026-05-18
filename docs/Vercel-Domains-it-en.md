# Lier les sous-domaines de langue (Vercel)

Pour que Vercel serve le site sur les sous-domaines de langue (fr, en, it, de, es), ajoutez les domaines dans le projet.

## 1. Ajouter les domaines dans Vercel

1. Ouvrez le [tableau de bord Vercel](https://vercel.com) et le projet **TestRestaurant** (celui déployé en TestRestaurant.ch).
2. Allez dans **Settings** → **Domains**.
3. Cliquez sur **Add** et ajoutez (selon vos CNAME déjà configurés) :
   - `fr.TestRestaurant.ch`
   - `en.TestRestaurant.ch`
   - `it.TestRestaurant.ch`
   - `de.TestRestaurant.ch`
   - `es.TestRestaurant.ch`
4. Pour chaque domaine, laissez Vercel proposer la config (souvent déjà OK si les CNAME pointent vers TestRestaurant.ch ou vers la cible indiquée par Vercel).
5. Attendez que le statut soit **Valid** (propagation DNS, parfois quelques minutes).

## 2. Vérifier le déploiement

- L’erreur **404 DEPLOYMENT_NOT_FOUND** peut aussi signifier qu’aucun déploiement de production n’existe. Vérifiez qu’un déploiement est bien **Production** (onglet **Deployments**).
- Les domaines doivent être assignés au même projet que TestRestaurant.ch.

## 3. Comportement de l’app

Une fois les domaines ajoutés et valides :

- **fr.TestRestaurant.ch** → français
- **en.TestRestaurant.ch** → anglais
- **it.TestRestaurant.ch** → italien
- **de.TestRestaurant.ch** → allemand
- **es.TestRestaurant.ch** → espagnol
- **TestRestaurant.ch** (et www) → langue selon le choix utilisateur ou français par défaut.

La détection se fait au chargement : le choix utilisateur (localStorage) prime sur le sous-domaine. Si l'utilisateur a déjà sélectionné une langue via le menu, elle est conservée. Sinon, le sous-domaine détermine la langue par défaut (voir `client/src/contexts/LanguageContext.tsx`).
