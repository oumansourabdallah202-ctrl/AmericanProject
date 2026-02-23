# Lier it.spinella.ch et en.spinella.ch (Vercel)

Vos CNAME sont déjà configurés (it.spinella.ch et en.spinella.ch → spinella.ch). Pour que Vercel serve le site sur ces domaines et que le 404 disparaisse :

## 1. Ajouter les domaines dans Vercel

1. Ouvrez le [tableau de bord Vercel](https://vercel.com) et le projet **Spinella** (celui déployé en spinella.ch).
2. Allez dans **Settings** → **Domains**.
3. Cliquez sur **Add** et ajoutez :
   - `it.spinella.ch`
   - `en.spinella.ch`
4. Pour chaque domaine, laissez Vercel proposer la config (souvent déjà OK si les CNAME pointent vers spinella.ch ou vers la cible indiquée par Vercel).
5. Attendez que le statut soit **Valid** (propagation DNS, parfois quelques minutes).

## 2. Vérifier le déploiement

- L’erreur **404 DEPLOYMENT_NOT_FOUND** peut aussi signifier qu’aucun déploiement de production n’existe. Vérifiez qu’un déploiement est bien **Production** (onglet **Deployments**).
- Les domaines doivent être assignés au même projet que spinella.ch.

## 3. Comportement de l’app

Une fois les domaines ajoutés et valides :

- **it.spinella.ch** → le site s’ouvre en **italien** par défaut.
- **en.spinella.ch** → le site s’ouvre en **anglais** par défaut.
- **spinella.ch** (et www) → langue selon le choix utilisateur ou français par défaut.

La détection se fait au chargement selon le sous-domaine (voir `client/src/contexts/LanguageContext.tsx`).
