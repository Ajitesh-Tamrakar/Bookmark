#!/bin/bash
# ── Bookmark — Django Entrypoint ──────────────────────────────────────────────
# Runs every time the backend container starts.
# Waits for Postgres to be ready, runs migrations, then starts Django.

set -e

echo "[bookmark] Waiting for PostgreSQL..."

# Loop until pg_isready confirms Postgres is accepting connections
# This handles the race condition where Django starts before Postgres is ready
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; do
  echo "[bookmark] Postgres not ready yet — retrying in 1s..."
  sleep 1
done

echo "[bookmark] PostgreSQL is ready."

echo "[bookmark] Enabling PostgreSQL extensions..."
# Enable pgcrypto (for gen_random_uuid) and pgvector (for vector type)
# ON CONFLICT DO NOTHING means this is safe to run on every startup
python manage.py shell -c "
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
    cursor.execute('CREATE EXTENSION IF NOT EXISTS vector;')
print('[bookmark] Extensions ready.')
"

echo "[bookmark] Running database migrations..."
python manage.py migrate --noinput

echo "[bookmark] Starting Django on port 8080..."
exec python manage.py runserver 0.0.0.0:8080