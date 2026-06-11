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

export async function getPublicProfile(idOrUsername: string): Promise<PublicProfileData | null> {
  const id = String(idOrUsername || '').trim();
  if (!id) return null;

  try {
    const res = await trackedApiFetch(`/users/public/${encodeURIComponent(id)}`, {
      cache: 'force-cache',
      next: { revalidate: PUBLIC_PROFILE_REVALIDATE_SECONDS },
      timeoutMs: 8000,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.code !== 0 || !json?.data?.user) {
      return null;
    }
    return json.data as PublicProfileData;
  } catch {
    return null;
  }
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
