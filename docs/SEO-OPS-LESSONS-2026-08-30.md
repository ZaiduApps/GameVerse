# SEO 运维经验与生产清理记录

> 记录日期：2026-08-30
> 适用范围：GameVerse、game-hub、AC-interface、Bing/IndexNow

## 结论分级

- `observed`：来自线上 HTTP、PM2、构建输出或实际接口响应。
- `inferred`：根据代码路径、日志和对照实验得出的判断，仍需持续验证。
- `missing evidence`：需要 Bing Webmaster、Search Console 或真实用户数据，不能由本地请求替代。

## 页面索引控制

1. `observed`：合法游戏详情页应返回 `200`、自引用 canonical、`index, follow` 和一个 `<h1>`。
2. `observed`：带筛选参数的 rankings URL 使用 `noindex, nofollow` 并 canonical 到无参数 URL，这是防止重复 URL，不应因 Bing 通用提示而删除。
3. `observed`：非法包名、对象 ID 旧地址、后台、登录、API 和带参数 URL必须通过 404、重定向或 noindex 处理，不能返回旧游戏 HTML。
4. `inferred`：Bing 的“移除 noindex”提示是通用建议，必须结合 URL 意图、canonical 和 sitemap 判断，不能批量执行。

## Meta description 与标题

- `observed`：游戏详情页 description 由真实游戏字段和版本、包名、更新时间、资源状态、截图等信息组成，目标约 120-160 字并截断到上限。
- `observed`：静态页后台配置可能为空或过短，必须使用页面语义兜底；不能只检查默认文案，因为后台值会覆盖默认值。
- `inferred`：长度是诊断信号，不是排名保证。应同时检查唯一性、页面意图和内容相关性。

## H1 与 Hub 页面

- `observed`：桌面/移动重复标题会产生多个 H1，移动标题应降为 H2，详情页最终只保留一个 H1。
- `observed`：hub 页面需要明确 `metadataBase=https://hub.apks.cc`、自引用 canonical、`index, follow` 和 description 兜底。
- `observed`：canonical 路径不要预先 `encodeURIComponent` 后再交给 Next.js，否则空格会变成 `%2520` 双重编码。

## IndexNow 排查顺序

1. `observed`：key 文件内容必须与 `SEO_INDEXNOW_KEY` 完全一致；检查长度、字节数、尾随换行和线上 HTTP 响应。
2. `observed`：PM2 不会自动把后来修改的 `.env` 注入已有进程；更新后必须 `set -a; . ./.env; set +a` 再 `pm2 restart ... --update-env`，并用 `pm2 env` 复核。
3. `observed`：IndexNow 接口可能返回 `202 Accepted`；客户端应将 `200` 和 `202` 都视为已接收，不能只接受 `200`。
4. `observed`：旧 key 即使文件可读且内容一致，仍可能被 IndexNow 侧判定为站点未验证并返回 `422 InvalidRequestParameters`。轮换新 key、使用稳定的 keyLocation，并通过真实 `/seo/push` 验证。
5. `missing evidence`：`202` 只表示请求被接收，不证明 Bing 已抓取、收录或排名提升；这些结果要在 Bing Webmaster/Search Console 中观察。

## 部署与磁盘闸门

- `observed`：GameVerse 全量静态构建约 4,867 页，构建期间旧 `.next` 应保持在线，成功后再原子切换。
- `observed`：可用空间低于 5 GB 标记 P1，低于 2 GB 标记 P0 并禁止部署；构建失败时不得切换半成品。
- `observed`：每次部署会同时产生当前 `.next`、新回滚目录和构建缓存，连续部署前必须清理已确认的旧回滚/缓存。
- `inferred`：Next.js `.next/cache` 是可再生缓存，不是运行时回滚产物；清理前仍需确认当前 PM2 使用的是 `.next` 而非该 cache 目录。
- `observed`：清理后必须复核磁盘、PM2 状态、监听端口、API docs 和至少一个核心页面。

## 每日执行清单

1. 只读记录 Git 分支、工作区、PM2、端口、磁盘、构建/回滚目录和错误日志。
2. 抽查游戏详情、静态页、hub 详情/文章、参数页和非法 URL。
3. 记录 status、canonical、robots、description 长度、H1 数量和缓存头。
4. 修改前保留生产 `.env`、`prod.yaml`、PM2 端口和至少一个可用回滚版本。
5. 最小测试、完整构建、原子部署、PM2/HTTP 验证后再提交 IndexNow。
6. 日报区分 `implemented`、`deployed and observable`、`processed by search platform` 和 `outcome observed`。

## 本次生产清理边界

- 允许：已确认的旧 `/tmp/next-backup-*`、旧 GameVerse 回滚目录、GameVerse `.next/cache`、过期包管理器缓存和已轮转的历史日志。
- 禁止：当前 `/root/home/GameVerse/.next`、最新回滚目录、任何 `node_modules`、生产 `.env`、`prod.yaml`、PM2 dump、活动数据库/上传目录。
- 清理后目标：恢复至少 5 GB 可用空间，并再次确认所有 PM2 托管项目和核心端口正常。
