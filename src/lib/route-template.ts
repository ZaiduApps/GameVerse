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
  '/about',
  '/contact',
  '/terms',
  '/privacy-policy',
]);

// 只匹配单段动态路由，与 src/app 下的目录一一对应；多出的段数落进「原样返回」。
const DYNAMIC_ROUTE_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/app\/[^/]+$/, '/app/[id]'],
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
