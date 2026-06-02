#!/usr/bin/env sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY nao configurada. Gerando chave temporaria para iniciar o ambiente de producao."
  APP_KEY="base64:$(openssl rand -base64 32)"
  export APP_KEY
fi

mkdir -p storage/app storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

echo "Aguardando PostgreSQL..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-postgres}" -d "${DB_DATABASE:-postgres}" >/dev/null 2>&1; do
  sleep 2
done

echo "Running Laravel optimization commands..."
php artisan package:discover --ansi || echo "Warning: package:discover failed"

if [ "${RUN_MIGRATIONS_ON_START:-false}" = "true" ]; then
  echo "Running migrations..."
  php artisan migrate --force || echo "Warning: migrations failed"
fi

echo "Clearing and caching configuration..."
php artisan optimize:clear || echo "Warning: optimize:clear failed"
php artisan config:cache || echo "Warning: config:cache failed"
php artisan route:cache || echo "Warning: route:cache failed"
php artisan view:cache || echo "Warning: view:cache failed"

export PORT="${PORT:-8080}"
echo "Configuring Apache for PORT=${PORT}..."
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf
echo "Starting Apache on port ${PORT}..."
exec apache2-foreground
