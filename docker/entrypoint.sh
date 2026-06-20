#!/bin/bash
set -e

echo "[bookmark] PostgreSQL is ready (guaranteed by compose healthcheck)."

echo "[bookmark] Enabling PostgreSQL extensions..."
python manage.py shell -c "
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
    cursor.execute('CREATE EXTENSION IF NOT EXISTS vector;')
print('[bookmark] Extensions ready.')
"

echo "[bookmark] Running migrations..."
python manage.py migrate --noinput


echo "[bookmark] Starting command: $@"
exec "$@"

# echo "[bookmark] Starting Django on port 8080..."
# exec python manage.py runserver 0.0.0.0:8080