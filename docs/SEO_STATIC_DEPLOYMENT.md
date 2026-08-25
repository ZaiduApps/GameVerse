# 游戏详情静态化发布 SOP

## 发布顺序

1. 发布 `AC-interface`，确认 `GET /seo/sitemap/games` 仅返回合法包名，`GET /seo/game-page?pkg=...` 可用。
2. 在 Web 构建环境设置 `API_BASE_URL` 和 `GAMEVERSE_REQUIRE_SEO_SNAPSHOT=1`。
3. 回到 `D:\APKSCC\AC-interface` 执行 `pwsh -NoProfile -File .\scripts\production-release.ps1` 预检；确认四端提交、产物 SHA256、服务器磁盘和 PM2 状态后，再显式加 `-Apply`。
4. 统一入口在本地构建 `.next`（排除 `.next/cache`），上传后由服务器校验、备份、切换并等待 `3002` HTTP 健康；失败会恢复当前 GameVerse 备份。

## 自动重建

后端应用保存成功后向 `GAMEVERSE_REBUILD_WEBHOOK_URL` 发送 JSON：

```json
{
  "packages": ["com.tencent.ig"],
  "reason": "game-seo-updated",
  "requested_at": "2026-08-08T00:00:00.000Z"
}
```

请求头 `x-gameverse-signature` 是原始 JSON 请求体使用
`GAMEVERSE_REBUILD_WEBHOOK_SECRET` 计算的 HMAC-SHA256 十六进制摘要。Webhook
接收端必须执行恒定时间签名校验、限制来源、合并短时间内的重复请求。Webhook 只创建带包名和提交号的发布请求，不应直接在生产机执行 shell、`git pull` 或构建；发布仍由受控部署机执行
`AC-interface/scripts/production-release.ps1`，并保留人工审批和回滚点。

## 必需配置

后端：

```dotenv
GAMEVERSE_REBUILD_WEBHOOK_URL=https://deploy.example/internal/gameverse/rebuild
GAMEVERSE_REBUILD_WEBHOOK_SECRET=replace_with_a_random_secret
SEO_INDEXNOW_ENABLED=true
SEO_INDEXNOW_HOST=apks.cc
SEO_INDEXNOW_KEY=replace_with_indexnow_key
SEO_INDEXNOW_KEY_LOCATION=https://apks.cc/seo/bing/key.txt
```

Web：

```dotenv
API_BASE_URL=https://api.hk.apks.cc
GAMEVERSE_REQUIRE_SEO_SNAPSHOT=1
```

## 验证

```bash
curl -fsS https://api.hk.apks.cc/seo/sitemap/games?page=1\&pageSize=1
curl -fsS 'https://api.hk.apks.cc/seo/game-page?pkg=com.tencent.ig'
curl -fsSI https://apks.cc/app/com.tencent.ig
pm2 show game-ve
```

详情页响应应为 200，包含公共 `s-maxage`，HTML 中包含一个 H1、canonical、
`SoftwareApplication` JSON-LD、可见介绍、亮点和内部链接。
