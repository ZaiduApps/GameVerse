import { trackedApiFetch } from '@/lib/api';

const PUBLIC_PROFILE_REVALIDATE_SECONDS = 180;

export interface PublicProfilePost {
  _id: string;
  title?: string;
  summary?: string;
  content?: string;
  cover?: string;
  preview_images?: string[];
  publish_at?: string;
  updated_at?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  heat_score?: number;
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
