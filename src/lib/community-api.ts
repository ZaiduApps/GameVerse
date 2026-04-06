import { trackedApiFetch } from '@/lib/api';
import { buildTrackingHeaders } from '@/lib/tracking-headers';
import type { CommunityPost } from '@/types';

const FALLBACK_AVATAR = 'https://placehold.co/40x40.png?text=U';

export interface CommunityTopicItem {
  _id: string;
  name: string;
  slug: string;
  type?: 'event' | 'game' | 'general';
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
  title?: string;
  summary?: string;
  content?: string;
  cover?: string;
  media_urls?: string[];
  source?: string;
  author_name?: string;
  author_avatar?: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  publish_at?: string;
  last_commented_at?: string;
  created_at?: string;
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
}

export interface ApiCommunityComment {
  _id?: string;
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
  user: { name: string; avatarUrl: string; dataAiHint?: string };
  timestamp: string;
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

interface TopicListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: 'activity' | 'hot' | 'manual' | 'new';
  appId?: string;
  type?: 'event' | 'game' | 'general';
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

function parseApiResponseMessage(json: any, fallback: string) {
  const message = String(json?.message || '').trim();
  return message || fallback;
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
  const markdownMatch = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+[^)]*)?\)/i);
  if (markdownMatch?.[1]) return markdownMatch[1];
  const htmlMatch = text.match(/<img[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
  if (htmlMatch?.[1]) return htmlMatch[1];
  return undefined;
}

export function toCommunityPost(item: ApiCommunityPost): CommunityPost {
  const rawContent = String(item.content || '').trim();
  const rawSummary = String(item.summary || '').trim();
  const content = rawContent || rawSummary || '暂无内容';
  const summary = extractSummary(rawSummary, rawContent);
  const firstImage =
    item.cover ||
    item.media_urls?.[0] ||
    extractFirstImageFromText(rawContent) ||
    undefined;
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

  return {
    id: String(item._id || ''),
    user: {
      name: item.author_name?.trim() || '匿名用户',
      avatarUrl: item.author_avatar?.trim() || FALLBACK_AVATAR,
      dataAiHint: 'user avatar',
    },
    timestamp: formatTimestamp(
      item.last_commented_at || item.publish_at || item.created_at,
    ),
    source: item.source?.trim() || undefined,
    title: item.title?.trim() || undefined,
    summary,
    content,
    imageUrl: firstImage,
    imageAiHint: firstImage ? 'community post image' : undefined,
    tags: uniqueTags.slice(0, 4),
    topicIds,
    topicNames: uniqueTopicNames,
    category: topicNames[0] || item.app_info?.name || '社区',
    commentsCount: Number(item.comment_count || 0),
    likesCount: Number(item.like_count || 0),
    viewsCount: Number(item.view_count || 0),
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
  return {
    id: String(input._id || ''),
    user: {
      name: input.user_name?.trim() || '匿名用户',
      avatarUrl: input.user_avatar?.trim() || FALLBACK_AVATAR,
      dataAiHint: 'user avatar',
    },
    timestamp: formatTimestamp(input.created_at),
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

async function getApiData<T>(path: string): Promise<T | null> {
  try {
    const res = await trackedApiFetch(path, { cache: 'no-store' });
    if (!res.ok) return null;

    const json = await res.json();
    if (json?.code !== 0) return null;
    return (json?.data ?? null) as T | null;
  } catch {
    return null;
  }
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
    topicId?: string;
  },
): Promise<CommunityFeedResult> {
  const page = Math.max(1, Number(options?.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(options?.pageSize || 20)));
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort,
  });
  const topicId = String(options?.topicId || '').trim();
  if (topicId) query.set('topic_id', topicId);
  const data = await getApiData<CommunityFeedData>(
    `/content/feed?${query.toString()}`,
  );
  const pagination = data?.pagination || {};
  const rawList = Array.isArray(data?.list) ? data.list : [];
  const list = rawList.map(toCommunityPost).filter((item) => Boolean(item.id));
  const total = Number(data?.total ?? pagination.total ?? 0);
  const currentPage = Number(data?.page ?? pagination.page ?? page);
  const currentPageSize = Number(data?.pageSize ?? pagination.pageSize ?? pageSize);
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
    const filtered = mapped.filter((post) => matchesRelatedGame(post, options));
    if (filtered.length > 0) return filtered;
  }

  return [];
}

export async function getCommunityPostById(
  id: string,
): Promise<CommunityPost | null> {
  const data = await getApiData<ApiCommunityPost>(`/content/public/${id}`);
  if (!data || !data._id) return null;
  return toCommunityPost(data);
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

export async function getCommunityTopics(params: TopicListParams = {}): Promise<{
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

  const data = await getApiData<{
    list?: CommunityTopicItem[];
    total?: number;
    page?: number;
    pageSize?: number;
  }>(`/content/topics/public?${query.toString()}`);

  return {
    list: Array.isArray(data?.list) ? data!.list! : [],
    total: Number(data?.total || 0),
    page: Number(data?.page || params.page || 1),
    pageSize: Number(data?.pageSize || params.pageSize || 20),
  };
}

export async function getCommunityTopicDetail(idOrSlug: string): Promise<CommunityTopicItem | null> {
  const target = String(idOrSlug || '').trim();
  if (!target) return null;
  return await getApiData<CommunityTopicItem>(`/content/topics/public/${encodeURIComponent(target)}`);
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
  return Array.isArray(data?.list) ? data!.list! : [];
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
      topic: (json?.data?.topic as CommunityTopicItem) || null,
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
    return Array.isArray(json?.data?.list) ? (json.data.list as CommunityTopicItem[]) : [];
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


