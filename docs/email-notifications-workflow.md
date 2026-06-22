# Workflow emails transactionnels BCVB

Le provider email transactionnel est Brevo.

Pour les tests actuels, le projet n'utilise plus le domaine historique du club comme expéditeur. L'adresse principale est :

```bash
EMAIL_FROM="BCVB Référentiel kevtshefu@gmail.com"
ADMIN_NOTIFICATION_EMAIL="kevtshefu@gmail.com"
REPLY_TO_EMAIL="kevtshefu@gmail.com"
```

L'adresse `kevtshefu@gmail.com` doit être vérifiée comme expéditeur dans Brevo.

## Edge Functions

- `send-bcvb-email` : envoi Brevo générique.
- `notify-registration-created` : email demandeur + email admin après demande d'inscription.
- `notify-admin-event` : alerte admin email pour les événements critiques, selon préférences.
- `create-approved-user` : création/retrouvaille Auth, upsert `profiles`, génération d'un lien sécurisé de création de mot de passe, puis envoi Brevo.

Les erreurs email sont journalisées et ne doivent pas bloquer l'action principale.

## Secrets Supabase

```bash
supabase secrets set EMAIL_PROVIDER="brevo"
supabase secrets set BREVO_API_KEY="TA_CLE_API_BREVO"
supabase secrets set EMAIL_FROM="BCVB Référentiel kevtshefu@gmail.com"
supabase secrets set ADMIN_NOTIFICATION_EMAIL="kevtshefu@gmail.com"
supabase secrets set REPLY_TO_EMAIL="kevtshefu@gmail.com"
supabase secrets set SITE_URL="https://bcvb-generator-ds72.vercel.app"
```

## Déploiement

```bash
supabase functions deploy send-bcvb-email
supabase functions deploy notify-registration-created
supabase functions deploy notify-admin-event
supabase functions deploy create-approved-user
```
