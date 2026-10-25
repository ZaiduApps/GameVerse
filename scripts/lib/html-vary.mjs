/**
 * 详情页 HTML 的 Vary 收口。
 *
 * 背景：Next 的 App Router 会给所有页面响应写
 * `Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch`。
 * 这四个 token 只对 RSC 导航有区分意义，对普通 HTML 请求来说恒定，但 CDN 会按 Vary
 * 切分缓存。上 Cache Rule 之后必须把普通 HTML 的这四个 token 去掉，否则同一个 URL
 * 的 HTML 会被切成多个缓存变体，命中率接近于零。
 *
 * 这里的函数全部是纯函数，交给 `tests/html-vary.test.mjs` 直接覆盖；真正的响应改写
 * 在 `scripts/lib/next-prod-server.mjs`。
 */

/** Next 为 RSC 导航写入的四个 Vary token，比较时大小写不敏感。 */
export const RSC_VARY_TOKENS = Object.freeze([
  'rsc',
  'next-router-state-tree',
  'next-router-prefetch',
  'next-router-segment-prefetch',
]);

const RSC_VARY_TOKEN_SET = new Set(RSC_VARY_TOKENS);

/** `/app/{pkg}` 与 `/app/{pkg}/` 才算详情页；`/app`、`/app/{pkg}/xxx` 不算。 */
export function isGameDetailHtmlRoute(pathname) {
  if (typeof pathname !== 'string') return false;
  return /^\/app\/[^/]+\/?$/.test(pathname);
}

/**
 * 请求是否是 RSC 导航：带 `RSC` 头或带 `?_rsc=` 查询串。
 * 命中时必须原样放行，否则客户端导航会拿到被裁剪过的响应。
 */
export function isRscRequest({ headers = {}, url = '' } = {}) {
  if (headers && headers.rsc !== undefined) return true;
  if (typeof url !== 'string') return false;
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return false;
  try {
    const query = new URLSearchParams(url.slice(queryIndex + 1));
    return query.has('_rsc');
  } catch {
    return /[?&]_rsc=/.test(url);
  }
}

function toTokenList(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toTokenList(item));
  }
  if (value === undefined || value === null) return [];
  return String(value)
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

/**
 * 裁剪 Vary 里的 RSC token，保留 `Accept-Encoding` 等其它值。
 *
 * - 不满足「详情页 HTML + 非 RSC 请求」时**原样返回入参**（含数组、空值、`undefined`），
 *   调用方可以直接用 `next !== current` 判断要不要写回。
 * - `Vary: *` 原样返回 `*`：代表不可缓存，不做任何裁剪。
 * - 全部 token 都是 RSC 时返回 `undefined`，表示应当删除 Vary 头。
 * - 输入允许是逗号分隔字符串或数组（Node 支持 `setHeader('Vary', [...])`）。
 *
 * @param {string | string[] | undefined | null} value
 * @param {{ isHtmlDetailRoute?: boolean, isRscRequest?: boolean }} [options]
 * @returns {string | string[] | undefined | null}
 */
export function sanitizeVaryHeader(value, options = {}) {
  const { isHtmlDetailRoute = false, isRscRequest = false } = options;
  if (!isHtmlDetailRoute || isRscRequest) return value;
  if (value === undefined || value === null) return value;

  const tokens = toTokenList(value);
  if (tokens.length === 0) return value;
  if (tokens.includes('*')) return '*';

  const kept = tokens.filter((token) => !RSC_VARY_TOKEN_SET.has(token.toLowerCase()));
  if (kept.length === tokens.length) return value;
  if (kept.length === 0) return undefined;
  return kept.join(', ');
}

/**
 * 追加一个 Vary token（目前用于给 gzip 响应补回 `Accept-Encoding`）。
 * 已存在同名 token 时原样返回，`Vary: *` 保持不变。
 *
 * @param {string | string[] | undefined | null} value
 * @param {string} token
 * @returns {string | string[] | undefined | null}
 */
export function appendVaryToken(value, token) {
  const want = String(token || '').trim();
  if (!want) return value;
  if (value === undefined || value === null) return want;

  const tokens = toTokenList(value);
  if (tokens.includes('*')) return '*';
  if (tokens.some((item) => item.toLowerCase() === want.toLowerCase())) return value;
  return [...tokens, want].join(', ');
}
