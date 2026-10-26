# Web 前端安全与稳定性评审（2026-10-26）

> 状态：**历史快照 / 需求提案，待决策**。本文件是一次性评审记录，不是随代码演进的权威文档；
> 决策落地后，结论应合并进对应权威文档（`SEO_STATIC_DEPLOYMENT.md`、根 `AGENTS.md`、
> `AC-interface/docs/*`），本文件不再更新。
>
> 评审对象：`AC-GameVerse`（apks.cc 生产站点），必要时联调 `AC-interface` 与生产响应头。
> 分支：`feat/web-hardening-review`（基于 `main@993cc65`）。

## 方法

1. 只认实测与源码，不凭记忆。生产行为用 `curl` 直接抓响应头/状态码；代码行为用源码定位行号。
2. 区分三类证据：**实测**（生产/本地真实响应）、**源码**（文件行号）、**复现**（可重复的构建/脚本输出）。
3. 先排除误报。已专门验证并**确认安全**的项写在第 4 节，避免后续做无用改动。

## 1. 结论

- **可以立即发版吗？不能。** 当前 `pnpm build` 在本地直接失败（两个独立原因，见 S-01/S-02）。
- **最严重的不是功能缺口，而是攻击面**：公网站点源通过 `/api/*` 把整个 Interface（含 Swagger 与后台路径）暴露出来（实测 200/401），叠加弱 CSP 与 localStorage 令牌。
- **功能侧的真正短板集中在「分发可信度」**：没有 APK 校验值、没有版本历史、没有下载记录。这三点决定平台能否被当作可信分发渠道，而不是网盘镜像。
- 已核实**不属于**缺陷的项：社区帖 Markdown 会转义全部原始 HTML（无 XSS）；下载 302 只放行 http/https 且失败回详情页（无开放重定向）。

## 2. 需求清单

优先级：**P0** = 安全/可发布阻断；**P1** = 稳定性与可信度；**P2** = 功能补齐与体验。

### P0 — 安全

#### S-01 收敛 `/api/*` 通配反代为显式路径白名单

- **问题**：`next.config.ts` 把 `/api/:path*` 无条件透传到 Interface 根路径，浏览器的任何请求都能借 `apks.cc` 同源访问全部后端路由。
- **证据（实测，2026-10-26）**：
  - `GET https://apks.cc/api/api-docs-json` → `200`，`382196` 字节（完整 OpenAPI 规范）
  - `GET https://apks.cc/api/api-docs` → `200`，`4088` 字节（Swagger UI 页面）
  - `GET https://apks.cc/api/resource-update/admin/apkeep/accounts` → `401`（**不是 404**，说明后台路由确实被代理可达）
- **源码**：`next.config.ts` `rewrites()` 中 `source: '/api/:path*' → '${backendBaseUrl}/:path*'`。
- **影响**：公开站点成了后台 API 的入口；任何同源 XSS 都能直接打管理端点；爬虫可枚举全部接口。
- **建议**：改为逐条白名单（只放行 Web 实际调用的前缀，如 `/game`、`/content/public`、`/community`、`/notifications`、`/auth`、`/users`、`/seo`、`/config`、`/site`、`/tracking`、`/search`），后台前缀（`/admin`、`*/admin/*`、`/api-docs*`、`/logs`、`/task-scheduler`、`/internal`、`/mcp`）一律不代理。白名单需按前端实际调用清单生成，不能凭感觉。
- **决策点**：是否需要保留少量后台接口供 Web 端使用（目前未发现）。

#### S-02 下线公网 Swagger 与接口文档

- **问题**：Interface 在 `/api-docs` 挂载 Swagger，且开启了 `persistAuthorization: true`。
- **证据（实测）**：`https://apks.cc/api/api-docs` → `200`；`/api/api-docs-json` → `200`（382 KB）。
- **源码**：`AC-interface/src/modules/index.ts` `SwaggerModule.setup("api-docs", ...)` + `persistAuthorization: true`。
- **影响**：完整 DTO、字段、后台端点对外公开；Swagger 的持久化授权还会把 JWT 留在浏览器存储里。
- **建议**：生产关闭 Swagger，或仅在内网/带鉴权的入口开放；若 S-01 做了白名单，此项自动缓解，但仍应显式关闭。
- **决策点**：后台开发是否依赖线上 Swagger；若依赖，改为本地或 Basic Auth 保护的独立入口。

#### S-03 建立真正生效的 CSP

- **问题**：当前 CSP 只有一条 `frame-ancestors`，对 XSS 零防护。
- **证据（实测）**：生产 `apks.cc` 响应头 `content-security-policy: frame-ancestors 'self'`。
- **源码**：`next.config.ts` `headers()` 中同样的单指令值。
- **影响**：任何一处 HTML 注入都能执行任意脚本并读取 `localStorage` 中的 JWT。
- **建议**：分两步走，避免一次性打断站点：
  1. 先上 `Content-Security-Policy-Report-Only`，用 `report-uri` 收集真实违规；
  2. 再切换强制模式，至少包含 `default-src 'self'`、`script-src 'self' 'nonce-...'`（Next 15 支持 nonce）、`object-src 'none'`、`base-uri 'self'`、`frame-ancestors 'self'`。
- **风险**：站点大量使用内联样式与第三方图片，`style-src`/`img-src` 需按实测放宽；不可直接照搬模板。

#### S-04 关闭框架版本指纹

- **问题**：Web 与 API 都对外暴露技术栈与版本线索。
- **证据（实测）**：`apks.cc` 返回 `x-powered-by: Next.js`；`api.hk.apks.cc` 返回 `X-Powered-By: Express`。
- **源码**：`next.config.ts` 未设置 `poweredByHeader: false`；Interface 未启用 `helmet`。
- **影响**：降低攻击者探测成本（定向利用已知版本漏洞）。
- **建议**：Next 设 `poweredByHeader: false`；Interface 启用 `helmet`（同时补齐 `nosniff`、`X-Frame-Options` 等）。

#### S-05 令牌从 localStorage 迁移到 httpOnly Cookie

- **问题**：JWT 存在 `localStorage`，任何 XSS 都能直接读走。
- **证据（源码）**：`src/context/auth-context.tsx:32-33`（`localStorage.setItem('auth_token', ...)`）；全仓 `localStorage` 命中 12+ 文件。
- **影响**：与 S-03 叠加后是「弱 CSP + 可被脚本读取的长效令牌（7d）」，一旦注入即长期接管账号；若管理员在公网站点登录，等于交出后台。
- **建议**：后端下发 `httpOnly; Secure; SameSite=Lax` Cookie，前端不再持有令牌；SSR 侧顺带获得真实登录态。需同步改 `AC-interface` 的鉴权读取方式与 `AC-Android` 的兼容策略。
- **决策点**：这是**跨端改造**（Web + Interface + Android），不是单仓改动。是否本轮做，还是先只做 S-03 降低暴露面？

#### S-06 用成熟库替换正则 HTML 清洗

- **问题**：游戏描述保留 HTML，仅用 7 条正则清洗，存在可执行的绕过。
- **证据（复现，按 `sanitizeRichHtml` 原文逐字执行）**：以下输入清洗后仍保留可执行向量：
  - `<a href=javascript:alert(1)>` → 原样保留（无引号分支未覆盖）
  - `<a href="&#106;avascript:alert(1)">` → 原样保留（数字实体解码后即 `javascript:`）
  - `<a href="javascript&colon;alert(1)">` → 原样保留（命名实体）
  - `<a href="java&#9;script:alert(1)">` → 原样保留（内嵌制表符，浏览器会剥离）
  - `<button formaction=javascript:alert(1)>` → 原样保留（`formaction` 不在正则覆盖范围）
- **源码**：`src/app/app/[id]/game-detail-presenter.ts:127` `sanitizeRichHtml()`。
- **影响**：游戏描述来源为后台录入 + GitHub Release 自动导入（第三方文本）。当前仅管理员/导入链可写，故定级**中危**；但它是存储型 XSS 的现成入口，且会随导入源扩散。
- **建议**：引入 `isomorphic-dompurify`（服务端可用），用标签/属性白名单替代正则；清洗后再做 `h1→h2` 的语义归一。
- **说明**：社区帖走的是另一条链路（Markdown 渲染器转义全部原始 HTML），**不需要**改，见第 4 节。

#### S-07 认证端点补齐限流与失败锁定

- **问题**：登录/注册/发码没有速率限制，可被暴力破解与短信/邮件轰炸。
- **证据（源码）**：`AC-interface` 全仓 `@Throttle` 仅出现在 `admin-public.controller.ts` 与 `upload.controller.ts`；`auth.controller.ts` 的 `login`/`register-by-email`/`login-by-email`/`send-code` 均无。登录服务仅有 `user.isBlocked` 标记，无失败计数/临时锁定。
- **影响**：账号撞库、验证码接口被当作邮件轰炸器。
- **建议**：认证路由统一加 Throttler（按 IP + 账号双维度），失败 N 次递增延迟/短期锁定，发码接口单独更严配额。

#### S-08 修正 API CORS 组合

- **问题**：`origin: "*"` 与 `credentials: true` 同时开启，语义非法且过度开放。
- **证据（实测）**：`api.hk.apks.cc` 返回 `Access-Control-Allow-Origin: *` 与 `Access-Control-Allow-Credentials: true`。
- **源码**：`AC-interface/src/modules/index.ts` `root.enableCors({ origin: "*", ..., credentials: true })`。
- **影响**：任意站点可在浏览器内调用全部公开 API（放大抓取与滥用）；组合本身被浏览器拒绝，属配置错误。
- **建议**：改为显式来源白名单（`https://apks.cc`、`https://admin.apks.cc`、本地开发域），并与 S-05 的 Cookie 方案一起决定是否保留 `credentials`。

#### S-09 前端错误上报与敏感信息脱敏

- **问题**：没有统一的前端异常上报；同时多处把错误对象直接 `console.error`。
- **证据（源码）**：`src/lib/api.ts` 的 `trackedApiFetch` 在失败时打印 `requestUrl`、`path`、异常消息；全仓无 Sentry/自建上报入口。
- **影响**：线上白屏只能靠用户口述；一旦请求 URL 携带敏感查询参数，会进浏览器控制台与用户截图。
- **建议**：接入轻量错误上报（或复用 Interface 的日志通道），统一脱敏规则（token/email/query 白名单），并禁止在客户端打印凭证。

### P1 — 稳定性与可信度

#### S-10 修复 4 个用户中心页的 Suspense，恢复可发布构建

- **问题**：`'use client'` 页面直接调用 `useSearchParams()`，整棵子树没有 Suspense 边界，Next 15 在预渲染阶段报错并中止构建。
- **证据（复现）**：同一份文件状态下 `pnpm build` 输出
  `useSearchParams() should be wrapped in a suspense boundary at page "/profile/center/games"`，
  修掉后又依次暴露 `reservations` 等，属同一根因。
- **源码**：`src/app/profile/center/{games,posts,reservations,topics}/page.tsx` 均为 `'use client'` + `useSearchParams()` + 无 `Suspense`；四文件自 2026-06 起未改（`git log`）。
- **参照**：`src/app/community/page.tsx` 已有正确范式——server 页面 + `<Suspense>` + 注释说明为何不能加回 `loading.tsx`（加了会让 `notFound()` 变软 404）。
- **建议**：按 `community` 的做法，把四个页面拆成 server 包装层 + 客户端组件，包 `<Suspense>`；**不要**加回 `loading.tsx`，也不要在 `'use client'` 文件里写 `export const dynamic`（无效）。

#### S-11 构建不应依赖运行中的 Interface

- **问题**：`pnpm build` 需要本机 `9527` 在线，否则在 `/app/[id]` 预渲染阶段直接失败。
- **证据（实测）**：9527 未监听时，构建输出 `Export encountered an error on /app/[id]/page: /app/com.studiolico.warriorreturns`；接口在线时同一构建可通过该阶段。
- **影响**：CI、预览环境、离线构建全部不可用；构建结果还受后端数据波动影响（不可重现）。
- **建议**：预渲染阶段对后端失败做降级（返回占位/空数据并标记 `revalidate`），或把详情页从「构建期抓取」改为「请求期 ISR」，让构建与数据源解耦。**这是架构决策，不只是补丁。**

#### S-12 补根级错误边界

- **问题**：只有 `src/app/community/error.tsx` 与 `not-found.tsx`，没有根级 `error.tsx`，也没有 `global-error.tsx`。
- **证据（源码）**：`src/app` 下 `error.tsx` 仅 1 个，位于 `community/`。
- **影响**：任一页面渲染异常会落到 Next 默认错误页——无导航、无重试、无品牌，且用户无法自救。
- **建议**：增加 `src/app/error.tsx`（带重试与返回首页）与 `src/app/global-error.tsx`（兜住根布局崩溃）。

#### S-13 统一请求超时与失败语义

- **问题**：只有 `trackedApiFetch` 支持超时；认证链路用裸 `fetch`，且多处静默吞错。
- **证据（源码）**：`src/context/auth-context.tsx` 的 `refreshUser()` 用 `fetch` 无 `timeoutMs`，`catch` 块为空注释「Silently fail user refresh」；`logout()` 同样吞错。
- **影响**：后端抖动时页面既不报错也不重试，用户看到的是「永远加载中」或「状态莫名丢失」。
- **建议**：所有网络请求统一走一个带超时、可重试、可观测的封装；区分「可重试失败」与「业务错误」，并把失败状态暴露到 UI。

#### S-14 并发 401 去重刷新 + 跨标签页登录态同步

- **问题**：多个请求同时 401 会各自触发 refresh；多标签页之间登录/登出不同步。
- **证据（源码）**：`refreshUser()` 无并发锁/单飞（single-flight）；全仓无 `window.addEventListener('storage', ...)` 监听。
- **影响**：刷新风暴、刷新令牌被并发消耗导致误登出；一个标签页登出后另一个仍显示已登录。
- **建议**：refresh 做单飞 + 结果广播；用 `storage` 事件（或 BroadcastChannel）同步登录态。

#### S-15 恢复 lint 门禁

- **问题**：仓库没有任何 ESLint 依赖或配置，`pnpm lint` 直接失败；构建还配置为忽略 ESLint。
- **证据（实测）**：`pnpm lint` → `? How would you like to configure ESLint?`，退出码 `1`。
- **证据（源码）**：`package.json` 的 `devDependencies` 无 `eslint`；仓库根无 `eslint.config.*`/`.eslintrc*`；`next.config.ts` 里 `eslint.ignoreDuringBuilds: true`。
- **影响**：`react-hooks/exhaustive-deps`、未使用变量、危险写法都无法在 CI 拦住——这正是 S-13/S-14 这类问题的温床。
- **建议**：补 ESLint + `next/core-web-vitals` + TS 规则，先在 CI 以 warning 运行，清零后转 error。

#### S-16 未读消息徽标不刷新

- **问题**：头部未读数只在组件挂载（或 token 变化）时取一次，之后不再更新。
- **证据（源码）**：`src/components/layout/header.tsx` 的 `useEffect(..., [isAuthenticated, token])`，无轮询、无 `focus`/`visibilitychange` 触发；消息页标记已读后只更新本页 state。
- **影响**：用户读完消息，徽标仍是旧数字；新消息到达也看不到，功能形同装饰。
- **建议**：至少在 `visibilitychange`/路由变化时刷新，或改用 SSE 推送（与 S-20 合并考虑）。

### P2 — 功能补齐

#### S-17 展示 APK 校验值（SHA-256）并支持校验

- **问题**：平台分发 APK，但详情页不提供任何校验值，用户无法验证下载物完整性。
- **证据（源码）**：`AC-interface/src/frameworks/mongo/entities/app.entity.ts` 字段只有 `file_size`、`version`、`original_url` 等，**无 hash 字段**；全仓仅 `app-release.entity.ts`（客户端安装包）与 `media-asset.entity.ts` 有 `sha256`。前端 `src/` 中 `checksum`/`md5` 命中 0。
- **影响**：作为「游戏资源分发平台」，缺少最基本的可信度凭证；无法应对「下载到被篡改包」的质疑。
- **建议**：采集/上传环节计算并落库 SHA-256，详情页展示（可折叠），下载入口旁给「校验说明」。需要 `AC-resource-worker` 配合。
- **决策点**：校验值在哪个环节计算（采集时 / 上传时 / 异步补算存量），是否接受存量包暂时无值。

#### S-18 版本历史与历史版本下载

- **问题**：只有单个 `version` 字段，旧版本被覆盖后无法回溯，用户也无法回退到兼容版本。
- **证据（源码）**：`app.entity.ts` 仅 `version: string`；前端 `version_history|versionHistory` 命中 0。
- **影响**：对「资源分发」场景是硬伤——新版本有兼容问题时用户无路可退，社区会转向第三方站点。
- **建议**：新增版本记录（版本号、文件、大小、校验值、发布时间、渠道、是否可下载），详情页加「历史版本」区块。涉及数据模型与存储成本。
- **决策点**：保留多少个历史版本、是否只保留元数据不保留文件。

#### S-19 我的下载记录

- **问题**：用户无法查看自己下载过什么。
- **证据（源码）**：前端 `download_history|downloadHistory` 命中 0；`AC-interface` 无对应实体。
- **影响**：复访路径缺失，用户回访只能靠搜索；也无法做「更新提醒」这类高价值触达。
- **建议**：记录用户下载（去重、按游戏聚合最近一次），在用户中心加「我的下载」，并与「关注游戏」联动做更新提醒。

#### S-20 通知改为实时/准实时

- **问题**：站内信只在进入消息页时拉取，无推送。
- **证据（源码）**：前端无 `EventSource`/WebSocket；`messages/page.tsx` 仅在挂载与操作后请求；头部徽标见 S-16。
- **影响**：社区互动（回复、点赞、审核结果）无法及时触达，留存受损。
- **建议**：优先做轻量方案（页面可见时轮询 summary + `visibilitychange` 刷新），验证需求后再上 SSE。不建议一上来就引入 WebSocket 基础设施。

#### S-21 下载失败的用户可操作降级

- **问题**：下载失败只回跳 `?download_error=1`，用户不知道原因，也没有替代渠道。
- **证据（源码）**：`src/lib/game-download-redirect.ts` 失败统一 `buildDownloadFailureLocation()` → `/app/{id}?download_error=1`；无镜像/备用渠道概念（`mirror` 命中 0）。
- **影响**：单渠道故障 = 该游戏不可下载，且用户以为是站点坏了。
- **建议**：详情页识别 `download_error` 后给出「换渠道重试 / 反馈失效 / 查看其他版本」，并把失败原因（渠道不可用 vs 资源失效）区分展示。

#### S-22 内容举报与治理入口

- **问题**：用户无法举报违规帖子/评论/资源，只能走「反馈工单」。
- **证据（源码）**：前端无 `report` 相关 UI（`reportDownloadClick` 只是埋点）；`AC-interface` 有 `app-game-quality-report.entity.ts` 但面向游戏质量，不是内容举报。
- **影响**：社区规模一旦上来，治理只能靠人工巡查；也不满足应用分发类站点的合规预期。
- **建议**：帖子/评论/资源增加「举报」入口（原因枚举 + 说明），后台有处理队列与状态回执。

#### S-23 无障碍与基础可用性修补

- **问题**：存在无 `alt` 图片；表单与交互控件缺少统一的可访问性约束。
- **证据（源码扫描）**：`src/**/*.tsx` 共 20 个 `<img>`，其中 4 个无 `alt`。
- **影响**：屏幕阅读器用户无法理解图片内容；也不利于图片搜索与合规审计。
- **建议**：补齐 `alt`（装饰图用空 `alt`），并为交互元素补 `aria-label`；可作为 lint 规则固化。

## 3. 建议实施顺序

1. **先恢复可发布**：S-10、S-12（构建与错误兜底），否则任何修复都发不出去。
2. **再收攻击面**：S-01、S-02、S-04、S-08（配置类，改动小、收益大，可一天内完成）。
3. **然后补防线**：S-03（CSP 观察模式起步）、S-06、S-07。
4. **跨端改造单独排期**：S-05（Cookie 令牌）、S-17/S-18（数据模型）。
5. **最后做体验**：S-13/S-14/S-16/S-19/S-20/S-21/S-22/S-23。

## 4. 已核实安全 / 不建议改动的项（避免误伤）

- **社区帖 Markdown 无 XSS**：`buildRenderedMarkdownDocument` 会把全部原始 HTML 转义为文本（实测 `<script>`、`<img onerror>`、`<svg onload>` 等 10 组输入全部输出为 `&lt;...&gt;`）。不要为此加清洗，会破坏正常内容。
- **下载 302 无开放重定向**：`normalizeIssuedDownloadUrl` 只接受 `http:`/`https:` 绝对地址，其它协议与相对路径一律拒绝；失败回详情页。
- **HSTS 已存在**：生产返回 `strict-transport-security: max-age=31536000`（由 Cloudflare 提供）。若要加 `includeSubDomains`/`preload` 需确认所有子域都强制 HTTPS，属独立决策。
- **无 TODO/FIXME/HACK 遗留**：`src/` 全量扫描为 0，说明代码卫生本身不差，问题集中在配置与架构层。

## 5. 待决策（阻塞后续实施）

1. **令牌方案**：本轮是否接受「跨 Web + Interface + Android」的 Cookie 化改造？若否，是否先只做 CSP + 收紧反代来降低暴露面？
2. **Swagger**：线上 Swagger 是否有人依赖？可否直接在生产关闭？
3. **分发可信度**：S-17（校验值）与 S-18（版本历史）是否纳入本轮？两者都需要后端数据模型与采集侧配合，不是纯前端改动。
