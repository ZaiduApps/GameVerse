import { apiUrl, trackedApiFetch } from '@/lib/api';
import { buildTrackingHeaders } from '@/lib/tracking-headers';
import type { CommunityPost } from '@/types';

const FALLBACK_AVATAR = 'https://placehold.co/40x40.png?text=U';

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
    name?: string;
  } | null;
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

export function toCommunityPost(item: ApiCommunityPost): CommunityPost {
  const content = item.content?.trim() || item.summary?.trim() || '暂无内容';
  const firstImage = item.cover || item.media_urls?.[0] || undefined;
  const tags = [
    item.topic_info?.name,
    ...(item.app_info?.tag_names || []),
  ].filter((tag): tag is string => Boolean(tag && tag.trim()));
  const uniqueTags = Array.from(new Set(tags));

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
    content,
    imageUrl: firstImage,
    imageAiHint: firstImage ? 'community post image' : undefined,
    tags: uniqueTags.slice(0, 4),
    category: item.topic_info?.name || item.app_info?.name || '社区',
    commentsCount: Number(item.comment_count || 0),
    likesCount: Number(item.like_count || 0),
    viewsCount: Number(item.view_count || 0),
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

export function toCommentThreads(list: ApiCommunityComment[]): CommunityCommentThread[] {
  return (list || []).map((root) => {
    const rootItem = toCommentItem(root);
    const replies = (root.replies || []).map((reply) => {
      const item = toCommentItem(reply);
      const replyTo = reply.reply_to_user_name?.trim();
      return {
        ...item,
        text: `${replyTo ? `回复 @${replyTo}: ` : ''}${item.text}`,
      };
    });
    return {
      ...rootItem,
      replies,
    };
  });
}

async function getApiData<T>(path: string): Promise<T | null> {
  try {
    const res = await trackedApiFetch(path, {
      cache: 'no-store',
      headers: buildTrackingHeaders(),
    });
    if (!res.ok) return null;

    const json = await res.json();
    if (json?.code !== 0) return null;
    return (json?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export async function getCommunityFeed(
  sort: 'latest' | 'hot',
  pageSize = 20,
): Promise<CommunityPost[]> {
  const query = new URLSearchParams({
    page: '1',
    pageSize: String(pageSize),
    sort,
  });
  const data = await getApiData<{ list?: ApiCommunityPost[] }>(
    `/content/feed?${query.toString()}`,
  );
  const list = data?.list || [];
  return list.map(toCommunityPost).filter((item) => Boolean(item.id));
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
): Promise<CommunityCommentThread[]> {
  const query = new URLSearchParams({
    page: '1',
    pageSize: String(pageSize),
    sort: 'latest',
  });
  const data = await getApiData<{ list?: ApiCommunityComment[] }>(
    `/content/public/${postId}/comments?${query.toString()}`,
  );
  return toCommentThreads(data?.list || []);
}

