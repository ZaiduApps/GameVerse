/**
 * `/api/:path*` 反向代理的入口守卫：把不该对公网暴露的后端模块拦在代理之前。
 *
 * 为什么放在 middleware 而不是 next.config.ts 的 rewrites：
 * 1. rewrites 的 source 只能做路径匹配，无法「先规范化再判断」——`/api/%61dmin`、
 *    `/api//admin`、`/api/x/../admin` 都能绕过纯正则，而 Next 的 rewrite 默认
 *    大小写不敏感、Nest 路由也大小写不敏感，`/API/Admin` 同样能打到后端。
 * 2. 拒绝清单要按段匹配（任意层级），并且要保留 `/content/admin/*` 这条社区版主
 *    在用的合法内容管理接口，path-to-regexp 表达不了这种「任意层级 + 精确豁免」。
 *
 * 匹配口径：`/api` 之后的**任意一段**命中拒绝名单即拒绝；`/content/admin` 开头的
 * 路径先豁免（社区版主接口）。规范化 = 反斜杠转 `/`、最多两次百分号解码、折叠空段、
 * 消解 `.`/`..`、全小写。解码失败（畸形百分号编码）一律按拒绝处理。
 */

/** 后端管理/基础设施模块，不得经本站 /api 代理出公网。 */
export const DENIED_API_SEGMENTS = [
  'admin',
  'internal',
  'api-docs',
  'mcp',
  'task-scheduler',
  'logs',
  'resource-update',
  'resource-worker-gateway',
] as const;

/**
 * 合法豁免：社区版主在帖子详情页用 `/api/content/admin/:postId` 做审核操作
 * （src/lib/community-api.ts 的 deleteCommunityPost 等），它属于 content 模块而不是
 * 站点后台，必须继续可用。
 */
export const ALLOWED_API_SEGMENT_PREFIXES: ReadonlyArray<ReadonlyArray<string>> = [
  ['content', 'admin'],
];

const DENIED_SEGMENT_SET = new Set<string>(DENIED_API_SEGMENTS);
const MAX_DECODE_PASSES = 2;

export function decodeApiPathname(pathname: string): string | null {
  let current = String(pathname || '');
  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    let next: string;
    try {
      next = decodeURIComponent(current);
    } catch {
      return null;
    }
    if (next === current) return current;
    current = next;
  }
  return current;
}

/**
 * 返回规范化后的路径段（不含首尾空段），无法安全解码时返回 null。
 * 段保留原始大小写以外的信息已全部小写化，调用方无需再处理大小写。
 */
export function normalizeApiPathSegments(pathname: string): string[] | null {
  const withoutQuery = String(pathname || '').split('#')[0].split('?')[0];
  const decoded = decodeApiPathname(withoutQuery.replace(/\\/g, '/'));
  if (decoded === null) return null;

  const segments: string[] = [];
  for (const rawSegment of decoded.split('/')) {
    if (!rawSegment || rawSegment === '.') continue;
    if (rawSegment === '..') {
      segments.pop();
      continue;
    }
    segments.push(rawSegment.toLowerCase());
  }
  return segments;
}

/** true = 该 /api 路径不得代理，应直接返回 404。 */
export function isDeniedApiPath(pathname: string): boolean {
  const segments = normalizeApiPathSegments(pathname);
  if (!segments) {
    // 解码失败但明显还在 /api 下（如 `/api/admin%zz`），按拒绝处理；
    // 非 /api 路径的解码问题交给下游，不扩大 404 面。
    const rawFirstSegment = String(pathname || '')
      .split('#')[0]
      .split('?')[0]
      .replace(/\\/g, '/')
      .split('/')
      .find(Boolean);
    return String(rawFirstSegment || '').toLowerCase() === 'api';
  }
  if (segments[0] !== 'api') return false;

  const rest = segments.slice(1);
  if (rest.length === 0) return false;

  for (const prefix of ALLOWED_API_SEGMENT_PREFIXES) {
    if (prefix.every((segment, index) => rest[index] === segment)) return false;
  }

  return rest.some((segment) => DENIED_SEGMENT_SET.has(segment));
}
