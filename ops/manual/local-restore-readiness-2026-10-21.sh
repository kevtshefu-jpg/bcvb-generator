#!/bin/sh
# BCVB — local restore readiness check (read-only, no secrets).
# Run on the operator's Mac. Does NOT back up, restore, or modify any database.
set -eu

CONTAINER=bcvb-restore-test

printf '%s\n' '=== BCVB — CONTROLE LOCAL NON DESTRUCTIF ==='
printf '%s\n' 'Aucune connexion a Supabase. Aucun secret demande.'

if ! command -v docker >/dev/null 2>&1; then
  printf '%s\n' 'STOP : Docker CLI absent.'
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  printf '%s\n' 'STOP : Docker non disponible. Ouvrir Docker Desktop.'
  exit 1
fi
if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  printf '%s\n' 'STOP : conteneur isole attendu introuvable.'
  exit 1
fi

network=$(docker inspect --format '{{.HostConfig.NetworkMode}}' "$CONTAINER")
ports=$(docker inspect --format '{{json .HostConfig.PortBindings}}' "$CONTAINER")
status=$(docker inspect --format '{{.State.Status}}' "$CONTAINER")

printf 'Conteneur : %s\n' "$CONTAINER"
printf 'Etat : %s\n' "$status"
printf 'Reseau Docker : %s\n' "$network"
if [ "$network" != none ]; then
  printf '%s\n' 'STOP : le conteneur n est pas isole du reseau.'
  exit 1
fi
if [ "$ports" != '{}' ] && [ "$ports" != null ]; then
  printf '%s\n' 'STOP : des ports sont publies.'
  exit 1
fi
if [ "$status" != running ]; then
  printf '%s\n' 'STOP : le conteneur ne fonctionne pas.'
  exit 1
fi
printf '%s\n' 'Ports publies : aucun'

for tool in pg_dump pg_restore psql; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf 'Client local %s : present\n' "$tool"
  else
    printf 'Client local %s : absent (client Docker disponible pour controle)\n' "$tool"
  fi
done

# Only a non-sensitive count and version, against the explicitly isolated container.
# The SQL statement contains no data writes and prints no user identifiers.
docker exec -u postgres "$CONTAINER" psql -X -A -t -v ON_ERROR_STOP=1 -d postgres \
  -c "SELECT 'PostgreSQL ' || current_setting('server_version') || ', tables public: ' || count(*)::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p');"

printf '%s\n' 'OK : environnement isole accessible en lecture seule.'
printf '%s\n' 'ATTENTION : ceci ne prouve PAS qu une sauvegarde complete Auth/Storage est disponible ou restaurable.'
