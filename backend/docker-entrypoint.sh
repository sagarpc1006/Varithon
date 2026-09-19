#!/bin/sh
set -e

echo "=== Starting VariMitra Backend Container ==="

# Wait for PostgreSQL if configured
if [ "$DB_ENGINE" = "django.db.backends.postgresql" ] || [ -n "$DATABASE_URL" ]; then
    echo "Waiting for PostgreSQL database to be ready..."
    python << 'EOF'
import os, sys, time
import psycopg

db_url = os.environ.get('DATABASE_URL')
host = os.environ.get('POSTGRES_HOST', 'db')
port = int(os.environ.get('POSTGRES_PORT', '5432'))
user = os.environ.get('POSTGRES_USER', 'postgres')
password = os.environ.get('POSTGRES_PASSWORD', '')
dbname = os.environ.get('POSTGRES_DB', 'varimitra')

max_retries = 30
for i in range(max_retries):
    try:
        if db_url:
            conn = psycopg.connect(db_url, connect_timeout=3)
        else:
            conn = psycopg.connect(
                host=host, port=port, user=user, password=password, dbname=dbname, connect_timeout=3
            )
        conn.close()
        print("PostgreSQL connection established successfully!")
        sys.exit(0)
    except Exception as e:
        print(f"PostgreSQL not ready yet ({i+1}/{max_retries}): {e}")
        time.sleep(2)

print("Warning: Timed out waiting for PostgreSQL. Attempting to proceed anyway.")
EOF
fi

# Run Django migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Load initial data if requested and database is empty
if [ "$LOAD_SEED_DATA" = "true" ] || [ "$LOAD_SEED_DATA" = "1" ]; then
    if [ -f "datadump.json" ]; then
        echo "Loading initial seed datadump.json..."
        python manage.py loaddata datadump.json || echo "Seed data load notice: tables already populated"
    fi
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Launching ASGI Daphne server on 0.0.0.0:8000..."
exec "$@"
