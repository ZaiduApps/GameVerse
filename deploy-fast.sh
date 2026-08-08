#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/root/home/GameVerse"
BRANCH="${1:-main}"

echo "[deploy-fast] app dir: ${APP_DIR}"
echo "[deploy-fast] branch: ${BRANCH}"

cd "${APP_DIR}"

echo "[deploy-fast] git pull origin ${BRANCH}"
git pull origin "${BRANCH}"

BACKUP_DIR="${APP_DIR}/.deploy-backups/$(date +%Y%m%d%H%M%S)"
mkdir -p "${BACKUP_DIR}"
if [ -d .next ]; then cp -a .next "${BACKUP_DIR}/.next"; fi

echo "[deploy-fast] pnpm build"
if ! pnpm build; then
  echo "[deploy-fast] build failed; preserving the previous .next artifact"
  rm -rf .next
  if [ -d "${BACKUP_DIR}/.next" ]; then cp -a "${BACKUP_DIR}/.next" .next; fi
  exit 1
fi

echo "[deploy-fast] pm2 startOrReload ecosystem.prod.config.js --only game-ve --update-env"
pm2 startOrReload ecosystem.prod.config.js --only game-ve --update-env

echo "[deploy-fast] pm2 save"
pm2 save

echo "[deploy-fast] verify pm2 process"
pm2 show game-ve >/dev/null

echo "[deploy-fast] verify listening port 3002"
if ! ss -lntp | grep -q ':3002'; then
  echo "[deploy-fast] ERROR: port 3002 is not listening"
  exit 1
fi

echo "[deploy-fast] verify app health"
if ! curl -sS -m 8 http://127.0.0.1:3002/ >/dev/null; then
  echo "[deploy-fast] health check failed; restoring previous build"
  rm -rf .next
  if [ -d "${BACKUP_DIR}/.next" ]; then
    cp -a "${BACKUP_DIR}/.next" .next
    pm2 reload game-ve --update-env
  fi
  exit 1
fi

find "${APP_DIR}/.deploy-backups" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +

echo "[deploy-fast] done"
