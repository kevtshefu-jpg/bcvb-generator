# Checklist tests emails BCVB

## Préconfiguration

- [ ] `kevtshefu@gmail.com` est vérifiée comme expéditeur dans Brevo.
- [ ] Les secrets Supabase sont configurés :

```bash
supabase secrets set EMAIL_PROVIDER="brevo"
supabase secrets set BREVO_API_KEY="TA_CLE_API_BREVO"
supabase secrets set EMAIL_FROM="BCVB Référentiel kevtshefu@gmail.com"
supabase secrets set ADMIN_NOTIFICATION_EMAIL="kevtshefu@gmail.com"
supabase secrets set REPLY_TO_EMAIL="kevtshefu@gmail.com"
supabase secrets set SITE_URL="https://bcvb-generator-ds72.vercel.app"
```

## Tests manuels

- [ ] Créer une inscription publique.
- [ ] Vérifier l'email demandeur : sujet `BCVB — Votre demande d’accès a bien été reçue`.
- [ ] Vérifier l'email admin sur `kevtshefu@gmail.com` : sujet `BCVB — Nouvelle demande d’inscription`.
- [ ] Valider la demande côté admin.
- [ ] Vérifier l'email de création de mot de passe : sujet `BCVB — Créez votre mot de passe`.
- [ ] Vérifier que l'email contient un lien sécurisé vers `/reinitialisation-mot-de-passe`.
- [ ] Vérifier Brevo Logs.
- [ ] Vérifier `email_events` si la table existe sur l'environnement Supabase.

## Garde-fous

- [ ] Aucun mot de passe provisoire n'est envoyé en clair.
- [ ] Les erreurs email ne bloquent pas l'inscription ni la validation admin.
- [ ] Les rôles `admin` et `responsable_technique` existants ne sont pas rétrogradés.
