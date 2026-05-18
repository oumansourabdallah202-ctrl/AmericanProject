# Réservations : source de vérité unique (Wix vs nouvelle interface)

## Pourquoi des réservations peuvent apparaître sur Wix et pas sur TestRestaurant.ch

| Cause | Action |
|-------|--------|
| **Formulaire Wix encore actif** | Les clients réservent encore via l’ancien site Wix. Les résas vont dans la base Wix, pas dans Supabase. | **Désactiver** le formulaire de réservation sur Wix (ou le remplacer par un lien vers TestRestaurant.ch/reservations). |
| **Réservations par téléphone / email** | Le staff enregistre des résas en direct ou par email sans les saisir dans l’admin. | Saisir **toutes** les résas (téléphone, email, walk-in) dans l’admin TestRestaurant.ch (ou via import CSV). Pas de carnet séparé. |
| **Anciennes résas Wix non importées** | Les résas passées créées sur Wix n’ont jamais été importées dans Supabase. | Utiliser l’**import CSV** dans l’admin (Toutes les réservations → Importer CSV) pour les anciennes résas Wix si besoin d’historique. |
| **Lien de réservation pointe vers Wix** | Google, réseaux sociaux ou anciens liens mènent encore à la page Wix. | Mettre à jour tous les liens (Google, réseaux, signatures email) vers **https://www.TestRestaurant.ch/reservations**. |
| **Erreur API / Supabase au moment de la résa** | Problème temporaire (quota, env, bug) : la résa échoue côté TestRestaurant.ch. | Vérifier les logs (Vercel, Resend, Supabase). Corriger le bug. Pour les résas perdues : les saisir à la main dans l’admin. |

## Règles à suivre

1. **Une seule source de vérité** : la table Supabase `bookings`. Tout ce qui est “réservation” doit y être.
2. **Un seul canal de réservation en ligne** : TestRestaurant.ch/reservations. Wix (ou tout autre) ne doit plus accepter de nouvelles réservations.
3. **Toute résa hors site** (téléphone, email, sur place) doit être ajoutée dans l’admin (ou import CSV) pour rester visible dans le calendrier et les listes.

## Audit rapide (à faire côté client)

- [ ] Formulaire de réservation Wix désactivé ou redirigé vers TestRestaurant.ch
- [ ] Liens publics (Google, réseaux, etc.) pointent vers TestRestaurant.ch/reservations
- [ ] Processus interne : toutes les résas téléphone/email sont saisies dans l’admin
- [ ] Vérifier les logs Vercel/Supabase après une résa test pour confirmer l’écriture en base
