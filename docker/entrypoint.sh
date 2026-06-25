#!/bin/bash
set -e

echo "[bookmark] PostgreSQL is ready (guaranteed by compose healthcheck)."

echo "[bookmark] Enabling PostgreSQL extensions..."
python manage.py shell -c "
from django.db import connection, transaction
for ext in ['pgcrypto', 'vector']:
    try:
        with transaction.atomic():
            connection.cursor().execute(f'CREATE EXTENSION IF NOT EXISTS {ext};')
    except Exception:
        pass
print('[bookmark] Extensions ready.')
"

echo "[bookmark] Running migrations..."
python manage.py migrate --noinput


echo "[bookmark] Starting command: $@"
exec "$@"

# echo "[bookmark] Starting Django on port 8080..."
# exec python manage.py runserver 0.0.0.0:8080