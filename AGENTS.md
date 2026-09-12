## Package Manager

- Use `pnpm` as the only package manager. `package-lock.json` is intentionally removed; do not reintroduce npm or yarn lockfiles.
- Install with `pnpm install` / `pnpm install --frozen-lockfile`. Deploy scripts assume pnpm.

## Overview

- This repo is a single Next.js 15 app, not a monorepo. App routes live under `src/app`, shared UI under `src/components`, shared fetch/config helpers under `src/lib`, and the only checked-in test is `tests/markdown-render.test.cjs`.
- Treat the backend as external. Server and browser data fetching go through helpers in `src/lib/api.ts`; Next rewrites `/api/:path*` to `API_BASE_URL*` in `next.config.ts`.
- `README.md` is stale boilerplate. Prefer `package.json`, `next.config.ts`, `scripts/next-runner.mjs`, and route files as the source of truth.

## Commands

- Install with `pnpm install`. The custom runtime scripts shell out to `pnpm exec next`, and deploy scripts also assume `pnpm`.
- Run dev server with `pnpm dev`. This loads `.env` through `scripts/next-runner.mjs` and serves on `PORT` (default `9002` if unset; local `.env` sets `PORT=3002` to match production, so dev runs on `3002`).
- Start production build locally with `pnpm build` then `pnpm start`. `pnpm start` fails unless `.next/BUILD_ID` exists.
- `pnpm lint` currently triggers Next's interactive ESLint setup prompt because no ESLint config is checked in. Treat lint as unavailable until the repo adds a real ESLint config.
- Run typecheck with `pnpm typecheck`.
- Run the targeted tests with `pnpm test:markdown` (44 cases) and `pnpm test:seo-runner` (9 cases); both pass on the checked-in tree.
- Run `pnpm assert:build-env` right after `pnpm build`. It fails when a `NEXT_PUBLIC_` key defined in `.env.production` was not inlined into `.next/static/**/*.js`, or when `NEXT_PUBLIC_API_USE_PROXY=false` and the production API base URL is missing from the client bundle. The production release script runs it automatically for this repo.
- Preferred verification today is `pnpm typecheck`, then `pnpm test:markdown` when `src/lib/utils.ts` or markdown rendering paths changed. Only add `pnpm lint` after the repo has a non-interactive ESLint config.

## Runtime And Env

- Copy from `.env.example`. Important defaults are `API_BASE_URL_DEV=http://127.0.0.1:9527`, `API_BASE_URL_PROD=https://api.hk.apks.cc`, `NEXT_PUBLIC_API_USE_PROXY=true`, `SITE_CONFIG_KEY=main`, and `HOME_DYNAMIC_COUNT=8`.
- Dev and prod build artifacts are intentionally split: `.next-dev` for `pnpm dev`, `.next` for `pnpm build` and `pnpm start`. This is controlled by `next.config.ts` and `scripts/next-runner.mjs`.
- If dev output gets stale, rerun with `CLEAN_NEXT_DEV_DIST=1 pnpm dev` to delete `.next-dev` first.
- `next.config.ts` currently sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` to `true`. Do not treat a successful `pnpm build` as proof that types or lint are clean; run the explicit commands.
- Browser API calls should usually keep using the `/api` proxy. `NEXT_PUBLIC_API_USE_PROXY=false` switches the browser to direct cross-origin requests.
- `.env.production` is checked in on purpose (public values only, never secrets) and pins the production build. `next build` reads `.env.production`, while `pnpm dev` keeps using `.env`, so local development is unaffected.
- Production is built on the release machine and only `.next` is uploaded; `NEXT_PUBLIC_*` is inlined at build time, so a wrong build-time value cannot be repaired by editing the server `.env`. Keep `.env.production` in sync with `/root/home/GameVerse/.env` on `hk.apk` (verified identical for all shared keys on 2026-09-11).

## Code Map

- `src/app/layout.tsx` is the root shell. It uses the system Chinese font stack, fetches public site config on the server, injects site-config-driven head scripts and CSS, and wraps the app with theme and auth providers.
- `src/components/layout/AppShell.tsx` controls page chrome. `/download/app` renders without header/footer, `/app/[id]` hides header/footer on small screens, and all other routes use the standard container layout. On `/app/[id]` the desktop `Header` sits inside a `sticky top-0 z-50 hidden lg:block` wrapper, and the `sticky` must stay on that wrapper: it is the containing block, so a `sticky` on `<Header>` alone only pins within the wrapper's own 64px and the header scrolls away.
- `src/app/page.tsx` is the main landing page and a good representative SSR entrypoint. It fetches site config plus backend home data, applies SEO filtering, and uses ISR with `revalidate = 120`.
- SEO endpoints are real app surfaces here: `src/app/robots.ts`, `src/app/sitemap.ts`, and the client-side `/api/seo/push` beacon call in `AppShell.tsx`.
- `src/lib/site-config.ts` fetches public site config from `/config/site/public?key=...`. `SITE_CONFIG_KEY` changes behavior across the whole site.
- `src/lib/utils.ts` contains the hand-rolled markdown renderer. If you change it, run `pnpm test:markdown`.

## Visual System

- 图标统一使用已内置的 `lucide-react`（package.json 依赖 ^0.475.0），不要再引入第二个图标库；标题/按钮里的图标一律放在文字前面，禁用 emoji 或 “★▲” 之类符号字符充当图标。
- 色彩走 `src/app/globals.css` 里的 `--tone-{blue,red,green,amber,violet,cyan,pink}` 语义色板（`tailwind.config.ts` 映射为 `tone-*`），只用于分类、标签、色条、图标等小面积元素；页面底色、卡片和标题保持中性色，避免大面积彩色渐变与文字渐变。详情页是受控例外：`src/app/app/[id]/*` 按视觉稿走 `--primary` 强调色，PC 端是站点橙，移动端在 `.game-detail-stitch` 作用域内被 `globals.css` 的 `max-width: 1023.98px` 媒体查询覆写成青绿（视觉稿两端主色不一致，移动端以青绿为准），改详情页配色时两端一起看。
- 卡片用 `rounded-xl`/`rounded-2xl` + `border-border/60` + `shadow-sm`；不要恢复任意圆角（如 rounded-[1.75rem]）、大投影（如 shadow-[0_24px_60px_...]）或 hover:-translate-y-* / hover:scale-* 上浮动效。
- 正文 markdown 排版集中在 `src/lib/utils.ts` 的 `detail` preset：标题用字号+字重+`border-b border-border`，列表用 `list-disc`，引用用左侧描边，不要加彩色底板或伪元素色条。
- 帖子详情页会把正文里与标题重复的首个 `#` 标题降级成普通块（`renderFirstHeadingMatchingTextAsPlainBlock` 命中后改用 `demotedHeading` 样式）：它必须明显弱于页面 `<h1>`，否则视觉上仍是两个标题；改动详情页标题字号或 `demotedHeading` 时两边一起看。
- 帖子详情页正文图片按 markdown 原文位置渲染（`src/lib/utils.ts` 的 `detail` preset 已给正文 `img` 统一圆角与尺寸上限）：不要重新加 `[&_img]:hidden` 把正文图藏起来，也不要再加底部图集区块重复渲染一遍；正文图点击放大（灯箱）是图片唯一的查看入口，由 `CommunityPostDetailView.tsx` 的 `handleMarkdownContainerClick` + `openPreviewImage` 提供，需要保留。

## Testing And Verification

- There is no CI config in the repo; the checked-in suites run through `package.json` scripts: `pnpm test:markdown` (markdown + community helpers, 44/44), `pnpm test:game-detail` (detail-page boundary assertions + image preview, 18/18) and `pnpm test:seo-runner` (SEO write / indexnow / deploy-fast boundaries, 9/9). `production-release.ps1` itself gates on `typecheck`, `test:markdown`, `test:seo-runner`, `build` and `assert:build-env`; for detail-page work also run `pnpm test:game-detail`.
- `pnpm test:markdown` covers `src/lib/utils.ts` and is green on the checked-in tree (44/44); the earlier `defined-image html compatibility` mismatch (odd `alt` vs `内容配图`) is fixed.
- For route or UI work, manual QA matters. Exercise the changed page in the browser because server data, rewrites, and layout branching are route-specific.
- For API-facing changes, verify against the configured backend or a compatible local service on `127.0.0.1:9527`; many pages depend on live responses and will degrade silently if the backend is absent.

## Deployment Notes

- `deploy.sh` does `git pull`, `pnpm install --frozen-lockfile`, `pnpm build`, then `pm2 startOrReload ecosystem.prod.config.js --only game-ve --update-env`.
- `deploy-fast.sh` skips install and only rebuilds and reloads PM2.
- Production PM2 config lives in `ecosystem.prod.config.js` and starts `scripts/next-runner.mjs start` with `PORT=3002` from `/root/home/GameVerse`.
- The current release entry point is `../AC-interface/scripts/production-release.ps1 -Components gameverse` (or `interface,gameverse`): it runs typecheck, `test:markdown`, `test:seo-runner`, `pnpm build`, `pnpm assert:build-env`, then packages `.next` (excluding `.next/cache`) and swaps it on the server. The server never builds.
- `deploy.sh` / `deploy-fast.sh` are the legacy in-place path and build on the server; the current flow does not use them.
