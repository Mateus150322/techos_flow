#!/usr/bin/env sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY nao configurada. O backend nao pode iniciar em producao."
  exit 1
fi

export DB_HOST="${DB_HOST:-${PGHOST:-postgres}}"
export DB_PORT="${DB_PORT:-${PGPORT:-5432}}"
export DB_DATABASE="${DB_DATABASE:-${PGDATABASE:-postgres}}"
export DB_USERNAME="${DB_USERNAME:-${PGUSER:-postgres}}"
export DB_PASSWORD="${DB_PASSWORD:-${PGPASSWORD:-}}"
export PORT="${PORT:-8080}"

mkdir -p storage/app storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

echo "Configurando Apache na porta ${PORT}..."
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

echo "Aguardando PostgreSQL em ${DB_HOST}:${DB_PORT}/${DB_DATABASE}..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "${DB_DATABASE}" >/dev/null 2>&1; do
  sleep 2
done

echo "PostgreSQL disponivel. Preparando Laravel..."
php artisan package:discover --ansi

if [ "${RUN_MIGRATIONS_ON_START:-false}" = "true" ]; then
  echo "Executando migrations..."
  php artisan migrate --force
fi

echo "Otimizando Laravel..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*

echo "Iniciando Apache..."
exec apache2-foreground
