import { resolveRouteTemplate } from '@/lib/route-template';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

/** 站内入口参数。只认 URL 上的值，路由推导出的 pkg/topic_slug 不算入口。 */
const ENTRY_KEYS = ['from', 'pkg', 'topic_slug'] as const;

const SITE_HOST = 'apks.cc';

export type TrafficClass = 'internal_entry' | 'natural_external' | 'unknown';

function readSearchParams(search: string): URLSearchParams | null {
  if (!search) return null;
  try {
    return new URLSearchParams(search);
  } catch {
    return null;
  }
}

function readUtmProps(search: string): Record<string, string> {
  const params = readSearchParams(search);
  const props: Record<string, string> = {};
  if (!params) return props;

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) props[key] = value;
  }
  return props;
}

function readEntryProps(search: string): Record<string, string> {
  const params = readSearchParams(search);
  const props: Record<string, string> = {};
  if (!params) return props;

  for (const key of ENTRY_KEYS) {
    const value = params.get(key);
    if (value) props[key] = value;
  }
  return props;
}

function readRefererHost(referer: string): string {
  const raw = String(referer || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw).hostname.trim().toLowerCase();
  } catch {
    return '';
  }
}

/**
 * 落地页流量归类（提案 §1.4）：
 * - 带站内入口参数 → internal_entry；
 * - 无入口参数但 referer 是 apks.cc 同站 → internal_entry；
 * - 无入口参数、referer 是站外主机 → natural_external；
 * - referer 为空或无法解析 → unknown（绝不冒充自然流量）。
 */
export function resolveTrafficClass(hasEntryParams: boolean, referer: string): TrafficClass {
  if (hasEntryParams) return 'internal_entry';

  const host = readRefererHost(referer);
  if (!host) return 'unknown';
  if (host === SITE_HOST || host.endsWith(`.${SITE_HOST}`)) return 'internal_entry';
  return 'natural_external';
}

/** 取路径末段；解码失败就退回原始段，宁可埋点难看也不抛错。 */
function extractLastSegment(pathname: string): string | undefined {
  const segments = pathname.split(/[?#]/, 1)[0].split('/').filter(Boolean);
  const raw = segments[segments.length - 1];
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw) || undefined;
  } catch {
    return raw;
  }
}

/**
 * 页面浏览事件的属性。抽成纯函数（不碰 window/fetch）是为了让 Node 测试能直接
 * 断言「详情页带 pkg、帖子页带 post_id、入口页带 traffic_class」，也让上报逻辑只剩「发请求」一件事。
 */
export function buildScreenViewProps(
  pathname: string,
  search = '',
  referer = '',
): Record<string, string> {
  const routeTemplate = resolveRouteTemplate(pathname);
  const entryProps = readEntryProps(search);
  const props: Record<string, string> = {
    route_template: routeTemplate,
    path: pathname,
    referer,
    ...readUtmProps(search),
    ...entryProps,
    traffic_class: resolveTrafficClass(Object.keys(entryProps).length > 0, referer),
  };

  if (routeTemplate === '/app/[id]') {
    const pkg = extractLastSegment(pathname);
    if (pkg) props.pkg = pkg;
  }
  // 帖子页带上 post_id：stats.community 按「访客/天/帖子」去重时直接用它，
  // 不必再从 props.path 里反解（旧事件仍按 path 兜底）。
  if (routeTemplate === '/community/post/[id]') {
    const postId = extractLastSegment(pathname);
    if (postId) props.post_id = postId;
  }
  // 话题页即使从旧链接进入（没有 topic_slug 查询参数），也按路径补上 slug。
  if (routeTemplate === '/community/topic/[idOrSlug]' && !props.topic_slug) {
    const topicSlug = extractLastSegment(pathname);
    if (topicSlug) props.topic_slug = topicSlug;
  }

  return props;
}
