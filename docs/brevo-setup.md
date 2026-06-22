# Configuration Brevo

Le projet utilise Brevo pour les emails transactionnels des Edge Functions Supabase.

## Expéditeur de test

Le domaine club n'étant pas encore maîtrisé côté DNS, l'expéditeur utilisé pour avancer est :

```bash
EMAIL_FROM="BCVB Référentiel kevtshefu@gmail.com"
ADMIN_NOTIFICATION_EMAIL="kevtshefu@gmail.com"
REPLY_TO_EMAIL="kevtshefu@gmail.com"
```

L'adresse `kevtshefu@gmail.com` doit être vérifiée comme expéditeur dans Brevo avant les tests.

## Secrets Supabase

```bash
supabase secrets set EMAIL_PROVIDER="brevo"
supabase secrets set BREVO_API_KEY="TA_CLE_API_BREVO"
supabase secrets set EMAIL_FROM="BCVB Référentiel kevtshefu@gmail.com"
supabase secrets set ADMIN_NOTIFICATION_EMAIL="kevtshefu@gmail.com"
supabase secrets set REPLY_TO_EMAIL="kevtshefu@gmail.com"
supabase secrets set SITE_URL="https://bcvb-generator-ds72.vercel.app"
```

## Fonctions à déployer

```bash
supabase functions deploy send-bcvb-email
supabase functions deploy notify-registration-created
supabase functions deploy notify-admin-event
supabase functions deploy create-approved-user
```
