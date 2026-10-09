import { trackedApiFetch } from '@/lib/api';
import { toCommunityPost, type ApiCommunityPost } from '@/lib/community-api';
import type { CommunityPost } from '@/types';

const PUBLIC_PROFILE_REVALIDATE_SECONDS = 180;

export interface PublicProfilePost {
  _id: string;
  author_id?: string;
  author_type?: string;
  author_username?: string;
  author_name?: string;
  author_avatar?: string;
  title?: string;
  summary?: string;
  content?: string;
  cover?: string;
  display_cover?: string;
  media_urls?: string[];
  preview_images?: string[];
  publish_at?: string;
  created_at?: string;
  updated_at?: string;
  view_count?: number;
  like_count?: number;
  dislike_count?: number;
  comment_count?: number;
  heat_score?: number;
  link_previews?: ApiCommunityPost['link_previews'];
  topic_info?: ApiCommunityPost['topic_info'];
  topic_infos?: ApiCommunityPost['topic_infos'];
  topic_id?: string;
  topic_ids?: string[];
  app_info?: ApiCommunityPost['app_info'];
}

export interface PublicProfileData {
  user: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
    signature?: string;
    country?: string;
    province?: string;
    city?: string;
    isVerified?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  stats: {
    post_count: number;
    view_count: number;
    like_count: number;
    comment_count: number;
  };
  posts: PublicProfilePost[];
}

/**
 * Next.js 动态路由段可能仍是 percent-encoded 形态（例如 zaidu9528%40gmail.com）。
 * 直接再走一次 encodeURIComponent 会二次编码成 %2540，接口按错误主键查询返回 404，
 * 页面误判为「用户不存在」。这里先还原成明文，再由请求层统一编码一次。
 */
function decodeIfPercentEncoded(value: string): string {
  if (!/%[0-9a-fA-F]{2}/.test(value)) return value;
  try {
    const decoded = decodeURIComponent(value);
    return decoded === value ? value : decoded;
  } catch {
    // 非法转义序列保持原样交给接口判定，避免本地抛错导致整页 500。
    return value;
  }
}

export type PublicProfileResultKind = 'ok' | 'notFound' | 'httpError' | 'invalidPayload';

export interface PublicProfileResult {
  data: PublicProfileData | null;
  status: number | null;
  kind: PublicProfileResultKind;
}

async function requestPublicProfileResult(lookupKey: string): Promise<PublicProfileResult> {
  const res = await trackedApiFetch(`/users/public/${encodeURIComponent(lookupKey)}`, {
    cache: 'force-cache',
    next: { revalidate: PUBLIC_PROFILE_REVALIDATE_SECONDS },
    timeoutMs: 8000,
    logKey: 'public-profile',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.error('[public-profile] 解析失败', {
      lookupKey,
      status: res.status,
      code: json?.code ?? null,
      hasUser: Boolean(json?.data?.user),
    });
    // 只有明确的 404 才是「用户不存在」，5xx / 429 属于后端故障，不能折叠成 404
    return {
      data: null,
      status: res.status,
      kind: res.status === 404 ? 'notFound' : 'httpError',
    };
  }
  if (json?.code !== 0 || !json?.data?.user) {
    console.error('[public-profile] 解析失败', {
      lookupKey,
      status: res.status,
      code: json?.code ?? null,
      hasUser: Boolean(json?.data?.user),
    });
    return { data: null, status: res.status, kind: 'invalidPayload' };
  }
  return { data: json.data as PublicProfileData, status: res.status, kind: 'ok' };
}

/** 兼容包装：失败一律 null，保持既有行为不变。 */
async function requestPublicProfile(lookupKey: string): Promise<PublicProfileData | null> {
  return (await requestPublicProfileResult(lookupKey)).data;
}

export async function getPublicProfile(idOrUsername: string): Promise<PublicProfileData | null> {
  const id = String(idOrUsername || '').trim();
  if (!id) return null;

  // 解码值优先；若用户名本身含字面量 % 序列导致解码后查不到，再用原值兜一次。
  const candidates = Array.from(new Set([decodeIfPercentEncoded(id), id]));
  for (const candidate of candidates) {
    const data = await requestPublicProfile(candidate);
    if (data) return data;
  }
  return null;
}

/**
 * 页面专用：只有所有候选都明确 404（用户确实不存在）才返回 null 让调用方 notFound()，
 * 其余失败（5xx / 429 / 超时 / 异常）抛错走 error.tsx / 500，
 * 避免后端抖动被固化成永久 noindex 的 404。
 */
export async function getPublicProfileOrThrow(
  idOrUsername: string,
): Promise<PublicProfileData | null> {
  const id = String(idOrUsername || '').trim();
  if (!id) return null;

  const candidates = Array.from(new Set([decodeIfPercentEncoded(id), id]));
  for (const candidate of candidates) {
    const result = await requestPublicProfileResult(candidate);
    if (result.data) return result.data;
    if (result.kind !== 'notFound') {
      throw new Error(
        '[public-profile] 读取失败：lookupKey=' + candidate +
          ' kind=' + result.kind + ' status=' + String(result.status),
      );
    }
  }
  return null;
}

export function publicProfilePostToCommunityPost(
  post: PublicProfilePost,
  user: PublicProfileData['user'],
): CommunityPost {
  return toCommunityPost({
    ...(post as ApiCommunityPost),
    _id: post._id,
    author_id: post.author_id || user._id,
    author_type: post.author_type || 'user',
    author_username: post.author_username || user.username,
    author_name: post.author_name || user.name || user.username,
    author_avatar: post.author_avatar || user.avatar,
    cover: post.cover,
    display_cover: post.display_cover || post.cover,
    publish_at: post.publish_at || post.created_at,
    dislike_count: post.dislike_count,
  });
}
