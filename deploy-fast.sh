#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/root/home/GameVerse"
BRANCH="${1:-main}"
BUILD_DIR=".next-build"

echo "[deploy-fast] app dir: ${APP_DIR}"
echo "[deploy-fast] branch: ${BRANCH}"

cd "${APP_DIR}"

echo "[deploy-fast] git pull origin ${BRANCH}"
git pull origin "${BRANCH}"

echo "[deploy-fast] build into ${BUILD_DIR}"
rm -rf "${BUILD_DIR}"
if ! NEXT_DIST_DIR="${BUILD_DIR}" pnpm build; then
  echo "[deploy-fast] build failed; active .next was not modified"
  rm -rf "${BUILD_DIR}"
  exit 1
fi
if [ ! -s "${BUILD_DIR}/BUILD_ID" ]; then
  echo "[deploy-fast] ERROR: staged build has no BUILD_ID"
  rm -rf "${BUILD_DIR}"
  exit 1
fi

BACKUP_DIR="${APP_DIR}/.deploy-backups/$(date +%Y%m%d%H%M%S)"
mkdir -p "${BACKUP_DIR}"

rollback() {
  echo "[deploy-fast] restoring previous build"
  pm2 stop game-ve >/dev/null 2>&1 || true
  rm -rf .next
  if [ -d "${BACKUP_DIR}/.next" ]; then cp -a "${BACKUP_DIR}/.next" .next; fi
  pm2 startOrReload ecosystem.prod.config.js --only game-ve --update-env
  pm2 save
}

echo "[deploy-fast] activate staged build"
pm2 stop game-ve
if [ -d .next ]; then mv .next "${BACKUP_DIR}/.next"; fi
mv "${BUILD_DIR}" .next

echo "[deploy-fast] pm2 startOrReload ecosystem.prod.config.js --only game-ve --update-env"
if ! pm2 startOrReload ecosystem.prod.config.js --only game-ve --update-env; then
  rollback
  exit 1
fi

echo "[deploy-fast] pm2 save"
pm2 save

echo "[deploy-fast] verify pm2 process"
pm2 show game-ve >/dev/null

echo "[deploy-fast] verify listening port 3002"
# PM2 重载后 Next 进程需要短暂时间绑定端口，有限重试避免把启动竞态误报为部署失败。
port_ready=false
for attempt in $(seq 1 30); do
  if ss -lntp | grep -q ':3002'; then
    port_ready=true
    break
  fi
  sleep 1
done
if [ "${port_ready}" != "true" ]; then
  echo "[deploy-fast] ERROR: port 3002 is not listening"
  rollback
  exit 1
fi

echo "[deploy-fast] verify app health"
if ! curl -sS -m 8 http://127.0.0.1:3002/ >/dev/null; then
  echo "[deploy-fast] health check failed"
  rollback
  exit 1
fi

find "${APP_DIR}/.deploy-backups" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +

echo "[deploy-fast] done"
