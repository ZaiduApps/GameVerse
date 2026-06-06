## Overview

- This repo is a single Next.js 15 app, not a monorepo. App routes live under `src/app`, shared UI under `src/components`, shared fetch/config helpers under `src/lib`, and the only checked-in test is `tests/markdown-render.test.cjs`.
- Treat the backend as external. Server and browser data fetching go through helpers in `src/lib/api.ts`; Next rewrites `/api/:path*` to `API_BASE_URL*` in `next.config.ts`.
- `README.md` is stale boilerplate. Prefer `package.json`, `next.config.ts`, `scripts/next-runner.mjs`, and route files as the source of truth.

## Commands

- Install with `pnpm install`. The custom runtime scripts shell out to `pnpm exec next`, and deploy scripts also assume `pnpm`.
- Run dev server with `pnpm dev`. This loads `.env` through `scripts/next-runner.mjs` and serves on `PORT` or `9002` by default.
- Start production build locally with `pnpm build` then `pnpm start`. `pnpm start` fails unless `.next/BUILD_ID` exists.
- `pnpm lint` currently triggers Next's interactive ESLint setup prompt because no ESLint config is checked in. Treat lint as unavailable until the repo adds a real ESLint config.
- Run typecheck with `pnpm typecheck`.
- Run the only targeted test with `pnpm test:markdown`.
- Preferred verification today is `pnpm typecheck`, then `pnpm test:markdown` when `src/lib/utils.ts` or markdown rendering paths changed. Only add `pnpm lint` after the repo has a non-interactive ESLint config.

## Runtime And Env

- Copy from `.env.example`. Important defaults are `API_BASE_URL_DEV=http://127.0.0.1:9527`, `API_BASE_URL_PROD=https://api.hk.apks.cc`, `NEXT_PUBLIC_API_USE_PROXY=true`, `SITE_CONFIG_KEY=main`, and `HOME_DYNAMIC_COUNT=8`.
- Dev and prod build artifacts are intentionally split: `.next-dev` for `pnpm dev`, `.next` for `pnpm build` and `pnpm start`. This is controlled by `next.config.ts` and `scripts/next-runner.mjs`.
- If dev output gets stale, rerun with `CLEAN_NEXT_DEV_DIST=1 pnpm dev` to delete `.next-dev` first.
- `next.config.ts` currently sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` to `true`. Do not treat a successful `pnpm build` as proof that types or lint are clean; run the explicit commands.
- Browser API calls should usually keep using the `/api` proxy. `NEXT_PUBLIC_API_USE_PROXY=false` switches the browser to direct cross-origin requests.

## Code Map

- `src/app/layout.tsx` is the root shell. It loads the local Noto Sans SC font, fetches public site config on the server, injects site-config-driven head scripts and CSS, and wraps the app with theme and auth providers.
- `src/components/layout/AppShell.tsx` controls page chrome. `/download/app` renders without header/footer, `/app/[id]` hides header/footer on small screens, and all other routes use the standard container layout.
- `src/app/page.tsx` is the main landing page and a good representative SSR entrypoint. It fetches site config plus backend home data, applies SEO filtering, and uses ISR with `revalidate = 120`.
- SEO endpoints are real app surfaces here: `src/app/robots.ts`, `src/app/sitemap.ts`, and the client-side `/api/seo/push` beacon call in `AppShell.tsx`.
- `src/lib/site-config.ts` fetches public site config from `/config/site/public?key=...`. `SITE_CONFIG_KEY` changes behavior across the whole site.
- `src/lib/utils.ts` contains the hand-rolled markdown renderer. If you change it, run `pnpm test:markdown`.

## Testing And Verification

- There is no CI config in the repo and no broader automated test suite checked in beyond `tests/markdown-render.test.cjs`.
- `pnpm test:markdown` is currently red on the checked-in tree: the `defined-image html compatibility` case still expects `alt=""`, but `src/lib/utils.ts` now normalizes missing image alt text to `内容配图`.
- For route or UI work, manual QA matters. Exercise the changed page in the browser because server data, rewrites, and layout branching are route-specific.
- For API-facing changes, verify against the configured backend or a compatible local service on `127.0.0.1:9527`; many pages depend on live responses and will degrade silently if the backend is absent.

## Deployment Notes

- `deploy.sh` does `git pull`, `pnpm install --frozen-lockfile`, `pnpm build`, then `pm2 startOrReload ecosystem.prod.config.js --only game-ve --update-env`.
- `deploy-fast.sh` skips install and only rebuilds and reloads PM2.
- Production PM2 config lives in `ecosystem.prod.config.js` and starts `scripts/next-runner.mjs start` with `PORT=3002` from `/root/home/GameVerse`.
