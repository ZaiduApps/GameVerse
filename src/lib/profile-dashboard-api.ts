import { trackedApiFetch } from '@/lib/api';
import { getMyFollowedTopics, toCommunityPost, type ApiCommunityPost, type CommunityTopicItem } from '@/lib/community-api';
import type { CommunityPost, Game } from '@/types';

export type DashboardPostItem = {
  post: CommunityPost;
  topicItems?: CommunityTopicItem[];
  reviewReason?: string;
  reviewStatus: string;
  status: number;
  updatedAt?: string;
};

export type DashboardPageResult<T> = {
  ok: boolean;
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
};

type ApiResponse<T> = {
  code: number;
  message?: string;
  data?: T;
};

type ApiMyPostItem = ApiCommunityPost & {
  review_reason?: string;
  review_status?: string;
  status?: number;
  updated_at?: string;
};

function mapDashboardTopicItems(
  item: ApiMyPostItem,
  post: CommunityPost,
): CommunityTopicItem[] {
  const topicMap = new Map<string, CommunityTopicItem>();

  (item.topic_infos || []).forEach((topic) => {
    const id = String(topic?._id || '').trim();
    if (!id) return;
    topicMap.set(id, {
      _id: id,
      app_id: post.relatedApp?.id,
      name: String(topic?.name || '').trim() || id,
      slug: String(topic?.slug || '').trim() || id,
    });
  });

  (post.topicIds || []).forEach((topicId, index) => {
    const id = String(topicId || '').trim();
    if (!id || topicMap.has(id)) return;
    const fallbackName = String(post.topicNames?.[index] || '').trim();
    topicMap.set(id, {
      _id: id,
      app_id: post.relatedApp?.id,
      name: fallbackName || id,
      slug: fallbackName || id,
    });
  });

  return Array.from(topicMap.values());
}

type ApiReservationItem = {
  app_id?: string;
  pkg?: string;
  name?: string;
  icon?: string;
  summary?: string;
  star?: number;
  version?: string;
  latest_at?: string;
  status?: number;
  is_reservation?: boolean;
  followed_at?: string;
};

function buildDashboardFailure<T>(
  page: number,
  pageSize: number,
  message: string,
): DashboardPageResult<T> {
  return {
    ok: false,
    list: [],
    total: 0,
    page,
    pageSize,
    message,
  };
}

export async function getMyDashboardPosts(params: {
  token: string;
  page?: number;
  pageSize?: number;
  q?: string;
  reviewStatus?: string;
  status?: string;
  sort?: string;
}): Promise<DashboardPageResult<DashboardPostItem>> {
  const token = String(params.token || '').trim();
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.max(1, Number(params.pageSize || 6));
  if (!token) return buildDashboardFailure(page, pageSize, '登录状态已失效');

  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const keyword = String(params.q || '').trim();
  const reviewStatus = String(params.reviewStatus || '').trim();
  const status = String(params.status || '').trim();
  const sort = String(params.sort || '').trim();
  if (keyword) query.set('q', keyword);
  if (reviewStatus) query.set('review_status', reviewStatus);
  if (status === '0' || status === '1') query.set('status', status);
  if (sort && sort !== 'latest') query.set('sort', sort);

  try {
    const res = await trackedApiFetch(`/content/my/posts?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const json: ApiResponse<{ list?: ApiMyPostItem[]; total?: number; page?: number; pageSize?: number }> = await res.json().catch(() => ({ code: -1 }));
    if (!res.ok || json.code !== 0) {
      return buildDashboardFailure(
        page,
        pageSize,
        String(json.message || '动态列表加载失败，请稍后重试'),
      );
    }
    const rawList = Array.isArray(json.data?.list) ? json.data?.list : [];
    const list: DashboardPostItem[] = rawList.map((item) => {
      const post = toCommunityPost(item);
      return {
        post,
        topicItems: mapDashboardTopicItems(item, post),
        reviewReason: String(item.review_reason || '').trim() || undefined,
        reviewStatus: String(item.review_status || '').trim(),
        status: Number(item.status || 0),
        updatedAt: String(item.updated_at || '').trim() || undefined,
      };
    });
    return {
      ok: true,
      list,
      total: Number(json.data?.total || list.length || 0),
      page: Number(json.data?.page || page),
      pageSize: Number(json.data?.pageSize || pageSize),
    };
  } catch {
    return buildDashboardFailure(page, pageSize, '动态列表加载失败，请稍后重试');
  }
}

export async function getMyReservationGames(params: {
  token: string;
  page?: number;
  pageSize?: number;
}): Promise<DashboardPageResult<Game>> {
  const token = String(params.token || '').trim();
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.max(1, Number(params.pageSize || 6));
  if (!token) return buildDashboardFailure(page, pageSize, '登录状态已失效');

  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  try {
    const res = await trackedApiFetch(`/game/reservations/my?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const json: ApiResponse<{ list?: ApiReservationItem[]; total?: number; page?: number; pageSize?: number }> = await res.json().catch(() => ({ code: -1 }));
    if (!res.ok || json.code !== 0) {
      return buildDashboardFailure(
        page,
        pageSize,
        String(json.message || '预约列表加载失败，请稍后重试'),
      );
    }
    const rawList = Array.isArray(json.data?.list) ? json.data?.list : [];
    const list: Game[] = rawList.map((item) => ({
      id: String(item.app_id || item.pkg || '').trim(),
      pkg: String(item.pkg || '').trim() || undefined,
      title: String(item.name || '未命名游戏').trim(),
      description: String(item.summary || '').trim(),
      shortDescription: String(item.summary || '').trim(),
      imageUrl: String(item.icon || '/placeholder.svg').trim() || '/placeholder.svg',
      category: '预约',
      rating: Number(item.star || 0),
      version: String(item.version || '').trim() || undefined,
      updateDate: String(item.latest_at || '').trim() || undefined,
      status: item.is_reservation === false ? 'released' : 'pre-registration',
    }));
    return {
      ok: true,
      list,
      total: Number(json.data?.total || list.length || 0),
      page: Number(json.data?.page || page),
      pageSize: Number(json.data?.pageSize || pageSize),
    };
  } catch {
    return buildDashboardFailure(page, pageSize, '预约列表加载失败，请稍后重试');
  }
}

export async function getMyFollowedGameTopics(params: {
  token: string;
  page?: number;
  pageSize?: number;
}): Promise<DashboardPageResult<CommunityTopicItem>> {
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.max(1, Number(params.pageSize || 6));
  const list = await getMyFollowedTopics(params);
  const gameTopics = list.filter((topic) => Boolean(topic?.app_info?._id || topic?.app_info?.pkg));
  return {
    ok: true,
    list: gameTopics,
    total: gameTopics.length,
    page,
    pageSize,
  };
}

export function extractFollowedGamesFromTopics(topics: CommunityTopicItem[]): Game[] {
  const seen = new Set<string>();
  const games: Game[] = [];
  for (const topic of topics || []) {
    const app = topic?.app_info;
    if (!app) continue;
    const appId = String(app._id || '').trim();
    const pkg = String(app.pkg || '').trim();
    const dedupeKey = appId || pkg;
    if (!dedupeKey || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    games.push({
      id: appId || pkg,
      pkg: pkg || undefined,
      title: String(app.name || '未命名游戏').trim(),
      description: String(app.summary || '').trim(),
      shortDescription: String(app.summary || '').trim(),
      imageUrl: String(app.icon || '/placeholder.svg').trim() || '/placeholder.svg',
      category: '关注',
      status: 'released',
    });
  }
  return games;
}

export async function unfollowTopicById(params: {
  token: string;
  topicId: string;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  if (!token || !topicId) return { ok: false, message: '参数不完整' };
  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/follow`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json: ApiResponse<any> = await res.json().catch(() => ({ code: -1 }));
    if (!res.ok || json.code !== 0) {
      return { ok: false, message: String(json.message || '取消关注失败') };
    }
    return { ok: true, message: '已取消关注社区' };
  } catch {
    return { ok: false, message: '取消关注失败，请稍后重试' };
  }
}

export async function followTopicById(params: {
  token: string;
  topicId: string;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const topicId = String(params.topicId || '').trim();
  if (!token || !topicId) return { ok: false, message: '参数不完整' };
  try {
    const res = await trackedApiFetch(`/content/topics/${topicId}/follow`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json: ApiResponse<any> = await res.json().catch(() => ({ code: -1 }));
    if (!res.ok || json.code !== 0) {
      return { ok: false, message: String(json.message || '关注失败') };
    }
    return { ok: true, message: '已重新关注社区' };
  } catch {
    return { ok: false, message: '关注失败，请稍后重试' };
  }
}

export async function unfollowReservationByAppId(params: {
  token: string;
  appId: string;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const appId = String(params.appId || '').trim();
  if (!token || !appId) return { ok: false, message: '参数不完整' };
  try {
    const res = await trackedApiFetch(`/game/reservations/follow/${encodeURIComponent(appId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json: ApiResponse<any> = await res.json().catch(() => ({ code: -1 }));
    if (!res.ok || json.code !== 0) {
      return { ok: false, message: String(json.message || '取消预约失败') };
    }
    return { ok: true, message: '已取消预约' };
  } catch {
    return { ok: false, message: '取消预约失败，请稍后重试' };
  }
}

export async function followReservationByAppId(params: {
  token: string;
  appId: string;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const appId = String(params.appId || '').trim();
  if (!token || !appId) return { ok: false, message: '参数不完整' };
  try {
    const res = await trackedApiFetch('/game/reservations/follow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ app_id: appId }),
    });
    const json: ApiResponse<any> = await res.json().catch(() => ({ code: -1 }));
    if (!res.ok || json.code !== 0) {
      return { ok: false, message: String(json.message || '重新预约失败') };
    }
    return { ok: true, message: '已重新预约' };
  } catch {
    return { ok: false, message: '重新预约失败，请稍后重试' };
  }
}
