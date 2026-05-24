#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/root/home/GameVerse"
BRANCH="${1:-main}"

echo "[deploy-fast] app dir: ${APP_DIR}"
echo "[deploy-fast] branch: ${BRANCH}"

cd "${APP_DIR}"

echo "[deploy-fast] git pull origin ${BRANCH}"
git pull origin "${BRANCH}"

echo "[deploy-fast] pnpm build"
pnpm build

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
  echo "[deploy-fast] ERROR: app health check failed"
  exit 1
fi

echo "[deploy-fast] done"
