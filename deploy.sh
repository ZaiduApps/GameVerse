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

echo "[deploy] pnpm build"
pnpm build

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
  echo "[deploy] ERROR: app health check failed"
  exit 1
fi

echo "[deploy] done"
