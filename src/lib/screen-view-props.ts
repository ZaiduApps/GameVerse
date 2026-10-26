import { resolveRouteTemplate } from '@/lib/route-template';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

function readUtmProps(search: string): Record<string, string> {
  const props: Record<string, string> = {};
  if (!search) return props;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return props;
  }

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) props[key] = value;
  }
  return props;
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
 * 断言「详情页带 pkg、帖子页带 post_id」，也让上报逻辑只剩「发请求」一件事。
 */
export function buildScreenViewProps(
  pathname: string,
  search = '',
  referer = '',
): Record<string, string> {
  const routeTemplate = resolveRouteTemplate(pathname);
  const props: Record<string, string> = {
    route_template: routeTemplate,
    path: pathname,
    referer,
    ...readUtmProps(search),
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

  return props;
}
