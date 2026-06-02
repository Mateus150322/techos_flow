#!/usr/bin/env sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY not configured. Generating a new one..."
  export APP_KEY="base64:$(openssl rand -base64 32)"
fi

mkdir -p storage/app storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

echo "Aguardando PostgreSQL..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-postgres}" -d "${DB_DATABASE:-postgres}" >/dev/null 2>&1; do
  sleep 2
done

php artisan package:discover --ansi

if [ "${RUN_MIGRATIONS_ON_START:-false}" = "true" ]; then
  php artisan migrate --force
fi

php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*

export PORT="${PORT:-8080}"
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
