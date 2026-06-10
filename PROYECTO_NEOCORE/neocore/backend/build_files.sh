#!/usr/bin/env bash
# ============================================================================
# build_files.sh — Vercel build script for NeoCore Django backend
#
# Vercel runs this script during the build phase (before the function is
# deployed). It collects static files so WhiteNoise can serve them at runtime.
#
# NOTE: Database migrations are NOT run here because they require a live DB
# connection with proper credentials. Run migrations once manually via:
#
#   vercel env pull .env.local
#   python manage.py migrate
#
# Or set up a one-time migration via the Vercel CLI:
#   vercel exec -- python manage.py migrate
# ============================================================================

set -e

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "==> Build complete."
