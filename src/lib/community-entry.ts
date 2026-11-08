/**
 * 社区入口的 URL 与 link_click 属性契约（提案《社区入口改方案提案 2026-11-08》§1.4 / §2 B 档）。
 *
 * 纯函数、不碰 window：Node 测试可直接 import，服务端组件也能用它拼固定话题链接。
 * 归因字段只有一套：entry_action / pkg / from / to / topic_slug，避免每个入口各造一套指标。
 */

export type CommunityEntryAction =
  | 'detail_post_click'
  | 'detail_topic_cta'
  | 'detail_tab'
  | 'topic_announcement_cta'
  | 'topic_post_click';

export interface CommunityEntryParams {
  /** 入口位置，如 detail_section / detail_guide / detail_tab / topic_board。 */
  from: string;
  pkg?: string | null;
  topicSlug?: string | null;
}

/**
 * 包名 → 固定游戏话题 slug。
 *
 * 与 interface 的 `GameTopicSyncService.normalizeTopicSlugFromPkg` 同一规则：
 * 每个游戏在社区里有一个 `type=game` 话题，slug 由包名归一化生成
 * （com.tencent.ig → game-com-tencent-ig）。
 */
export function topicSlugFromPkg(pkg: unknown): string {
  const safe = String(pkg ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, '-')
    .replace(/[._]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '');
  return safe ? `game-${safe}` : '';
}

export function buildGameTopicPath(pkg: unknown): string {
  const slug = topicSlugFromPkg(pkg);
  return slug ? `/community/topic/${encodeURIComponent(slug)}` : '';
}

export function buildCommunityPostPath(postId: unknown): string {
  const id = String(postId ?? '').trim();
  return id ? `/community/post/${encodeURIComponent(id)}` : '';
}

/** 把入口参数拼到落地页 URL 上；空值不落 URL。 */
export function appendCommunityEntryParams(
  href: string,
  params: CommunityEntryParams,
): string {
  if (!href) return href;

  const query = new URLSearchParams();
  const from = String(params.from ?? '').trim();
  const pkg = String(params.pkg ?? '').trim();
  const topicSlug = String(params.topicSlug ?? '').trim();
  if (from) query.set('from', from);
  if (pkg) query.set('pkg', pkg);
  if (topicSlug) query.set('topic_slug', topicSlug);

  const queryString = query.toString();
  if (!queryString) return href;
  return href.includes('?') ? `${href}&${queryString}` : `${href}?${queryString}`;
}

/** 固定游戏话题 URL；包名无法生成 slug 时返回空串，由调用方回落到搜索页。 */
export function buildGameTopicHref(pkg: unknown, params: CommunityEntryParams): string {
  const path = buildGameTopicPath(pkg);
  if (!path) return '';
  return appendCommunityEntryParams(path, {
    from: params.from,
    pkg: String(pkg ?? '').trim(),
    topicSlug: topicSlugFromPkg(pkg),
  });
}

export function buildCommunityPostHref(
  postId: unknown,
  params?: CommunityEntryParams,
): string {
  const path = buildCommunityPostPath(postId);
  if (!path || !params) return path;
  return appendCommunityEntryParams(path, params);
}

export interface CommunityLinkClick {
  entryAction: CommunityEntryAction;
  from: string;
  to: string;
  pkg?: string | null;
  topicSlug?: string | null;
}

/** link_click 的 props；字段名与提案预注册口径一致，空值不落库。 */
export function buildLinkClickProps(click: CommunityLinkClick): Record<string, string> {
  const props: Record<string, string> = {
    entry_action: click.entryAction,
    from: String(click.from ?? '').trim(),
    to: String(click.to ?? '').trim(),
  };

  const pkg = String(click.pkg ?? '').trim();
  if (pkg) props.pkg = pkg;

  const topicSlug = String(click.topicSlug ?? '').trim();
  if (topicSlug) props.topic_slug = topicSlug;

  return props;
}

/**
 * `to` 只取目标路径、去掉 query：同一条目在不同入口下带的 from/pkg 不同，
 * 若把完整 URL 写进 to，审计时会被拆成多个值。
 */
export function toTrackingTarget(href: string): string {
  return String(href ?? '').split(/[?#]/, 1)[0];
}
