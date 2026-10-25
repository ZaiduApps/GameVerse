# 详情页边缘缓存（Cloudflare Cache Rule + 源站 Vary 收口）

> 适用范围：GameVerse 详情页 `/app/{pkg}` 的 HTML 响应。
> 结论先行：**边缘不缓存 HTML 的主因是「没有 Cache Rule」，Vary 是次要因素**；
> 两者都要做，否则一旦上规则，RSC 变体会把缓存切碎。

## 1. 事实（2026-10-25 04:0x UTC 实测，`https://apks.cc/app/com.tencent.ig`）

| 观测项 | 值 | 说明 |
|---|---|---|
| `cf-cache-status` | `DYNAMIC` | Cloudflare 直接判定不可缓存（没有命中任何 Cache Rule） |
| `x-nextjs-cache` | `STALE` | 源站 ISR 有缓存，且有可用旧页 |
| `cache-control` | `s-maxage=300, stale-while-revalidate=31535700` | 源站已经给了边缘 5 分钟 TTL + 长 SWR |
| `vary` | `RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding` | Next App Router 默认值，会把缓存键切碎 |

对照组，说明主因不是 Vary：

- 同一时刻 `/sitemap.xml`（`cache-control: public, max-age=0, s-maxage=1800`，Vary 里只有 `Accept-Encoding` + 4 个 RSC 头）同样是 `DYNAMIC`；
- `/_next/static/**` 是 `HIT`（`age: 35728`）。

即：**在没配 Cache Rule 的前提下，Cloudflare Free 套餐默认不缓存 HTML（DYNAMIC）**，与 Vary 里有没有 RSC 无关。
但 Vary 必须收口——规则一旦生效，四个 RSC token 会让同一个 URL 的 HTML 按 `RSC` / `Next-Router-State-Tree` 等请求头切成多个变体，命中率接近 0。

## 2. 源站改动（`pnpm start` 自定义 server）

`ecosystem.prod.config.js` 启动的是 `node scripts/next-runner.mjs start`。`scripts/next-runner.mjs` 在 `start` 模式下现在改为**自建 Node HTTP server**（`scripts/lib/next-prod-server.mjs`）：
`next({ dev: false })` → `app.prepare()` → `app.getRequestHandler()`，在响应落盘前改写响应头。

### 2.1 Vary 收口（只作用于详情页 HTML）

裁剪逻辑在纯函数 `scripts/lib/html-vary.mjs` 的 `sanitizeVaryHeader(value, { isHtmlDetailRoute, isRscRequest })`，三个条件同时成立才动手：

1. 路径是 `/app/{pkg}` 或 `/app/{pkg}/`（`isGameDetailHtmlRoute`）；
2. 请求**不是** RSC 导航（没有 `RSC` 头、查询串里没有 `_rsc=`）；
3. 响应 `content-type` 是 `text/html`。

命中时只删 `RSC`、`Next-Router-State-Tree`、`Next-Router-Prefetch`、`Next-Router-Segment-Prefetch` 四个 token，保留 `Accept-Encoding` 等其它值；全部删空则整条 Vary 头移除。
`Vary: *`、其它路由（`/`、`/community`、`/_next/*`、`/api/*`）、RSC 响应（`text/x-component`）一律原样放行。

覆盖的写出路径：`res.setHeader` + `res.writeHead`（Next 走这条）、`res.writeHead(status, headers)`、以及 `res.flushHeaders()` / 首次 `res.write()` 触发的隐式落盘。

### 2.2 压缩

自定义 server 会丢掉 `next start` 内置的 compression 中间件（它在 Next 的 router-server 里，自定义 server 不走那条路）。本仓没有 `compression` 依赖，所以用 Node 内置 `zlib` 对 **`text/html`** 做流式 gzip：

- 条件：GET/HEAD、`Accept-Encoding` 接受 gzip、响应尚无 `Content-Encoding`、非 304/204、无 `Range`、`Content-Length` 不设或 ≥ 1024、`content-type: text/html`；
- 命中时设置 `Content-Encoding: gzip`、删除 `Content-Length`（长度变了，必须删）、在 Vary 上补回 `Accept-Encoding`；
- 流式：`res.write/end` 直接接进 `zlib.createGzip()`，压缩分片写进原始 socket，不做整体缓冲。

**非 HTML 资源（JS/CSS/JSON/RSC）由 Cloudflare 边缘压缩**（生产实测 HTML 与静态资源都带 `content-encoding: br`，说明 Cloudflare 会对可压缩类型自动压缩，包括源站未压缩的响应）。这是刻意的取舍：源站只补回最影响 TTFB 的 HTML 压缩，避免自研通用压缩中间件带来的流式/二次压缩风险。

### 2.3 不退化清单

- `dev` 模式：`pnpm dev` 仍然 `pnpm exec next dev`，行为完全不变；
- ISR / 静态资源 / rewrites / 404 / 500：由 `NextNodeServer` 自己处理，自定义 server 不介入；
- 优雅退出：自己接 `SIGINT`/`SIGTERM`，`server.close()` → `app.close()`，5s 后强制退出；
- 启动失败（端口占用等）：打印原因并 `exit 1`，PM2 会按 `max_restarts` 处理。

## 3. Cache Rule 定义

| 字段 | 值 |
|---|---|
| 规则名 | `apkscc: 详情页 HTML 边缘缓存 (/app/*)` |
| 表达式 | `(starts_with(http.request.uri.path, "/app/"))` |
| Cache eligibility | Eligible for cache（即 Cache Everything） |
| Edge TTL | `respect_origin`（复用源站 `s-maxage=300`） |
| Browser TTL | `respect_origin` |
| Cache key | 默认（**查询串参与 cache key**，不自定义） |
| Transform Rule | 不需要。Vary 已在源站收口，Cloudflare 也不能安全地改写 Vary |

要点：

- **查询串参与 cache key**：RSC 请求的 `?_rsc=` 天然与普通 HTML 分开缓存，不需要额外规则；
- 表达式用 `starts_with(..., "/app/")` 而不是 `/app/*`：不会命中 `/app` 列表页本身（列表页有自己的分页查询串，后续单独评估）；
- 不存在的 pkg 走 `notFound()`，本机实测该 404 带 `cache-control: s-maxage=300, stale-while-revalidate=...`（沿用详情路由的 revalidate），所以边缘最多缓存 5 分钟 —— 404 是确定性结果，可以接受；
- 详情页 HTML 不带 `Set-Cookie`、无登录态分支，`Cache Everything` 不会泄露个性化内容。

### 3.1 面板操作清单

Cloudflare Dashboard → 选中 `apks.cc` → **Rules → Cache Rules → Create rule**：

1. **Rule name**：`apkscc: 详情页 HTML 边缘缓存 (/app/*)`
2. **If incoming requests match…**：选 *Custom filter expression*（或 *Edit expression*），粘贴原文：
   ```
   (starts_with(http.request.uri.path, "/app/"))
   ```
3. **Cache eligibility** → `Eligible for cache`
4. **Edge TTL** → `Use cache-control header if present, bypass cache if not`
5. **Browser TTL** → `Respect origin TTL`
6. **Cache key**：保持默认，不勾自定义
7. **Deploy**，然后跑第 4 节的断言

### 3.2 为什么不能只靠改源站

Cloudflare 只有在「响应符合缓存资格」时才会缓存：Free 套餐默认只缓存静态扩展名（图片/CSS/JS），HTML 一律 `DYNAMIC`，与源站 `Cache-Control` 写多长无关。源站侧能做的只有两件事：

1. 给出正确的 `s-maxage`（已有：300s）与 `stale-while-revalidate`；
2. 别让缓存键被 `Vary` 切碎（本次改动）。

真正的「缓存资格」只能由 Cache Rule 授予，这属于边缘配置，不是仓库能生效的东西。

## 4. 工具

### 4.1 下发规则（默认 dry-run）

```bash
node scripts/cloudflare-edge-cache.mjs            # 只读现有规则 + 打印将下发的请求体
node scripts/cloudflare-edge-cache.mjs --apply    # 真正 PUT
```

- Token 只从 `CF_API_TOKEN` 或 `~/.config/apkscc/cloudflare.key` 读，任何输出都不回显 token；
- 会先 GET 当前 `http_request_cache_settings` entrypoint，保留其它规则、按描述替换本脚本负责的那一条；
- **退出码 4**：凭据缺失或站点级 rulesets 接口 403（当前账户级 token 多为这种）→ 打印面板清单，视为「待面板操作」，不会假装成功。

### 4.2 生产断言

```bash
node scripts/assert-edge-cache.mjs --url https://apks.cc/app/com.tencent.ig
```

- 同一 URL 连打两次普通 HTML 请求，断言第二次 `cf-cache-status: HIT` 且 TTFB < 80ms（`--max-ttfb-ms` 可调）；
- 同时比对两次 HTML 里的 `<title>`/`og:title`/`og:image`/`detail_images` 首图，防止「命中了一份错页」；
- 顺带检查 Vary 是否还带 RSC token；
- **退出码 5**：规则未生效/未命中（明确报「Cache Rule 未生效」，不是通过）；**退出码 1**：请求失败或页面非 200。

## 5. 验收顺序

1. 本机 `pnpm build` → `PORT=3002 pnpm start`，按 `docs` 第 6 节的 curl 清单验证 Vary 与 gzip；
2. 发布（`production-release.ps1 -Components gameverse`），确认线上详情页 `vary` 只剩 `Accept-Encoding` + RSC 请求仍拿得到 RSC 负载；
3. `node scripts/cloudflare-edge-cache.mjs`（dry-run）→ 有权限则 `--apply`，否则按 3.1 面板操作；
4. `node scripts/assert-edge-cache.mjs` → 退出码 0 才算完成。

## 6. 本机验证清单

```bash
PORT=3002 pnpm start   # 另开一个终端

# 详情页 HTML：Vary 只剩 Accept-Encoding
curl -sSI -H 'accept: text/html' http://127.0.0.1:3002/app/com.tencent.ig | grep -i vary

# RSC 请求：仍是 RSC 负载，Vary 未被裁剪
curl -sS -H 'RSC: 1' http://127.0.0.1:3002/app/com.tencent.ig | head -c 200

# 对照组：首页 Vary 原样保留 4 个 RSC token
curl -sSI http://127.0.0.1:3002/ | grep -i vary

# gzip 生效
curl -sSI -H 'accept: text/html' -H 'accept-encoding: gzip' http://127.0.0.1:3002/app/com.tencent.ig | grep -i -e vary -e content-encoding
```

## 7. 回滚

- 规则回滚：面板把该 Cache Rule 设为 Disabled / 删除；或 `node scripts/cloudflare-edge-cache.mjs --apply` 时把规则体删掉（脚本按描述替换，需要手工改）。
- 源站回滚：`scripts/next-runner.mjs` 的 `start` 分支改回 `spawn('pnpm', ['exec','next','start','-p',port])`。自定义 server 不影响构建产物，回滚只换启动方式。
- 降级影响：回滚后详情页 Vary 恢复 4 个 RSC token（边缘命中率下降，但不会错页）。
