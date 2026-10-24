#!/bin/sh
# BCVB - Direct PostgreSQL IPv6 reachability only.
# No credentials, no database authentication, no data reads/writes.
set -eu

printf '%s\n' '=== BCVB - DIAGNOSTIC RESEAU POSTGRES DIRECT ==='
printf '%s\n' 'Aucun mot de passe, aucune connexion SQL, aucune modification Supabase.'

if [ "$(uname -s)" != Darwin ]; then
  printf '%s\n' 'STOP : diagnostic prevu pour le Mac de l operateur.'
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' 'STOP : Python 3 est requis pour le diagnostic reseau.'
  exit 1
fi

# Production host is public infrastructure metadata, not a secret.
# The check only resolves DNS AAAA and opens a TCP socket to port 5432.
# No SQL or credentials are sent; IP addresses are not printed.
python3 - <<'PY'
import socket
import sys

host = "db.leziahqmqyuewpzjmzxf.supabase.co"
port = 5432
try:
    records = socket.getaddrinfo(host, port, socket.AF_INET6, socket.SOCK_STREAM)
except socket.gaierror:
    print("STOP : aucun enregistrement DNS IPv6 utilisable pour le serveur direct.")
    sys.exit(2)

if not records:
    print("STOP : aucun enregistrement DNS IPv6.")
    sys.exit(2)
print("DNS IPv6 : disponible")

for family, socktype, proto, _, address in records:
    try:
        with socket.socket(family, socktype, proto) as connection:
            connection.settimeout(4.0)
            connection.connect(address)
        print("TCP IPv6 port 5432 : ACCESSIBLE")
        print("SUITE : authentification SQL en lecture seule a preparer separement.")
        sys.exit(0)
    except (OSError, TimeoutError):
        continue

print("TCP IPv6 port 5432 : INACCESSIBLE depuis ce Mac/reseau.")
print("Aucun changement de configuration a effectuer pour ce diagnostic.")
print("SUITE : rechercher le mode Session pooler IPv4 sans achat d add-on.")
sys.exit(3)
PY
