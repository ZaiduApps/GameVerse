import { trackedApiFetch, type TrackedFetchInit } from '@/lib/api';
import { buildTrackingHeaders } from '@/lib/tracking-headers';
import type { CommunityPost } from '@/types';

const FALLBACK_AVATAR = '/favicon.ico';
const MONGO_OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export interface CommunityTopicItem {
  _id: string;
  name: string;
  slug: string;
  type?: 'event' | 'game' | 'general';
  is_official?: boolean;
  app_id?: null | string;
  description?: string;
  icon?: string;
  cover?: string;
  status?: 'active' | 'disabled';
  post_count?: number;
  followers_count?: number;
  heat_score?: number;
  last_post_at?: null | string;
  last_activity_at?: null | string;
  is_locked?: boolean;
  is_recommended?: boolean;
  announcement?: string;
  pinned_post_id?: null | string;
  moderator_ids?: string[];
  moderator_infos?: Array<{
    _id: string;
    username?: string;
    name?: string;
    avatar?: string;
  }>;
  app_info?: {
    _id?: string;
    name?: string;
    pkg?: string;
    icon?: string;
    summary?: string;
  } | null;
}

export interface ApiCommunityPost {
  _id?: string;
  author_id?: string;
  author_type?: string;
  author_username?: string;
  title?: string;
  summary?: string;
  content?: string;
  cover?: string;
  display_cover?: string;
  media_urls?: string[];
  preview_images?: string[];
  source?: string;
  author_name?: string;
  author_avatar?: string;
  like_count?: number;
  dislike_count?: number;
  comment_count?: number;
  view_count?: number;
  publish_at?: string;
  last_commented_at?: string;
  created_at?: string;
  updated_at?: string;
  app_info?: {
    _id?: string;
    name?: string;
    pkg?: string;
    icon?: string;
    summary?: string;
    metadata?: {
      region?: string;
    };
    tag_names?: string[];
  } | null;
  topic_info?: {
    _id?: string;
    name?: string;
  } | null;
  topic_infos?: Array<{
    _id?: string;
    name?: string;
    slug?: string;
  }>;
  topic_id?: string;
  topic_ids?: string[];
  is_top?: boolean;
  is_recommended?: boolean;
  heat_score?: number;
  view_sources?: Record<string, number>;
  link_click_count?: number;
  link_clicks?: Record<string, number>;
  link_click_stats?: Array<{
    click_key?: string;
    count?: number;
    host?: string;
    url?: string;
  }>;
  link_previews?: Array<{
    url?: string;
    title?: string;
    description?: string;
    image?: string;
    icon?: string;
    site_name?: string;
  }>;
}

export interface ApiCommunityComment {
  _id?: string;
  user_id?: string;
  user_username?: string;
  user_name?: string;
  user_avatar?: string;
  content?: string;
  created_at?: string;
  like_count?: number;
  replies?: ApiCommunityComment[];
  reply_to_user_name?: string;
  reply_total?: number;
  reply_has_more?: boolean;
  reply_page_size?: number;
}

export interface CommunityCommentItem {
  id: string;
  user: {
    id?: string;
    username?: string;
    name: string;
    avatarUrl: string;
    dataAiHint?: string;
    profileHref?: string;
  };
  timestamp: string;
  createdAt?: string;
  text: string;
  likeCount: number;
}

export interface CommunityCommentThread extends CommunityCommentItem {
  replies: CommunityCommentItem[];
  replyTotal: number;
  replyHasMore: boolean;
  replyPageSize: number;
}

interface CreateCommunityPostParams {
  token: string;
  title?: string;
  content: string;
  summary?: string;
  appId?: string;
  source?: string;
  topicIds?: string[];
  topicNames?: string[];
}

interface UpdateCommunityPostParams extends CreateCommunityPostParams {
  postId: string;
}

interface TopicListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: 'activity' | 'hot' | 'manual' | 'new';
  appId?: string;
  type?: 'event' | 'game' | 'general';
  isOfficial?: boolean;
}

export interface CommunityReadFetchOptions {
  cache?: TrackedFetchInit['cache'];
  next?: TrackedFetchInit['next'];
  timeoutMs?: number;
  retries?: number;
  logKey?: string;
  warnStatuses?: number[];
}

interface TopicFollowResult {
  followed: boolean;
  topic_id: string;
  followers_count: number;
}

export interface ModeratorTopicPatch {
  announcement?: string;
  is_locked?: boolean;
  is_recommended?: boolean;
  pinned_post_id?: string | null;
}

const COMMUNITY_READ_TIMEOUT_MS = 12000;
const COMMUNITY_READ_RETRIES = 1;
const COMMUNITY_FEED_REVALIDATE_SECONDS = 120;
const COMMUNITY_TOPIC_REVALIDATE_SECONDS = 180;
const SEARCH_ENGINE_HOST_PATTERN =
  /(^|\.)((google|bing|baidu|sogou|yahoo)\.[a-z0-9.-]+|so\.com|360\.cn)$/i;

function isSafePublicHttpUrl(value: string): boolean {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url) || /%(?![0-9a-fA-F]{2})/.test(url)) return false;
  try {
    decodeURI(url);
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseApiResponseMessage(json: any, fallback: string) {
  const message = String(json?.message || '').trim();
  return message || fallback;
}

function normalizeTopicItem(input: CommunityTopicItem | null | undefined): CommunityTopicItem {
  const item = input || ({} as CommunityTopicItem);
  return {
    ...item,
    _id: String(item._id || '').trim(),
    name: String(item.name || '').trim(),
    slug: String(item.slug || '').trim(),
    is_official: Boolean(item.is_official),
  };
}

function formatTimestamp(value?: string): string {
  if (!value) return '刚刚';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

export function resolveCommunityPostViewSource(referrer?: string): 'direct' | 'referral' | 'search' {
  const raw = String(referrer || '').trim();
  if (!raw) return 'direct';
  try {
    const host = new URL(raw).hostname.trim().toLowerCase();
    if (SEARCH_ENGINE_HOST_PATTERN.test(host)) return 'search';
    return 'referral';
  } catch {
    return /google|bing|baidu|sogou|so\.com|yahoo|360\.cn/i.test(raw)
      ? 'search'
      : 'referral';
  }
}

function normalizeRawTimestamp(value?: string): string | undefined {
  const normalized = String(value || '').trim();
  if (!normalized) return undefined;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;
  const year = date.getUTCFullYear();
  if (year < 2005 || year > 2100) return undefined;
  return date.toISOString();
}

function normalizePlainText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/!\[([^\]]*)\]\((?:[^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, '$1')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/\b(?:https?|acbox|uu-mobile):\/\/[^\s<>"')\]]+/gi, ' ')
    .replace(/^>+\s?/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^---+$/gm, ' ')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/<\/?(?:p|div|section|article|blockquote|li|ul|ol|h[1-6]|span|strong|em|code|pre)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripCommunityMarkdownCodeSegments(text: string): string {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, '\n')
    .replace(/`[^`]*`/g, ' ');
}

function extractSummary(
  summaryInput?: string,
  contentInput?: string,
  maxLength = 160,
): string {
  const preferred = normalizePlainText(String(summaryInput || ''));
  const fallback = normalizePlainText(String(contentInput || ''));
  const source = preferred || fallback || '暂无内容';
  return source.length > maxLength ? `${source.slice(0, maxLength)}...` : source;
}

function extractFirstImageFromText(text: string): string | undefined {
  const searchableText = stripCommunityMarkdownCodeSegments(text);
  const markdownMatch = searchableText.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+[^)]*)?\)/i);
  if (markdownMatch?.[1]) return markdownMatch[1];
  const htmlMatch = searchableText.match(/<img[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
  if (htmlMatch?.[1]) return htmlMatch[1];
  return undefined;
}

export function toCommunityPost(item: ApiCommunityPost): CommunityPost {
  const rawContent = String(item.content || '').trim();
  const rawSummary = String(item.summary || '').trim();
  const content = rawContent || rawSummary || '暂无内容';
  const summary = extractSummary(rawSummary, rawContent);
  const firstImage = (item.display_cover || item.cover || item.media_urls?.[0] || extractFirstImageFromText(rawContent)) || undefined;
  const previewImages = Array.isArray(item.preview_images) && item.preview_images.length > 0
    ? item.preview_images.slice(0, 9)
    : Array.isArray(item.media_urls) && item.media_urls.length > 0
      ? item.media_urls.slice(0, 9)
      : firstImage ? [firstImage] : [];
  const topicNames = [
    item.topic_info?.name,
    ...((item.topic_infos || []).map((topic) => topic?.name) || []),
  ]
    .map((topic) => String(topic || '').trim())
    .filter(Boolean);
  const tags = [
    ...topicNames,
    ...(item.app_info?.tag_names || []),
  ].filter((tag): tag is string => Boolean(tag && tag.trim()));
  const uniqueTags = Array.from(new Set(tags));
  const topicIds = Array.from(
    new Set(
      [
        item.topic_info?._id,
        item.topic_id,
        ...(Array.isArray(item.topic_ids) ? item.topic_ids : []),
        ...((item.topic_infos || []).map((topic) => topic?._id) || []),
      ]
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  );
  const uniqueTopicNames = Array.from(new Set(topicNames));

  const rawTimestamp = normalizeRawTimestamp(
    item.last_commented_at || item.publish_at || item.created_at,
  );
  const updatedAt = normalizeRawTimestamp(item.updated_at);
  const authorProfileTarget = String(item.author_username || item.author_id || '').trim();
  return {
    id: String(item._id || ''),
    authorId: String(item.author_id || '').trim() || undefined,
    authorType: String(item.author_type || '').trim() || undefined,
    authorUsername: String(item.author_username || '').trim() || undefined,
    user: {
      name: item.author_name?.trim() || '匿名用户',
      avatarUrl: item.author_avatar?.trim() || FALLBACK_AVATAR,
      dataAiHint: 'user avatar',
      profileHref: authorProfileTarget ? `/u/${encodeURIComponent(authorProfileTarget)}` : undefined,
    },
    timestamp: formatTimestamp(
      item.last_commented_at || item.publish_at || item.created_at,
    ),
    rawTimestamp,
    updatedAt,
    source: item.source?.trim() || undefined,
    title: item.title?.trim() || undefined,
    summary,
    content,
    imageUrl: firstImage,
    imageAiHint: firstImage ? 'community post image' : undefined,
    previewImages,
    tags: uniqueTags.slice(0, 4),
    topicIds,
    topicNames: uniqueTopicNames,
    category: topicNames[0] || item.app_info?.name || '社区',
    commentsCount: Number(item.comment_count || 0),
    likesCount: Number(item.like_count || 0),
    dislikesCount: Number(item.dislike_count || 0),
    viewsCount: Number(item.view_count || 0),
    heatScore: Number(item.heat_score || 0),
    viewSources: item.view_sources || undefined,
    linkClickCount: Number(item.link_click_count || 0),
    linkClicks: item.link_clicks || undefined,
    linkClickStats: Array.isArray(item.link_click_stats)
      ? item.link_click_stats
          .map((stat) => ({
            click_key: String(stat?.click_key || '').trim(),
            count: Number(stat?.count || 0),
            host: String(stat?.host || '').trim() || undefined,
            url: String(stat?.url || '').trim() || undefined,
          }))
          .filter((stat) => stat.click_key && stat.count > 0)
          .slice(0, 10)
      : undefined,
    linkPreviews: Array.isArray(item.link_previews)
      ? item.link_previews
          .map((preview) => ({
            url: String(preview?.url || '').trim(),
            title: String(preview?.title || '').trim() || undefined,
            description: String(preview?.description || '').trim() || undefined,
            image: String(preview?.image || '').trim() || undefined,
            icon: String(preview?.icon || '').trim() || undefined,
            site_name: String(preview?.site_name || '').trim() || undefined,
          }))
          .filter((preview) => isSafePublicHttpUrl(preview.url))
          .slice(0, 5)
      : [],
    isTop: Boolean(item.is_top),
    isRecommended: Boolean(item.is_recommended),
    relatedApp: item.app_info?.name
      ? {
          id: item.app_info._id,
          name: item.app_info.name,
          pkg: item.app_info.pkg,
          icon: item.app_info.icon,
          summary: item.app_info.summary,
          regionTag: item.app_info.metadata?.region,
          tags: (item.app_info.tag_names || []).slice(0, 3),
        }
      : undefined,
  };
}

export function toPostComments(list: ApiCommunityComment[]): Array<{
  id: string;
  user: { name: string; avatarUrl: string; dataAiHint?: string };
  timestamp: string;
  text: string;
}> {
  const result: Array<{
    id: string;
    user: { name: string; avatarUrl: string; dataAiHint?: string };
    timestamp: string;
    text: string;
  }> = [];

  list.forEach((root) => {
    const rootUser = root.user_name?.trim() || '匿名用户';
    result.push({
      id: String(root._id || `c-${result.length + 1}`),
      user: {
        name: rootUser,
        avatarUrl: root.user_avatar?.trim() || FALLBACK_AVATAR,
        dataAiHint: 'user avatar',
      },
      timestamp: formatTimestamp(root.created_at),
      text: root.content?.trim() || '',
    });

    (root.replies || []).forEach((reply) => {
      const replyUser = reply.user_name?.trim() || '匿名用户';
      const replyTo = reply.reply_to_user_name?.trim();
      result.push({
        id: String(reply._id || `c-${result.length + 1}`),
        user: {
          name: replyUser,
          avatarUrl: reply.user_avatar?.trim() || FALLBACK_AVATAR,
          dataAiHint: 'user avatar',
        },
        timestamp: formatTimestamp(reply.created_at),
        text: `${replyTo ? `回复 @${replyTo}: ` : ''}${reply.content?.trim() || ''}`,
      });
    });
  });

  return result;
}

function toCommentItem(input: ApiCommunityComment): CommunityCommentItem {
  const userId = String(input.user_id || '').trim();
  const username = String(input.user_username || '').trim();
  const profileTarget = username || (MONGO_OBJECT_ID_PATTERN.test(userId) ? userId : '');
  return {
    id: String(input._id || ''),
    user: {
      id: userId || undefined,
      username: username || undefined,
      name: input.user_name?.trim() || '匿名用户',
      avatarUrl: input.user_avatar?.trim() || FALLBACK_AVATAR,
      dataAiHint: 'user avatar',
      profileHref: profileTarget ? `/u/${encodeURIComponent(profileTarget)}` : undefined,
    },
    timestamp: formatTimestamp(input.created_at),
    createdAt: normalizeRawTimestamp(input.created_at),
    text: input.content?.trim() || '',
    likeCount: Number(input.like_count || 0),
  };
}

function toThreadReplyItem(reply: ApiCommunityComment): CommunityCommentItem {
  const item = toCommentItem(reply);
  const replyTo = reply.reply_to_user_name?.trim();
  return {
    ...item,
    text: `${replyTo ? `回复 @${replyTo}: ` : ''}${item.text}`,
  };
}

export function toCommentThreads(list: ApiCommunityComment[]): CommunityCommentThread[] {
  return (list || []).map((root) => {
    const rootItem = toCommentItem(root);
    const replies = (root.replies || []).map(toThreadReplyItem);
    const replyTotal = Math.max(
      Number(root.reply_total ?? replies.length),
      replies.length,
    );
    const replyPageSize = Math.max(
      1,
      Number(root.reply_page_size || replies.length || 20),
    );
    const replyHasMore =
      typeof root.reply_has_more === 'boolean'
        ? root.reply_has_more
        : replyTotal > replies.length;
    return {
      ...rootItem,
      replies,
      replyTotal,
      replyHasMore,
      replyPageSize,
    };
  });
}

function isTimeoutLikeError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: unknown }).name || '') : '';
  const message = error instanceof Error ? error.message : String(error);
  return name === 'TimeoutError' || /timeout/i.test(message);
}

function resolveCommunityReadFetchOptions(
  fetchOptions: CommunityReadFetchOptions | undefined,
  defaults?: Partial<CommunityReadFetchOptions>,
): Required<Pick<CommunityReadFetchOptions, 'cache' | 'timeoutMs' | 'retries' | 'logKey'>> &
  Pick<CommunityReadFetchOptions, 'next' | 'warnStatuses'> {
  const isServer = typeof window === 'undefined';
  const cache =
    fetchOptions?.cache ??
    defaults?.cache ??
    (isServer ? 'force-cache' : 'no-store');
  const next =
    fetchOptions?.next ??
    defaults?.next ??
    (isServer ? { revalidate: COMMUNITY_FEED_REVALIDATE_SECONDS } : undefined);
  const timeoutMs =
    Number(fetchOptions?.timeoutMs ?? defaults?.timeoutMs ?? COMMUNITY_READ_TIMEOUT_MS);
  const retries =
    Number(fetchOptions?.retries ?? defaults?.retries ?? COMMUNITY_READ_RETRIES);
  const logKey = String(fetchOptions?.logKey || defaults?.logKey || 'community-api').trim();
  const warnStatuses = Array.from(
    new Set([
      ...(Array.isArray(defaults?.warnStatuses) ? defaults!.warnStatuses : []),
      ...(Array.isArray(fetchOptions?.warnStatuses) ? fetchOptions!.warnStatuses : []),
    ]),
  ).filter((status) => Number.isInteger(status) && status >= 100 && status <= 599);

  return {
    cache,
    next,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : COMMUNITY_READ_TIMEOUT_MS,
    retries: Number.isFinite(retries) && retries >= 0 ? retries : COMMUNITY_READ_RETRIES,
    logKey,
    warnStatuses,
  };
}

async function getApiData<T>(
  path: string,
  fetchOptions?: CommunityReadFetchOptions,
  defaults?: Partial<CommunityReadFetchOptions>,
): Promise<T | null> {
  const resolved = resolveCommunityReadFetchOptions(fetchOptions, defaults);
  const maxAttempts = Math.max(1, resolved.retries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = Date.now();
    try {
      const res = await trackedApiFetch(path, {
        cache: resolved.cache,
        next: resolved.next,
        timeoutMs: resolved.timeoutMs,
      });
      const durationMs = Date.now() - startedAt;

      if (!res.ok) {
        const logPayload = {
          path,
          attempt,
          maxAttempts,
          status: res.status,
          statusText: res.statusText,
          durationMs,
        };
        if (resolved.warnStatuses?.includes(res.status)) {
          console.warn(`[${resolved.logKey}] expected non-200 response`, logPayload);
        } else {
          console.error(`[${resolved.logKey}] non-200 response`, logPayload);
        }
        if (attempt < maxAttempts && res.status >= 500) continue;
        return null;
      }

      const json = await res.json().catch(() => null);
      if (!json || json?.code !== 0) {
        console.error(`[${resolved.logKey}] invalid-payload`, {
          path,
          attempt,
          maxAttempts,
          durationMs,
          code: json && typeof json === 'object' ? (json as { code?: unknown }).code ?? null : null,
          message:
            json && typeof json === 'object'
              ? String((json as { message?: unknown }).message || '').trim() || null
              : null,
        });
        if (attempt < maxAttempts) continue;
        return null;
      }

      if (attempt > 1) {
        console.warn(`[${resolved.logKey}] retry-recovered`, {
          path,
          attempt,
          maxAttempts,
          durationMs,
        });
      }

      return (json?.data ?? null) as T | null;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      console.error(`[${resolved.logKey}] request exception`, {
        path,
        attempt,
        maxAttempts,
        durationMs,
        errorType: isTimeoutLikeError(error) ? 'timeout' : 'exception',
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt >= maxAttempts) return null;
    }
  }

  return null;
}

interface CommunityFeedData {
  list?: ApiCommunityPost[];
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
  has_more?: boolean;
  pagination?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
    has_more?: boolean;
  };
}

export interface CommunityFeedResult {
  list: CommunityPost[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getCommunityFeed(
  sort: 'latest' | 'hot',
  options?: {
    page?: number;
    pageSize?: number;
    q?: string;
    topicId?: string;
  },
  fetchOptions?: CommunityReadFetchOptions,
): Promise<CommunityFeedResult> {
  const page = Math.max(1, Number(options?.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(options?.pageSize || 20)));
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort,
    view: 'card',
  });
  const topicId = String(options?.topicId || '').trim();
  const keyword = String(options?.q || '').trim();
  if (topicId) query.set('topic_id', topicId);
  if (keyword) query.set('q', keyword);
  const data = await getApiData<CommunityFeedData>(
    `/content/feed?${query.toString()}`,
    fetchOptions,
    { logKey: 'community-feed', next: { revalidate: COMMUNITY_FEED_REVALIDATE_SECONDS } },
  );
  const pagination = data?.pagination || {};
  const rawList = Array.isArray(data?.list) ? data.list : [];
  const list = rawList.map(toCommunityPost).filter((item) => Boolean(item.id));
  const total = Number(
    data?.total ??
      (data as any)?.total_count ??
      pagination.total ??
      0,
  );
  const rawCurrentPage = Number(
    data?.page ??
      (data as any)?.current ??
      (data as any)?.pageNo ??
      (data as any)?.page_num ??
      pagination.page ??
      page,
  );
  const rawCurrentPageSize = Number(
    data?.pageSize ??
      (data as any)?.size ??
      (data as any)?.limit ??
      pagination.pageSize ??
      pageSize,
  );
  const currentPage = (() => {
    if (!Number.isFinite(rawCurrentPage) || rawCurrentPage < 0) return page;
    if (rawCurrentPage === 0 && page >= 1) return 1;
    if (rawCurrentPage === page - 1 && page > 1) return page;
    return rawCurrentPage;
  })();
  const currentPageSize =
    Number.isFinite(rawCurrentPageSize) && rawCurrentPageSize > 0
      ? rawCurrentPageSize
      : pageSize;
  const hasMoreByFlag =
    typeof data?.hasMore === 'boolean'
      ? data.hasMore
      : typeof data?.has_more === 'boolean'
        ? data.has_more
        : typeof pagination.hasMore === 'boolean'
          ? pagination.hasMore
          : typeof pagination.has_more === 'boolean'
            ? pagination.has_more
            : undefined;
  const hasMoreByTotal =
    total > 0 ? currentPage * currentPageSize < total : list.length >= currentPageSize;

  return {
    list,
    total: Number.isFinite(total) ? Math.max(0, total) : 0,
    page: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : page,
    pageSize:
      Number.isFinite(currentPageSize) && currentPageSize > 0
        ? currentPageSize
        : pageSize,
    hasMore: typeof hasMoreByFlag === 'boolean' ? hasMoreByFlag : hasMoreByTotal,
  };
}

interface GetCommunityPostsByGameOptions {
  sort: 'latest' | 'hot';
  pageSize?: number;
  appId?: string;
  pkg?: string;
  gameName?: string;
}

const matchesRelatedGame = (
  post: CommunityPost,
  options: Pick<GetCommunityPostsByGameOptions, 'appId' | 'pkg' | 'gameName'>,
): boolean => {
  const postAppId = post.relatedApp?.id?.trim().toLowerCase();
  const postPkg = post.relatedApp?.pkg?.trim().toLowerCase();
  const optionAppId = options.appId?.trim().toLowerCase();
  const optionPkg = options.pkg?.trim().toLowerCase();
  const optionName = options.gameName?.trim().toLowerCase();

  if (optionAppId && postAppId && postAppId === optionAppId) return true;
  if (optionPkg && postPkg && postPkg === optionPkg) return true;

  if (optionName) {
    const title = (post.title || '').toLowerCase();
    const content = (post.content || '').toLowerCase();
    const relatedName = (post.relatedApp?.name || '').toLowerCase();
    if (relatedName.includes(optionName) || title.includes(optionName) || content.includes(optionName)) {
      return true;
    }
  }

  return false;
};

function isSeoSafeRelatedPost(post: CommunityPost): boolean {
  const title = String(post.title || '').trim();
  const summary = String(post.summary || '').trim();
  const content = String(post.content || '').trim();
  const combined = [title, summary, content].filter(Boolean).join(' ');

  if (!post.id || !title || !combined) return false;
  if (!post.rawTimestamp) return false;
  if (/测试|測試|开发中|開發中|beta|demo|smoke|feedback|反馈/i.test(combined)) {
    return false;
  }
  if (/^https?:\/\//i.test(combined)) return false;
  if (/(.)\1{5,}/.test(combined)) return false;
  return true;
}

async function fetchCommunityFeedByQuery(
  query: URLSearchParams,
): Promise<ApiCommunityPost[]> {
  const data = await getApiData<{ list?: ApiCommunityPost[] }>(
    `/content/feed?${query.toString()}`,
  );
  return data?.list || [];
}

export async function getCommunityPostsByGame(
  options: GetCommunityPostsByGameOptions,
): Promise<CommunityPost[]> {
  const pageSize = options.pageSize ?? 20;
  const baseEntries: Array<[string, string]> = [
    ['page', '1'],
    ['pageSize', String(pageSize)],
    ['sort', options.sort],
    ['view', 'card'],
  ];

  const queryCandidates: URLSearchParams[] = [];
  if (options.pkg) queryCandidates.push(new URLSearchParams([...baseEntries, ['app_pkg', options.pkg]]));
  if (options.appId) queryCandidates.push(new URLSearchParams([...baseEntries, ['app_id', options.appId]]));
  if (options.pkg) queryCandidates.push(new URLSearchParams([...baseEntries, ['pkg', options.pkg]]));
  if (options.gameName) queryCandidates.push(new URLSearchParams([...baseEntries, ['keyword', options.gameName]]));
  queryCandidates.push(new URLSearchParams(baseEntries));

  for (const query of queryCandidates) {
    const rawList = await fetchCommunityFeedByQuery(query);
    if (rawList.length === 0) continue;

    const mapped = rawList.map(toCommunityPost).filter((item) => Boolean(item.id));
    const filtered = mapped.filter(
      (post) => matchesRelatedGame(post, options) && isSeoSafeRelatedPost(post),
    );
    if (filtered.length > 0) return filtered;
  }

  return [];
}

export async function getCommunityPostById(
  id: string,
): Promise<CommunityPost | null> {
  const data = await getApiData<ApiCommunityPost>(`/content/public/${id}`, undefined, {
    logKey: 'community-post',
    warnStatuses: [404],
  });
  if (!data || !data._id) return null;
  return toCommunityPost(data);
}

export async function recordCommunityPostView(params: {
  postId: string;
  referrer?: string;
  source?: string;
}): Promise<{ view_count?: number; heat_score?: number } | null> {
  const postId = String(params.postId || '').trim();
  if (!postId) return null;
  try {
    const res = await trackedApiFetch(`/content/public/${encodeURIComponent(postId)}/view`, {
      method: 'POST',
      headers: {
        ...buildTrackingHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referrer: String(params.referrer || '').trim(),
        source: String(params.source || '').trim() || undefined,
      }),
      cache: 'no-store',
      timeoutMs: 5000,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) return null;
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function recordCommunityPostLinkClick(params: {
  postId: string;
  url: string;
  referrer?: string;
}): Promise<{ link_click_count?: number; heat_score?: number } | null> {
  const postId = String(params.postId || '').trim();
  const url = String(params.url || '').trim();
  if (!postId || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await trackedApiFetch(`/content/public/${encodeURIComponent(postId)}/link-click`, {
      method: 'POST',
      headers: {
        ...buildTrackingHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        referrer: String(params.referrer || '').trim(),
      }),
      cache: 'no-store',
      keepalive: true,
      timeoutMs: 5000,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) return null;
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function getCommunityComments(
  postId: string,
  pageSize = 20,
): Promise<
  Array<{
    id: string;
    user: { name: string; avatarUrl: string; dataAiHint?: string };
    timestamp: string;
    text: string;
  }>
> {
  const query = new URLSearchParams({
    page: '1',
    pageSize: String(pageSize),
    sort: 'latest',
  });
  const data = await getApiData<{ list?: ApiCommunityComment[] }>(
    `/content/public/${postId}/comments?${query.toString()}`,
  );
  return toPostComments(data?.list || []);
}

export async function getCommunityCommentThreads(
  postId: string,
  pageSize = 20,
  replyPageSize = 20,
): Promise<CommunityCommentThread[]> {
  const query = new URLSearchParams({
    page: '1',
    pageSize: String(pageSize),
    replyPageSize: String(replyPageSize),
    sort: 'latest',
  });
  const data = await getApiData<{ list?: ApiCommunityComment[] }>(
    `/content/public/${postId}/comments?${query.toString()}`,
  );
  return toCommentThreads(data?.list || []);
}

export async function getCommunityCommentReplies(
  postId: string,
  rootCommentId: string,
  page = 1,
  pageSize = 20,
  sort: 'latest' | 'hot' = 'latest',
): Promise<{
  rootComment: CommunityCommentItem | null;
  list: CommunityCommentItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const query = new URLSearchParams({
    page: String(Math.max(1, Number(page) || 1)),
    pageSize: String(Math.min(100, Math.max(1, Number(pageSize) || 20))),
    sort,
  });
  const data = await getApiData<{
    root_comment?: ApiCommunityComment | null;
    list?: ApiCommunityComment[];
    total?: number;
    page?: number;
    pageSize?: number;
  }>(
    `/content/public/${postId}/comments/${rootCommentId}/replies?${query.toString()}`,
  );

  return {
    rootComment: data?.root_comment ? toCommentItem(data.root_comment) : null,
    list: Array.isArray(data?.list) ? data!.list!.map(toThreadReplyItem) : [],
    total: Number(data?.total || 0),
    page: Number(data?.page || page || 1),
    pageSize: Number(data?.pageSize || pageSize || 20),
  };
}

export async function getCommunityCommentContext(
  postId: string,
  commentId: string,
): Promise<CommunityCommentThread | null> {
  const safePostId = String(postId || '').trim();
  const safeCommentId = String(commentId || '').trim();
  if (!safePostId || !safeCommentId) return null;

  const data = await getApiData<{
    root_comment?: ApiCommunityComment | null;
    list?: ApiCommunityComment[];
    total?: number;
    pageSize?: number;
  }>(
    `/content/public/${safePostId}/comments/${safeCommentId}/context`,
  );
  if (!data?.root_comment) return null;

  const replies = Array.isArray(data.list) ? data.list : [];
  return toCommentThreads([
    {
      ...data.root_comment,
      replies,
      reply_total: Math.max(Number(data.total || 0), replies.length),
      reply_has_more: Number(data.total || 0) > replies.length,
      reply_page_size: Math.max(1, Number(data.pageSize || replies.length || 20)),
    },
  ])[0] || null;
}

export async function getCommunityPostLikeStatus(params: {
  token: string;
  postId: string;
}): Promise<boolean | null> {
  const token = String(params.token || '').trim();
  const postId = String(params.postId || '').trim();
  if (!token || !postId) return null;

  try {
    const res = await trackedApiFetch(`/content/${postId}/like-status`, {
      method: 'GET',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) return null;
    return Boolean(json?.data?.liked);
  } catch {
    return null;
  }
}

export async function getCommunityCommentLikeStatuses(params: {
  token: string;
  commentIds: string[];
}): Promise<Record<string, boolean>> {
  const token = String(params.token || '').trim();
  const commentIds = Array.from(
    new Set(
      (params.commentIds || [])
        .map((id) => String(id || '').trim())
        .filter((id) => Boolean(id) && MONGO_OBJECT_ID_PATTERN.test(id)),
    ),
  ).slice(0, 200);
  if (!token || commentIds.length === 0) return {};

  try {
    const res = await trackedApiFetch('/content/comments/like-status-batch', {
      method: 'POST',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: commentIds }),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) return {};
    const likedIds = Array.isArray(json?.data?.liked_ids)
      ? json.data.liked_ids
          .map((id: unknown) => String(id || '').trim())
          .filter(Boolean)
      : [];
    const statusMap: Record<string, boolean> = {};
    likedIds.forEach((id: string) => {
      statusMap[id] = true;
    });
    return statusMap;
  } catch {
    return {};
  }
}

export async function getCommunityTopics(
  params: TopicListParams = {},
  fetchOptions?: CommunityReadFetchOptions,
): Promise<{
  list: CommunityTopicItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    pageSize: String(params.pageSize || 20),
    sort: params.sort || 'hot',
  });
  const keyword = String(params.q || '').trim();
  if (keyword) query.set('q', keyword);
  if (params.appId) query.set('app_id', params.appId);
  if (params.type) query.set('type', params.type);
  if (params.isOfficial !== undefined) query.set('is_official', params.isOfficial ? 'true' : 'false');

  const data = await getApiData<{
    list?: CommunityTopicItem[];
    total?: number;
    page?: number;
    pageSize?: number;
  }>(
    `/content/topics/public?${query.toString()}`,
    fetchOptions,
    { logKey: 'community-topics', next: { revalidate: COMMUNITY_TOPIC_REVALIDATE_SECONDS } },
  );

  return {
    list: Array.isArray(data?.list) ? data!.list!.map((item) => normalizeTopicItem(item)) : [],
    total: Number(data?.total || 0),
    page: Number(data?.page || params.page || 1),
    pageSize: Number(data?.pageSize || params.pageSize || 20),
  };
}

export async function getCommunityTopicDetail(
  idOrSlug: string,
  fetchOptions?: CommunityReadFetchOptions,
): Promise<CommunityTopicItem | null> {
  const target = String(idOrSlug || '').trim();
  if (!target) return null;
  const topic = await getApiData<CommunityTopicItem>(
    `/content/topics/public/${encodeURIComponent(target)}`,
    fetchOptions,
    { logKey: 'community-topic-detail', next: { revalidate: COMMUNITY_TOPIC_REVALIDATE_SECONDS } },
  );
  return topic ? normalizeTopicItem(topic) : null;
}

export async function getCommunityTopicSuggestions(params: {
  q: string;
  limit?: number;
  appId?: string;
}): Promise<CommunityTopicItem[]> {
  const keyword = String(params.q || '').trim();
  if (!keyword) return [];

  const query = new URLSearchParams({
    q: keyword,
    limit: String(params.limit || 10),
  });
  if (params.appId) query.set('app_id', params.appId);

  const data = await getApiData<{ list?: CommunityTopicItem[] }>(
    `/content/topics/suggest?${query.toString()}`,
  );
  return Array.isArray(data?.list) ? data!.list!.map((item) => normalizeTopicItem(item)) : [];
}

export async function quickCreateCommunityTopic(params: {
  token: string;
  name: string;
  appId?: string;
}): Promise<{
  ok: boolean;
  created: boolean;
  topic: CommunityTopicItem | null;
  message: string;
}> {
  const token = String(params.token || '').trim();
  const name = String(params.name || '').trim();
  if (!token) {
    return {
      ok: false,
      created: false,
      topic: null,
      message: '请先登录后再创建话题',
    };
  }
  if (!name) {
    return {
      ok: false,
      created: false,
      topic: null,
      message: '话题名称不能为空',
    };
  }

  try {
    const res = await trackedApiFetch('/content/topics/quick-create', {
      method: 'POST',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        app_id: params.appId || undefined,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        created: false,
        topic: null,
        message: parseApiResponseMessage(json, '创建话题失败'),
      };
    }
    return {
      ok: true,
      created: Boolean(json?.data?.created),
      topic: json?.data?.topic ? normalizeTopicItem(json.data.topic as CommunityTopicItem) : null,
      message: parseApiResponseMessage(json, '操作成功'),
    };
  } catch {
    return {
      ok: false,
      created: false,
      topic: null,
      message: '创建话题失败，请稍后重试',
    };
  }
}

export async function createCommunityPost(
  params: CreateCommunityPostParams,
): Promise<{
  ok: boolean;
  message: string;
  postId?: string;
}> {
  const token = String(params.token || '').trim();
  const content = String(params.content || '').trim();
  if (!token) {
    return { ok: false, message: '请先登录后再发布' };
  }
  if (!content) {
    return { ok: false, message: '帖子内容不能为空' };
  }

  try {
    const res = await trackedApiFetch('/content/posts', {
      method: 'POST',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: String(params.title || '').trim() || undefined,
        summary: String(params.summary || '').trim() || undefined,
        content,
        app_id: params.appId || undefined,
        source: String(params.source || 'web').trim() || 'web',
        topic_ids: Array.isArray(params.topicIds)
          ? params.topicIds.filter((id) => String(id || '').trim())
          : [],
        topic_names: Array.isArray(params.topicNames)
          ? params.topicNames
              .map((name) => String(name || '').trim())
              .filter(Boolean)
          : [],
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '发布失败'),
      };
    }

    return {
      ok: true,
      message: parseApiResponseMessage(json, '发布成功'),
      postId: String(json?.data?._id || '').trim() || undefined,
    };
  } catch {
    return { ok: false, message: '发布失败，请稍后重试' };
  }
}

export async function updateMyCommunityPost(
  params: UpdateCommunityPostParams,
): Promise<{
  ok: boolean;
  message: string;
  post?: CommunityPost;
  reviewReason?: string;
  reviewStatus?: string;
  status?: number;
  updatedAt?: string;
  topicItems?: CommunityTopicItem[];
}> {
  const token = String(params.token || '').trim();
  const postId = String(params.postId || '').trim();
  const content = String(params.content || '').trim();
  if (!token || !postId) {
    return { ok: false, message: '参数不完整' };
  }
  if (!content) {
    return { ok: false, message: '帖子内容不能为空' };
  }

  try {
    const res = await trackedApiFetch(`/content/my/posts/${postId}`, {
      method: 'PUT',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: String(params.title || '').trim() || undefined,
        summary: String(params.summary || '').trim() || undefined,
        content,
        app_id: params.appId || undefined,
        source: String(params.source || 'web').trim() || 'web',
        topic_ids: Array.isArray(params.topicIds)
          ? params.topicIds.filter((id) => String(id || '').trim())
          : [],
        topic_names: Array.isArray(params.topicNames)
          ? params.topicNames
              .map((name) => String(name || '').trim())
              .filter(Boolean)
          : [],
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0 || !json?.data) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '保存失败'),
      };
    }

    const rawItem = json.data as ApiCommunityPost & {
      review_reason?: string;
      review_status?: string;
      status?: number;
      updated_at?: string;
    };
    const topicItems = Array.isArray(rawItem.topic_infos)
      ? rawItem.topic_infos
          .map((topic) =>
            normalizeTopicItem({
              _id: String(topic?._id || '').trim(),
              name: String(topic?.name || '').trim(),
              slug: String(topic?.slug || '').trim(),
              app_id: rawItem.app_info?._id,
            }),
          )
          .filter((topic) => Boolean(topic._id))
      : [];

    return {
      ok: true,
      message: parseApiResponseMessage(json, '保存成功'),
      post: toCommunityPost(rawItem),
      reviewReason: String(rawItem.review_reason || '').trim() || undefined,
      reviewStatus: String(rawItem.review_status || '').trim() || undefined,
      status: Number(rawItem.status || 0),
      updatedAt: String(rawItem.updated_at || '').trim() || undefined,
      topicItems,
    };
  } catch {
    return { ok: false, message: '保存失败，请稍后重试' };
  }
}

export async function getMyFollowedTopics(params: {
  token: string;
  page?: number;
  pageSize?: number;
}): Promise<CommunityTopicItem[]> {
  const token = String(params.token || '').trim();
  if (!token) return [];

  const query = new URLSearchParams({
    page: String(params.page || 1),
    pageSize: String(params.pageSize || 50),
  });

  try {
    const res = await trackedApiFetch(`/content/my/topics/follows?${query.toString()}`, {
      method: 'GET',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) return [];
    return Array.isArray(json?.data?.list)
      ? (json.data.list as CommunityTopicItem[]).map((item) => normalizeTopicItem(item))
      : [];
  } catch {
    return [];
  }
}

export async function getTopicFollowStatus(params: {
  token: string;
  topicId: string;
}): Promise<TopicFollowResult | null> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  if (!token || !topicId) return null;

  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/follow-status`, {
      method: 'GET',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0 || !json?.data) return null;
    return json.data as TopicFollowResult;
  } catch {
    return null;
  }
}

export async function followTopic(params: {
  token: string;
  topicId: string;
}): Promise<{ ok: boolean; message: string; data: TopicFollowResult | null }> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  if (!token || !topicId) {
    return { ok: false, message: '参数不完整', data: null };
  }

  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/follow`, {
      method: 'POST',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '关注失败'),
        data: null,
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, '关注成功'),
      data: (json?.data as TopicFollowResult) || null,
    };
  } catch {
    return { ok: false, message: '关注失败，请稍后重试', data: null };
  }
}

export async function unfollowTopic(params: {
  token: string;
  topicId: string;
}): Promise<{ ok: boolean; message: string; data: TopicFollowResult | null }> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  if (!token || !topicId) {
    return { ok: false, message: '参数不完整', data: null };
  }

  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/follow`, {
      method: 'DELETE',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '取消关注失败'),
        data: null,
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, '已取消关注'),
      data: (json?.data as TopicFollowResult) || null,
    };
  } catch {
    return { ok: false, message: '取消关注失败，请稍后重试', data: null };
  }
}

export async function moderatorUpdateTopic(params: {
  token: string;
  topicId: string;
  patch: ModeratorTopicPatch;
}): Promise<{ ok: boolean; message: string; topic: CommunityTopicItem | null }> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  if (!token || !topicId) {
    return { ok: false, message: '参数不完整', topic: null };
  }

  const payload: ModeratorTopicPatch = {};
  if (params.patch.announcement !== undefined) {
    payload.announcement = String(params.patch.announcement || '').trim();
  }
  if (params.patch.is_locked !== undefined) {
    payload.is_locked = Boolean(params.patch.is_locked);
  }
  if (params.patch.is_recommended !== undefined) {
    payload.is_recommended = Boolean(params.patch.is_recommended);
  }
  if (params.patch.pinned_post_id !== undefined) {
    const rawPinnedPostId = String(params.patch.pinned_post_id || '').trim();
    payload.pinned_post_id = rawPinnedPostId || null;
  }

  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/moderation`, {
      method: 'PATCH',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '保存失败'),
        topic: null,
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, '保存成功'),
      topic: (json?.data as CommunityTopicItem) || null,
    };
  } catch {
    return { ok: false, message: '保存失败，请稍后重试', topic: null };
  }
}

export async function moderatorDeleteTopicPost(params: {
  token: string;
  topicId: string;
  postId: string;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  const postId = String(params.postId || '').trim();
  if (!token || !topicId || !postId) {
    return { ok: false, message: '参数不完整' };
  }

  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/moderation/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '删除失败'),
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, '删除成功'),
    };
  } catch {
    return { ok: false, message: '删除失败，请稍后重试' };
  }
}

export async function deleteMyCommunityPost(params: {
  token: string;
  postId: string;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const postId = String(params.postId || '').trim();
  if (!token || !postId) {
    return { ok: false, message: '参数不完整' };
  }

  try {
    const res = await trackedApiFetch(`/content/my/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '删除失败'),
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, '删除成功'),
    };
  } catch {
    return { ok: false, message: '删除失败，请稍后重试' };
  }
}

export async function setMyCommunityPostStatus(params: {
  token: string;
  postId: string;
  status: 0 | 1;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const postId = String(params.postId || '').trim();
  const status = params.status === 0 ? 0 : 1;
  if (!token || !postId) {
    return { ok: false, message: '参数不完整' };
  }

  try {
    const res = await trackedApiFetch(`/content/my/posts/${postId}/status`, {
      method: 'PATCH',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '状态更新失败'),
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, status === 0 ? '已隐藏' : '已显示'),
    };
  } catch {
    return { ok: false, message: '状态更新失败，请稍后重试' };
  }
}

export async function adminDeleteCommunityPost(params: {
  token: string;
  postId: string;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const postId = String(params.postId || '').trim();
  if (!token || !postId) {
    return { ok: false, message: '参数不完整' };
  }

  try {
    const res = await trackedApiFetch(`/content/admin/${postId}`, {
      method: 'DELETE',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '删除失败'),
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, '删除成功'),
    };
  } catch {
    return { ok: false, message: '删除失败，请稍后重试' };
  }
}

export async function adminSetCommunityPostStatus(params: {
  token: string;
  postId: string;
  status: 0 | 1;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const postId = String(params.postId || '').trim();
  const status = params.status === 0 ? 0 : 1;
  if (!token || !postId) {
    return { ok: false, message: '参数不完整' };
  }

  try {
    const res = await trackedApiFetch(`/content/admin/${postId}/status`, {
      method: 'PATCH',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '状态更新失败'),
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, status === 0 ? '已隐藏' : '已显示'),
    };
  } catch {
    return { ok: false, message: '状态更新失败，请稍后重试' };
  }
}

export async function moderatorSetTopicPostStatus(params: {
  token: string;
  topicId: string;
  postId: string;
  status: 0 | 1;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  const postId = String(params.postId || '').trim();
  const status = params.status === 0 ? 0 : 1;
  if (!token || !topicId || !postId) {
    return { ok: false, message: '参数不完整' };
  }

  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/moderation/posts/${postId}/status`, {
      method: 'PATCH',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '状态更新失败'),
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, status === 0 ? '已下线' : '已上线'),
    };
  } catch {
    return { ok: false, message: '状态更新失败，请稍后重试' };
  }
}

export async function moderatorDeleteTopicComment(params: {
  token: string;
  topicId: string;
  commentId: string;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  const commentId = String(params.commentId || '').trim();
  if (!token || !topicId || !commentId) {
    return { ok: false, message: '参数不完整' };
  }

  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/moderation/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '删除失败'),
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, '删除成功'),
    };
  } catch {
    return { ok: false, message: '删除失败，请稍后重试' };
  }
}

export async function moderatorSetTopicCommentStatus(params: {
  token: string;
  topicId: string;
  commentId: string;
  status: 0 | 1;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  const commentId = String(params.commentId || '').trim();
  const status = params.status === 0 ? 0 : 1;
  if (!token || !topicId || !commentId) {
    return { ok: false, message: '参数不完整' };
  }

  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/moderation/comments/${commentId}/status`, {
      method: 'PATCH',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      return {
        ok: false,
        message: parseApiResponseMessage(json, '状态更新失败'),
      };
    }
    return {
      ok: true,
      message: parseApiResponseMessage(json, status === 0 ? '已下线' : '已上线'),
    };
  } catch {
    return { ok: false, message: '状态更新失败，请稍后重试' };
  }
}


