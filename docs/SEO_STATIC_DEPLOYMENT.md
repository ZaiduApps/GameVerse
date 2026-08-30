# 游戏详情 SEO 发布与缓存失效 SOP

> 适用仓库：`AC-interface`、`AC-GameVerse`、`AC-admin`
>
> 生产域名：`https://apks.cc`；Interface：`https://api.hk.apks.cc`
>
> 本文记录已验证的生产链路。每次执行都要重新采集状态，不能把历史结果当作当前结果。

## 状态定义

- `observed`：本次从 API、HTTP、PM2 或日志直接看到的结果。
- `inferred`：由代码和局部运行结果推断，尚未被完整链路直接证明。
- `missing evidence`：缺少生产访问、缓存回读或搜索引擎平台数据，不能下结论。

必须区分以下四个阶段：

1. `implemented`：代码或配置已存在。
2. `deployed and observable`：生产服务已加载，HTTP/日志可观察。
3. `processed by search platform`：Bing/Google 已重新抓取或处理。
4. `outcome observed`：收录、排名、点击等结果已有一段时间的第一方数据。

API 写入成功只代表第一阶段或第二阶段，不能直接宣称已收录或排名提升。

## 发布顺序

1. 发布 `AC-interface`，确认 `GET /seo/sitemap/games` 仅返回合法包名，`GET /seo/game-page?pkg=...` 可用。
2. 在 Web 构建环境设置 `API_BASE_URL` 和 `GAMEVERSE_REQUIRE_SEO_SNAPSHOT=1`。
3. 回到 `D:\APKSCC\AC-interface` 执行 `pwsh -NoProfile -File .\scripts\production-release.ps1` 预检；确认四端提交、产物 SHA256、服务器磁盘和 PM2 状态后，再显式加 `-Apply`。
4. 统一入口在本地构建 `.next`（排除 `.next/cache`），上传后由服务器校验、备份、切换并等待 `3002` HTTP 健康；失败会恢复当前 GameVerse 备份。

## Admin SEO 写入与回读

详情页 SEO 使用现有 Interface 接口，不直接改 MongoDB：

1. `POST /auth/login` 使用管理员运行时凭据登录，凭据只放在内存请求中，不写文件、日志或 Git。
2. `GET /game/info?pkg={pkg}` 读取目标 `_id` 与更新前 `app.seo`。
3. `PUT /game/{id}` 只提交 `{"seo":{...}}`，保留其他游戏字段。
4. 通过 `GET /game/info?id={id}` 和 `GET /seo/game-page?pkg={pkg}` 回读。

SEO 字段限制：`title` 最大 160，`description` 最大 320，`keywords` 最多 20 项，`highlights` 最多 12 项。页面渲染会进一步将最终描述限制为 160 字符。

推荐的详情页文案应突出游戏下载、APK、安卓安装、地区/国际服（仅在数据真实存在时）和开始游玩，不要把版本号、日期、大小、截图数量写入主描述。

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
接收端必须执行恒定时间签名校验、限制来源、合并短时间内的重复请求。当前 GameVerse 接收端为
`https://apks.cc/internal/gameverse/rebuild`，只失效规范包名对应的页面路径和缓存标签，不执行 shell、`git pull` 或构建。

Interface 的 SEO 更新会触发 `reason=game-seo-updated`。如果日志出现“游戏静态重建未配置
url/secret”，说明数据库可能已更新，但 SSR 缓存尚未可观测，必须暂停宣称发布完成。

## 必需配置

后端：

```dotenv
GAMEVERSE_REBUILD_WEBHOOK_URL=https://apks.cc/internal/gameverse/rebuild
GAMEVERSE_REBUILD_WEBHOOK_SECRET=replace_with_a_random_secret
SEO_INDEXNOW_ENABLED=true
SEO_INDEXNOW_HOST=apks.cc
SEO_INDEXNOW_KEY=replace_with_indexnow_key
SEO_INDEXNOW_KEY_LOCATION=https://apks.cc/seo/bing/key.txt
```

`GAMEVERSE_REBUILD_WEBHOOK_SECRET`、`SEO_INDEXNOW_KEY` 和其他 token 只能存在于生产环境配置或密钥管理系统，禁止提交到 Git。修改后重启实际的 PM2 进程，并用脱敏结果确认 `urlConfigured=true`、`secretConfigured=true`。

Web：

```dotenv
API_BASE_URL=https://api.hk.apks.cc
GAMEVERSE_REQUIRE_SEO_SNAPSHOT=1
```

## 验证

```bash
curl --proxy http://127.0.0.1:7897 -fsS 'https://api.hk.apks.cc/seo/sitemap/games?page=1&pageSize=1'
curl --proxy http://127.0.0.1:7897 -fsS 'https://api.hk.apks.cc/seo/game-page?pkg=com.tencent.ig'
curl --proxy http://127.0.0.1:7897 -fsSI 'https://apks.cc/app/com.tencent.ig'
pm2 show game-ve
```

详情页响应应为 200，包含公共 `s-maxage`，HTML 中包含一个 H1、canonical、
`SoftwareApplication` JSON-LD、可见介绍、亮点和内部链接。

针对 SEO 写入的最小验收还必须检查：

- API `app.seo` 与 Admin 保存值一致；
- meta description 与 JSON-LD description 一致；
- meta description 不含版本号、日期、文件大小等易过期字段；
- canonical 为 `https://apks.cc/app/{pkg}`，robots 为 `index, follow`；
- 页面只有一个 `<h1>`；
- Interface 日志没有 webhook 未配置或触发失败告警；
- 生产磁盘可用空间不少于 5 GB，至少保留一个有效 `.deploy-backups` 回滚版本。

## 失败处理与回滚

- API 返回非 2xx：不重复写入，先保存脱敏错误和请求时间，确认数据库是否已改变。
- API 已成功但 SSR 仍旧：标记为 `implemented but not observable`，检查 webhook 配置、签名、缓存标签和 GameVerse PM2，不要盲目重复提交。
- 构建失败或 3002 健康检查失败：保留当前 `.next`，按 `deploy-fast.sh` 的回滚逻辑恢复最近有效版本。
- 磁盘低于 5 GB：暂停构建，先记录绝对路径和大小，仅清理确认过的旧缓存/旧回滚目录；低于 2 GB 禁止部署。
- 搜索引擎是否抓取、收录和排名属于 `missing evidence`，必须在 Bing Webmaster Tools、Google Search Console 或第一方日志中单独验证。

## 最近验证记录

### 2026-08-31：`com.rasugames.pls`

- `observed`：管理员登录后通过 `PUT /game/{id}` 仅更新 `app.seo`，Interface 管理接口和公开 SEO 快照均回读成功。
- `observed`：签名请求发送到 `/internal/gameverse/rebuild` 返回 `200`，`interface-api` 与 `game-ve` 重启后均为 `online`，9527/3002 正常监听。
- `observed`：页面返回 `200`，标题、meta description、JSON-LD description 使用手工 SEO；canonical 正确、robots 为 `index, follow`，页面只有一个 `<h1>`。
- `observed`：生产 webhook 配置已存在于两端本地环境文件，临时测试密钥已删除；密钥未进入 Git。
- `missing evidence`：Bing/Google 是否完成重新抓取、收录或排名变化，尚未由站长平台或第一方数据确认。
