#!/bin/sh
# BCVB — production PostgreSQL permissions check, strictly read-only.
# Interactive password prompt, verified TLS certificate, no backup or mutation.
set -eu

HOST=db.leziahqmqyuewpzjmzxf.supabase.co
CERT="${BCVB_SSL_ROOT_CERT:-$HOME/BCVB_SAUVEGARDES_PRIVEES/supabase-production-ca.crt}"

printf '%s\n' '=== BCVB — AUTHENTIFICATION ET DROITS POSTGRES ==='
printf '%s\n' 'Cible : base de production, connexion directe IPv6, lecture seule.'
printf '%s\n' 'Aucun export, aucun fichier de donnees, aucune modification.'
printf '%s\n' 'Le mot de passe sera demande par psql sans affichage.'

if [ ! -r "$CERT" ]; then
  printf '%s\n' 'STOP : certificat CA Supabase de production absent ou illisible.'
  printf '%s\n' 'Telecharger le certificat depuis le Dashboard Supabase (Database Settings / SSL Configuration).'
  printf '%s\n' 'Enregistrer dans le dossier prive sous le nom supabase-production-ca.crt.'
  printf '%s\n' 'Ne pas transmettre ce fichier ni le mot de passe dans le chat.'
  exit 2
fi

if ! command -v psql >/dev/null 2>&1; then
  printf '%s\n' 'STOP : client psql absent.'
  exit 2
fi

# Server-verified TLS, no password in command arguments/history.
# Default READ ONLY at connection level, plus explicit READ ONLY transaction.
PGSSLMODE=verify-full \
PGSSLROOTCERT="$CERT" \
PGCONNECT_TIMEOUT=10 \
PGPASSFILE=/dev/null \
PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=15000' \
psql -X -W -v ON_ERROR_STOP=1 -P pager=off -A -F ' | ' \
  -h "$HOST" -p 5432 -U postgres -d postgres <<'SQL'
BEGIN READ ONLY;
SELECT 'connexion' AS controle,
       current_user AS utilisateur,
       current_setting('server_version') AS version_serveur,
       current_setting('transaction_read_only') AS transaction_read_only;
SELECT schemaname AS schema,
       count(*)::integer AS tables,
       count(*) FILTER (
         WHERE has_table_privilege(format('%I.%I', schemaname, tablename), 'SELECT')
       )::integer AS tables_lisibles
FROM pg_tables
WHERE schemaname IN ('public','auth','storage')
GROUP BY schemaname
ORDER BY schemaname;
SELECT 'auth.users' AS table_cible,
       has_table_privilege('auth.users', 'SELECT') AS lecture_autorisee
UNION ALL
SELECT 'storage.objects',
       has_table_privilege('storage.objects', 'SELECT')
UNION ALL
SELECT 'storage.buckets',
       has_table_privilege('storage.buckets', 'SELECT');
COMMIT;
SQL

printf '%s\n' '=== FIN DU CONTROLE : AUCUNE DONNEE MODIFIEE ==='
printf '%s\n' 'Les droits SELECT ne prouvent pas qu un dump complet ou une restauration fonctionnera.'
