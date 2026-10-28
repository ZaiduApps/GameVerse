#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/root/home/GameVerse"
BRANCH="${1:-main}"
BUILD_DIR=".next-build"
# KB_DEPLOY_FAST_BACKUP_ROOT 只给用例把备份根指向临时目录用；它只能改清理范围，
# 改不了发布目录本身，线上不设该变量即走默认路径。
BACKUP_ROOT="${KB_DEPLOY_FAST_BACKUP_ROOT:-${APP_DIR}/.deploy-backups}"
# 为什么是 3：一次发布产生一份备份，保留 3 份＝3 次回滚余量；更老的备份没有回滚价值，
# 却每次约 560MB 只进不出（2026-10-28 hk 盘用量 86%），所以按份数而非天数清理。
KEEP_BACKUPS=3

# 只清理 ${BACKUP_ROOT} 下的一级目录备份，按目录名时间戳（%Y%m%d%H%M%S）从新到旧保留最近
# ${KEEP_BACKUPS} 份，更老的整目录删除。幂等：目录不存在、为空、份数不足时都什么都不做。
prune_backups() {
  if [ ! -d "${BACKUP_ROOT}" ]; then
    echo "[deploy-fast] no backup dir at ${BACKUP_ROOT}; nothing to prune"
    return 0
  fi

  local entry
  local backups=()
  for entry in "${BACKUP_ROOT}"/*; do
    # 无匹配时通配符原样保留，形如 ".../.deploy-backups/*"，不是目录，直接跳过。
    [ -d "${entry}" ] || continue
    backups+=("${entry}")
  done

  if [ "${#backups[@]}" -le "${KEEP_BACKUPS}" ]; then
    echo "[deploy-fast] keep ${#backups[@]} backup(s) (limit ${KEEP_BACKUPS}); nothing to prune"
    return 0
  fi

  # 目录名是定长时间戳，字典序即时间序；sort -r 排出从新到旧。
  local sorted=()
  while IFS= read -r entry; do
    [ -n "${entry}" ] && sorted+=("${entry}")
  done < <(printf '%s\n' "${backups[@]}" | sort -r)

  local stale=("${sorted[@]:KEEP_BACKUPS}")
  local dir
  for dir in "${stale[@]}"; do
    echo "[deploy-fast] prune old backup: ${dir}"
    if [ "${KB_DEPLOY_FAST_PRUNE_DRY:-0}" = "1" ]; then
      echo "[deploy-fast] dry run; not deleting"
      continue
    fi
    rm -rf "${dir}"
  done
  echo "[deploy-fast] pruned ${#stale[@]} old backup(s); kept ${KEEP_BACKUPS}"
}

# 用例钩子：只跑备份清理后退出，不进入 git pull / build / pm2 流程。
if [ "${KB_DEPLOY_FAST_PRUNE_ONLY:-0}" = "1" ]; then
  prune_backups
  exit 0
fi

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
# -f 必带：不带时 500/502/404 也是退出码 0，进程在听就报健康，rollback 永不触发（2026-10-28 审计）。
if ! curl -fsS -m 8 http://127.0.0.1:3002/ >/dev/null; then
  echo "[deploy-fast] health check failed"
  rollback
  exit 1
fi

# 只有走到这里（健康检查通过）才算发布成功、回滚窗口关闭，才允许清理历史备份；
# 失败分支上面的 rollback 还要依赖本次备份，绝不能先删。
prune_backups

echo "[deploy-fast] done"
