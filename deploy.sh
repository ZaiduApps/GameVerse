#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/root/home/GameVerse"
BRANCH="${1:-main}"

echo "[deploy] app dir: ${APP_DIR}"
echo "[deploy] branch: ${BRANCH}"

cd "${APP_DIR}"

echo "[deploy] git pull origin ${BRANCH}"
git pull origin "${BRANCH}"

echo "[deploy] pnpm install --frozen-lockfile"
pnpm install --frozen-lockfile

BACKUP_DIR="${APP_DIR}/.deploy-backups/$(date +%Y%m%d%H%M%S)"
mkdir -p "${BACKUP_DIR}"
if [ -d .next ]; then
  cp -a .next "${BACKUP_DIR}/.next"
fi

echo "[deploy] pnpm build"
if ! pnpm build; then
  echo "[deploy] build failed; preserving the previous .next artifact"
  rm -rf .next
  if [ -d "${BACKUP_DIR}/.next" ]; then cp -a "${BACKUP_DIR}/.next" .next; fi
  exit 1
fi

if [ ! -f .next/BUILD_ID ] || [ "$(find .next/server/app/app -type f -name 'page.js' 2>/dev/null | wc -l)" -eq 0 ]; then
  echo "[deploy] static artifact validation failed; preserving previous build"
  rm -rf .next
  if [ -d "${BACKUP_DIR}/.next" ]; then cp -a "${BACKUP_DIR}/.next" .next; fi
  exit 1
fi

echo "[deploy] pm2 startOrReload ecosystem.prod.config.js --only game-ve --update-env"
pm2 startOrReload ecosystem.prod.config.js --only game-ve --update-env

echo "[deploy] pm2 save"
pm2 save

echo "[deploy] verify pm2 process"
pm2 show game-ve >/dev/null

echo "[deploy] verify listening port 3002"
if ! ss -lntp | grep -q ':3002'; then
  echo "[deploy] ERROR: port 3002 is not listening"
  exit 1
fi

echo "[deploy] verify app health"
if ! curl -sS -m 8 http://127.0.0.1:3002/ >/dev/null; then
  echo "[deploy] health check failed; restoring previous build"
  rm -rf .next
  if [ -d "${BACKUP_DIR}/.next" ]; then
    cp -a "${BACKUP_DIR}/.next" .next
    pm2 reload game-ve --update-env
  fi
  exit 1
fi

find "${APP_DIR}/.deploy-backups" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +

echo "[deploy] done"
