#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# nginx docker-entrypoint.sh
#
# Generates a temporary self-signed SSL certificate if the Let's Encrypt
# certificate is not yet present, allowing nginx to start so that certbot
# can complete the ACME webroot challenge on port 80.
#
# Once the real certificate exists, this script is a no-op.
#
# To get a real Let's Encrypt certificate (run after first start):
#
#   docker compose run --rm certbot certonly \
#     --webroot --webroot-path=/var/www/certbot \
#     --email admin@neocoree.xyz --agree-tos --no-eff-email \
#     -d neocoree.xyz -d www.neocoree.xyz -d api.neocoree.xyz
#
# Then reload nginx:
#   docker compose exec nginx nginx -s reload
# ─────────────────────────────────────────────────────────────────────────────
set -e

CERT_DIR="/etc/letsencrypt/live/neocoree.xyz"
FULLCHAIN="$CERT_DIR/fullchain.pem"
PRIVKEY="$CERT_DIR/privkey.pem"

if [ ! -f "$FULLCHAIN" ] || [ ! -f "$PRIVKEY" ]; then
    echo "[nginx-init] SSL certificate not found — generating temporary self-signed cert..."
    mkdir -p "$CERT_DIR"
    apk add --no-cache openssl >/dev/null 2>&1 || true
    openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
        -keyout "$PRIVKEY" \
        -out    "$FULLCHAIN" \
        -subj   "/C=ES/ST=Spain/L=Madrid/O=NeoCore/CN=neocoree.xyz" \
        >/dev/null 2>&1
    echo "[nginx-init] Self-signed certificate created."
    echo "[nginx-init] Replace with a real Let's Encrypt certificate when ready:"
    echo "[nginx-init]   docker compose run --rm certbot certonly --webroot \\"
    echo "[nginx-init]     --webroot-path=/var/www/certbot --agree-tos --no-eff-email \\"
    echo "[nginx-init]     --email admin@neocoree.xyz \\"
    echo "[nginx-init]     -d neocoree.xyz -d www.neocoree.xyz -d api.neocoree.xyz"
    echo "[nginx-init]   docker compose exec nginx nginx -s reload"
else
    echo "[nginx-init] SSL certificate found — skipping self-signed generation."
fi

exec nginx -g "daemon off;"
