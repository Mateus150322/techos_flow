#!/usr/bin/env bash
set -euo pipefail

cd /app

if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock-ready" ]; then
  npm install
  mkdir -p node_modules
  touch node_modules/.package-lock-ready
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
fi

exec npm run dev -- --host 0.0.0.0 --port 5173
