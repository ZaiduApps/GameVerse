// 把真实 pathname 归一成稳定的路由模板，供埋点按页面聚合（/app/<pkg> → /app/[id]）。
// 纯函数：不读 window/env，Node 测试可直接 import。

const STATIC_ROUTES = new Set<string>([
  '/',
  '/app',
  '/albums',
  '/community',
  '/community/topics',
  '/news',
  '/rankings',
  '/updates',
  '/download',
  '/download/app',
  '/messages',
  '/profile',
  '/profile/api-keys',
  '/profile/center',
  '/profile/center/downloads',
  '/profile/center/games',
  '/profile/center/posts',
  '/profile/center/reservations',
  '/profile/center/topics',
  '/submit-resource',
  '/help/install',
  '/about',
  '/contact',
  '/terms',
  '/privacy-policy',
]);

// 与 src/app 下的目录一一对应（多数是单段，落地页是两段）；多出的段数落进「原样返回」。
// 下载落地页 `/download/[pkg]/[channelId]`（#179）是两段动态，单独一条；
// `/download`、`/download/app` 是静态路由，先命中 STATIC_ROUTES，不受这条规则影响。
const DYNAMIC_ROUTE_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/app\/[^/]+$/, '/app/[id]'],
  [/^\/download\/[^/]+\/[^/]+$/, '/download/[pkg]/[channelId]'],
  [/^\/albums\/[^/]+$/, '/albums/[id]'],
  [/^\/community\/post\/[^/]+$/, '/community/post/[id]'],
  [/^\/community\/topic\/[^/]+$/, '/community/topic/[idOrSlug]'],
  [/^\/news\/[^/]+$/, '/news/[id]'],
  [/^\/u\/[^/]+$/, '/u/[idOrUsername]'],
];

/** 去掉查询串与尾部斜杠；根路径保留 `/`。 */
function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/, 1)[0];
  if (!withoutQuery.startsWith('/')) return withoutQuery;
  const withoutTrailingSlash = withoutQuery.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

export function resolveRouteTemplate(pathname: string): string {
  const normalized = normalizePathname(pathname);

  if (STATIC_ROUTES.has(normalized)) return normalized;

  for (const [pattern, template] of DYNAMIC_ROUTE_PATTERNS) {
    if (pattern.test(normalized)) return template;
  }

  // 未知路径（含 /internal/**）原样返回归一化后的路径，不猜模板。
  return normalized;
}
