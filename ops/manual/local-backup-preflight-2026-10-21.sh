#!/bin/sh
# BCVB — local backup preflight, inspection only. No remote connections.
# Never prints secrets, database URLs, filenames, or document contents.
set -eu
printf '%s\n' '=== BCVB — PREPARATION SAUVEGARDE LOCALE ==='
printf '%s\n' 'Lecture seule : aucune connexion Supabase, aucun export, aucun secret.'

if [ "$(uname -s)" != Darwin ]; then
  printf '%s\n' 'STOP : script reserve au Mac de l operateur.'
  exit 1
fi

if command -v supabase >/dev/null 2>&1; then
  printf 'Supabase CLI : '
  supabase --version
else
  printf '%s\n' 'Supabase CLI : ABSENT'
fi

for tool in pg_dump pg_restore psql; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf '%s : ' "$tool"
    "$tool" --version
  else
    printf '%s : ABSENT\n' "$tool"
  fi
done

printf 'Espace disponible sur le disque utilisateur : '
df -Pk "$HOME" | awk 'NR == 2 { printf "%.1f Gio\n", $4 / 1048576 }'

if command -v fdesetup >/dev/null 2>&1; then
  printf 'Chiffrement FileVault : '
  fdesetup status 2>/dev/null || printf '%s\n' 'etat indisponible (verification manuelle requise)'
else
  printf '%s\n' 'Chiffrement FileVault : etat non disponible'
fi

PRIVATE_ROOT="$HOME/BCVB_SAUVEGARDES_PRIVEES"
if [ -d "$PRIVATE_ROOT" ]; then
  printf '%s\n' 'Dossier de sauvegarde prive : PRESENT'
  printf 'Taille totale des exports locaux existants : '
  du -sk "$PRIVATE_ROOT" | awk '{ printf "%.1f Mio\n", $1 / 1024 }'
else
  printf '%s\n' 'Dossier de sauvegarde prive : ABSENT'
fi

printf '%s\n' '=== FIN DU PREFLIGHT ==='
printf '%s\n' 'Ce controle ne prouve pas la couverture Auth/Storage ni une restauration valide.'
printf '%s\n' 'NE PAS transmettre de dump, de cle API, de mot de passe ou d URL de connexion.'
