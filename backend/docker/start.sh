#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

if [ ! -f "vendor/autoload.php" ]; then
  composer install --no-interaction --prefer-dist
fi

if ! grep -q "^APP_KEY=base64:" .env; then
  php artisan key:generate --force
fi

if [ "${DB_CONNECTION:-}" = "pgsql" ] && [ -n "${DB_HOST:-}" ]; then
  until pg_isready -h "${DB_HOST}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-postgres}" -d "${DB_DATABASE:-postgres}" >/dev/null 2>&1; do
    echo "Aguardando PostgreSQL em ${DB_HOST}:${DB_PORT:-5432}..."
    sleep 2
  done
fi

php artisan config:clear >/dev/null 2>&1 || true

if [ "${RUN_MIGRATIONS_ON_START:-true}" = "true" ]; then
  php artisan migrate --force
fi

exec php artisan serve --host=0.0.0.0 --port=8000
