import { trackedApiFetch, type TrackedFetchInit } from '@/lib/api';
import { buildTrackingHeaders } from '@/lib/tracking-headers';
import {
  computeGameRating,
  normalizeToFiveStar,
  type GameRatingBreakdown,
  type GameRatingResult,
} from '@/lib/game-rating';

const FALLBACK_AVATAR = '/favicon.ico';
const MONGO_OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

const USER_EMAIL_PREF_LOCAL_KEY = 'game-review:email-pref';
const ADMIN_EMAIL_SWITCH_LOCAL_KEY = 'game-review:admin-email-switch';

type ApiEnvelope<T> = {
  code?: number;
  success?: boolean;
  ok?: boolean;
  message?: string;
  data?: T;
  result?: T;
};

export interface GameReviewIdentity {
  appId?: string | null;
  pkg?: string | null;
  gameName?: string | null;
  manualScore?: number | string | null;
}

export interface GameReviewSummary extends GameRatingResult {
  myRating: number | null;
  myRatedAt?: string;
}

export interface GameReviewCommentItem {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
    dataAiHint?: string;
  };
  timestamp: string;
  text: string;
  likeCount: number;
}

export interface GameReviewCommentThread extends GameReviewCommentItem {
  replies: GameReviewCommentItem[];
  replyTotal: number;
  replyHasMore: boolean;
  replyPageSize: number;
}

export interface GameReviewCommentRepliesResult {
  rootComment: GameReviewCommentItem | null;
  list: GameReviewCommentItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface LocalGameCommentRecord {
  id: string;
  parentId: string | null;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  likeCount: number;
}

interface ApiGameReviewSummaryPayload {
  rating?: number | string | null;
  rating_value?: number | string | null;
  rating_count?: number | string | null;
  user_average?: number | string | null;
  user_avg?: number | string | null;
  manual_score?: number | string | null;
  my_rating?: number | string | null;
  my_rated_at?: string | null;
  stars?: Partial<Record<1 | 2 | 3 | 4 | 5, number | string | null>>;
  distribution?: Partial<Record<1 | 2 | 3 | 4 | 5, number | string | null>>;
}

interface ApiGameReviewCommentPayload {
  _id?: string;
  id?: string;
  user_name?: string;
  username?: string;
  user_avatar?: string;
  avatar?: string;
  content?: string;
  text?: string;
  created_at?: string;
  createdAt?: string;
  like_count?: number;
  likeCount?: number;
  reply_to_user_name?: string;
  replies?: ApiGameReviewCommentPayload[];
  reply_total?: number;
  reply_has_more?: boolean;
  reply_page_size?: number;
}

function getIdentityKey(identity: GameReviewIdentity): string {
  const appId = String(identity.appId || '').trim();
  const pkg = String(identity.pkg || '').trim();
  const gameName = String(identity.gameName || '').trim();
  return appId || pkg || gameName || 'unknown';
}

function buildIdentityQuery(identity: GameReviewIdentity) {
  const query = new URLSearchParams();
  const appId = String(identity.appId || '').trim();
  const pkg = String(identity.pkg || '').trim();
  const gameName = String(identity.gameName || '').trim();
  if (appId) query.set('app_id', appId);
  if (pkg) query.set('pkg', pkg);
  if (gameName) query.set('app_name', gameName);
  return query;
}

function parseMessage(payload: unknown, fallback = '请求失败') {
  const message =
    payload && typeof payload === 'object'
      ? String((payload as { message?: unknown }).message || '').trim()
      : '';
  return message || fallback;
}

function parseCodeSuccess<T>(payload: ApiEnvelope<T> | null): payload is ApiEnvelope<T> {
  if (!payload || typeof payload !== 'object') return false;
  if (Array.isArray(payload)) return true;
  if (payload.code === 0) return true;
  if (payload.success === true || payload.ok === true) return true;
  if (payload.code === undefined && (payload.data !== undefined || payload.result !== undefined)) return true;
  if (payload.code === undefined) {
    const keys = Object.keys(payload as Record<string, unknown>);
    if (keys.length > 0) return true;
  }
  return false;
}

async function requestCandidates<T>(
  paths: string[],
  init: TrackedFetchInit = {},
): Promise<{ ok: boolean; data: T | null; message: string }> {
  let message = '请求失败';
  for (const path of paths) {
    try {
      const res = await trackedApiFetch(path, init);
      const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
      if (res.ok && parseCodeSuccess(json)) {
        const resolvedData =
          json && typeof json === 'object' && !Array.isArray(json)
            ? (json.data ?? json.result ?? (json as unknown as T))
            : (json as unknown as T);
        return {
          ok: true,
          data: (resolvedData ?? null) as T | null,
          message: parseMessage(json, 'ok'),
        };
      }
      message = parseMessage(json, `HTTP ${res.status}`);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
  }
  return { ok: false, data: null, message };
}

function normalizeNonNegativeCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
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

function toCommentItem(input: ApiGameReviewCommentPayload): GameReviewCommentItem {
  return {
    id: String(input._id || input.id || ''),
    user: {
      name: String(input.user_name || input.username || '').trim() || '匿名用户',
      avatarUrl: String(input.user_avatar || input.avatar || '').trim() || FALLBACK_AVATAR,
      dataAiHint: 'user avatar',
    },
    timestamp: formatTimestamp(String(input.created_at || input.createdAt || '').trim()),
    text: String(input.content || input.text || '').trim(),
    likeCount: normalizeNonNegativeCount(input.like_count ?? input.likeCount),
  };
}

function toReplyItem(reply: ApiGameReviewCommentPayload): GameReviewCommentItem {
  const item = toCommentItem(reply);
  const replyTo = String(reply.reply_to_user_name || '').trim();
  return {
    ...item,
    text: `${replyTo ? `回复 @${replyTo}：` : ''}${item.text}`,
  };
}

function toCommentThreads(list: ApiGameReviewCommentPayload[]): GameReviewCommentThread[] {
  return (list || []).map((comment) => {
    const base = toCommentItem(comment);
    const replies = (comment.replies || []).map(toReplyItem);
    const replyTotal = Math.max(
      normalizeNonNegativeCount(comment.reply_total),
      replies.length,
    );
    const replyPageSize = Math.max(
      1,
      normalizeNonNegativeCount(comment.reply_page_size) || replies.length || 20,
    );
    const replyHasMore =
      typeof comment.reply_has_more === 'boolean'
        ? comment.reply_has_more
        : replyTotal > replies.length;
    return {
      ...base,
      replies,
      replyTotal,
      replyHasMore,
      replyPageSize,
    };
  });
}

function getLocalCommentsStorageKey(identity: GameReviewIdentity): string {
  return `game-review:comments:${getIdentityKey(identity)}`;
}

function readLocalComments(identity: GameReviewIdentity): LocalGameCommentRecord[] {
  if (typeof window === 'undefined') return [];
  const key = getLocalCommentsStorageKey(identity);
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        id: String(item?.id || '').trim(),
        parentId: item?.parentId ? String(item.parentId).trim() : null,
        userName: String(item?.userName || '').trim() || '匿名用户',
        userAvatar: String(item?.userAvatar || '').trim() || FALLBACK_AVATAR,
        content: String(item?.content || '').trim(),
        createdAt: String(item?.createdAt || '').trim() || new Date().toISOString(),
        likeCount: normalizeNonNegativeCount(item?.likeCount),
      }))
      .filter((item) => Boolean(item.id) && Boolean(item.content));
  } catch {
    return [];
  }
}

function writeLocalComments(identity: GameReviewIdentity, comments: LocalGameCommentRecord[]) {
  if (typeof window === 'undefined') return;
  const key = getLocalCommentsStorageKey(identity);
  try {
    window.localStorage.setItem(key, JSON.stringify(comments.slice(0, 400)));
  } catch {}
}

function toLocalThreads(identity: GameReviewIdentity): GameReviewCommentThread[] {
  const records = readLocalComments(identity);
  const roots = records.filter((item) => !item.parentId);
  return roots.map((root) => {
    const replies = records
      .filter((item) => item.parentId === root.id)
      .map((reply) => ({
        id: reply.id,
        user: {
          name: reply.userName,
          avatarUrl: reply.userAvatar,
          dataAiHint: 'user avatar',
        },
        timestamp: formatTimestamp(reply.createdAt),
        text: reply.content,
        likeCount: reply.likeCount,
      }));
    return {
      id: root.id,
      user: {
        name: root.userName,
        avatarUrl: root.userAvatar,
        dataAiHint: 'user avatar',
      },
      timestamp: formatTimestamp(root.createdAt),
      text: root.content,
      likeCount: root.likeCount,
      replies,
      replyTotal: replies.length,
      replyHasMore: false,
      replyPageSize: 20,
    };
  });
}

function buildSummaryCandidates(identity: GameReviewIdentity): string[] {
  const query = buildIdentityQuery(identity).toString();
  const appId = String(identity.appId || '').trim();
  const pkg = String(identity.pkg || '').trim();
  const list = [
    `/game/reviews/summary?${query}`,
    `/game/review/summary?${query}`,
    `/content/game-reviews/summary?${query}`,
  ];
  if (appId) {
    list.push(`/game/reviews/apps/${encodeURIComponent(appId)}/summary`);
  }
  if (pkg) {
    list.push(`/game/reviews/pkg/${encodeURIComponent(pkg)}/summary`);
  }
  return Array.from(new Set(list));
}

function buildCommentsCandidates(
  identity: GameReviewIdentity,
  query: URLSearchParams,
): string[] {
  const appId = String(identity.appId || '').trim();
  const list = [
    `/game/reviews/comments?${query.toString()}`,
    `/game/review/comments?${query.toString()}`,
    `/content/game-reviews/comments?${query.toString()}`,
  ];
  if (appId) {
    list.push(`/game/reviews/apps/${encodeURIComponent(appId)}/comments?${query.toString()}`);
  }
  return Array.from(new Set(list));
}

function buildCommentRepliesCandidates(
  identity: GameReviewIdentity,
  rootCommentId: string,
  query: URLSearchParams,
): string[] {
  const appId = String(identity.appId || '').trim();
  const list = [
    `/game/reviews/comments/${rootCommentId}/replies?${query.toString()}`,
    `/game/review/comments/${rootCommentId}/replies?${query.toString()}`,
    `/content/game-reviews/comments/${rootCommentId}/replies?${query.toString()}`,
  ];
  if (appId) {
    list.push(`/game/reviews/apps/${encodeURIComponent(appId)}/comments/${rootCommentId}/replies?${query.toString()}`);
  }
  return Array.from(new Set(list));
}

function buildBreakdown(data: ApiGameReviewSummaryPayload | null): GameRatingBreakdown {
  const source = data?.distribution || data?.stars || {};
  return {
    1: normalizeNonNegativeCount(source[1]),
    2: normalizeNonNegativeCount(source[2]),
    3: normalizeNonNegativeCount(source[3]),
    4: normalizeNonNegativeCount(source[4]),
    5: normalizeNonNegativeCount(source[5]),
  };
}

function parseSummary(data: ApiGameReviewSummaryPayload | null, identity: GameReviewIdentity): GameReviewSummary {
  const ratingCount = normalizeNonNegativeCount(data?.rating_count);
  const breakdown = buildBreakdown(data);
  const computed = computeGameRating({
    manualScore: data?.manual_score ?? identity.manualScore,
    userAverage: data?.user_average ?? data?.user_avg ?? data?.rating ?? data?.rating_value,
    ratingCount,
    ratingBreakdown: breakdown,
  });
  return {
    ...computed,
    myRating: normalizeToFiveStar(data?.my_rating),
    myRatedAt: String(data?.my_rated_at || '').trim() || undefined,
  };
}

function getLocalUserRatingKey(identity: GameReviewIdentity): string {
  return `game-review:my-rating:${getIdentityKey(identity)}`;
}

function readLocalUserRating(identity: GameReviewIdentity): number | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeToFiveStar(window.localStorage.getItem(getLocalUserRatingKey(identity)));
  } catch {
    return null;
  }
}

function writeLocalUserRating(identity: GameReviewIdentity, rating: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getLocalUserRatingKey(identity), String(rating));
  } catch {}
}

export async function getGameReviewSummary(identity: GameReviewIdentity): Promise<GameReviewSummary> {
  const result = await requestCandidates<ApiGameReviewSummaryPayload>(
    buildSummaryCandidates(identity),
    {
      method: 'GET',
      cache: 'no-store',
    },
  );
  if (result.ok) {
    return parseSummary(result.data, identity);
  }
  const localRating = readLocalUserRating(identity);
  const fallback = computeGameRating({
    manualScore: localRating ?? identity.manualScore,
    userAverage: localRating ?? identity.manualScore,
    ratingCount: localRating ? 1 : 0,
    ratingBreakdown: localRating
      ? {
          1: localRating < 1.5 ? 1 : 0,
          2: localRating >= 1.5 && localRating < 2.5 ? 1 : 0,
          3: localRating >= 2.5 && localRating < 3.5 ? 1 : 0,
          4: localRating >= 3.5 && localRating < 4.5 ? 1 : 0,
          5: localRating >= 4.5 ? 1 : 0,
        }
      : null,
  });
  return {
    ...fallback,
    myRating: localRating,
  };
}

export async function submitGameRating(params: {
  token: string;
  identity: GameReviewIdentity;
  rating: number;
}): Promise<{ ok: boolean; message: string; summary: GameReviewSummary | null }> {
  const token = String(params.token || '').trim();
  const rating = normalizeToFiveStar(params.rating);
  if (!token || rating === null) {
    return { ok: false, message: '参数不完整', summary: null };
  }
  const identity = params.identity;
  const payload = {
    app_id: String(identity.appId || '').trim() || undefined,
    pkg: String(identity.pkg || '').trim() || undefined,
    app_name: String(identity.gameName || '').trim() || undefined,
    rating,
  };
  const body = JSON.stringify(payload);
  const candidates = [
    '/game/reviews/rating',
    '/game/review/rating',
    '/content/game-reviews/rating',
  ];
  const result = await requestCandidates<ApiGameReviewSummaryPayload>(candidates, {
    method: 'POST',
    headers: {
      ...buildTrackingHeaders(),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (result.ok) {
    return {
      ok: true,
      message: result.message || '评分成功',
      summary: parseSummary(result.data, { ...identity, manualScore: identity.manualScore }),
    };
  }

  writeLocalUserRating(identity, rating);
  const summary = await getGameReviewSummary(identity);
  return {
    ok: true,
    message: '评分已保存到本地',
    summary: {
      ...summary,
      myRating: rating,
    },
  };
}

export async function getGameReviewCommentThreads(
  identity: GameReviewIdentity,
  pageSize = 20,
  replyPageSize = 20,
  sort: 'latest' | 'hot' = 'latest',
): Promise<GameReviewCommentThread[]> {
  const query = buildIdentityQuery(identity);
  query.set('page', '1');
  query.set('pageSize', String(Math.min(100, Math.max(1, pageSize))));
  query.set('replyPageSize', String(Math.min(100, Math.max(1, replyPageSize))));
  query.set('sort', sort);

  const result = await requestCandidates<{ list?: ApiGameReviewCommentPayload[] }>(
    buildCommentsCandidates(identity, query),
    {
      method: 'GET',
      cache: 'no-store',
    },
  );
  if (result.ok) {
    const rawList = Array.isArray(result.data)
      ? (result.data as unknown as ApiGameReviewCommentPayload[])
      : Array.isArray((result.data as { list?: unknown } | null)?.list)
        ? ((result.data as { list?: ApiGameReviewCommentPayload[] }).list || [])
        : [];
    return toCommentThreads(rawList);
  }
  return toLocalThreads(identity);
}

export async function getGameReviewCommentReplies(
  identity: GameReviewIdentity,
  rootCommentId: string,
  page = 1,
  pageSize = 20,
  sort: 'latest' | 'hot' = 'latest',
): Promise<GameReviewCommentRepliesResult> {
  const commentId = String(rootCommentId || '').trim();
  if (!commentId) {
    return { rootComment: null, list: [], total: 0, page: 1, pageSize };
  }
  const query = buildIdentityQuery(identity);
  query.set('page', String(Math.max(1, Number(page) || 1)));
  query.set('pageSize', String(Math.min(100, Math.max(1, Number(pageSize) || 20))));
  query.set('sort', sort);

  const result = await requestCandidates<{
    root_comment?: ApiGameReviewCommentPayload | null;
    list?: ApiGameReviewCommentPayload[];
    total?: number;
    page?: number;
    pageSize?: number;
  }>(buildCommentRepliesCandidates(identity, commentId, query), {
    method: 'GET',
    cache: 'no-store',
  });

  if (result.ok) {
    const rawList = Array.isArray(result.data)
      ? (result.data as unknown as ApiGameReviewCommentPayload[])
      : Array.isArray(result.data?.list)
        ? result.data!.list!
        : [];
    return {
      rootComment: result.data?.root_comment ? toCommentItem(result.data.root_comment) : null,
      list: rawList.map(toReplyItem),
      total: Math.max(normalizeNonNegativeCount(result.data?.total), rawList.length),
      page: Math.max(1, Number(result.data?.page || page || 1)),
      pageSize: Math.max(1, Number(result.data?.pageSize || pageSize || 20)),
    };
  }

  const localThreads = toLocalThreads(identity);
  const thread = localThreads.find((item) => item.id === commentId);
  const fallbackList = thread?.replies || [];
  return {
    rootComment: thread || null,
    list: fallbackList,
    total: fallbackList.length,
    page: 1,
    pageSize: Math.max(1, Number(pageSize || 20)),
  };
}

export async function submitGameReviewComment(params: {
  token: string;
  identity: GameReviewIdentity;
  content: string;
  parentId?: string | null;
  emailNotify?: boolean;
  userName?: string | null;
  userAvatar?: string | null;
}): Promise<{ ok: boolean; message: string }> {
  const token = String(params.token || '').trim();
  const content = String(params.content || '').trim();
  const parentId = String(params.parentId || '').trim();
  if (!token || !content) {
    return { ok: false, message: '参数不完整' };
  }
  const identity = params.identity;
  const payload = {
    app_id: String(identity.appId || '').trim() || undefined,
    pkg: String(identity.pkg || '').trim() || undefined,
    app_name: String(identity.gameName || '').trim() || undefined,
    content,
    parent_id: parentId || undefined,
    email_notify: Boolean(params.emailNotify),
  };
  const body = JSON.stringify(payload);
  const result = await requestCandidates<any>(
    ['/game/reviews/comments', '/game/review/comments', '/content/game-reviews/comments'],
    {
      method: 'POST',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    },
  );
  if (result.ok) {
    return { ok: true, message: result.message || '评论成功' };
  }

  const local = readLocalComments(identity);
  local.unshift({
    id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    parentId: parentId || null,
    userName: String(params.userName || '').trim() || '当前用户',
    userAvatar: String(params.userAvatar || '').trim() || FALLBACK_AVATAR,
    content,
    createdAt: new Date().toISOString(),
    likeCount: 0,
  });
  writeLocalComments(identity, local);
  return { ok: true, message: '评论已保存到本地' };
}

export async function toggleGameReviewCommentLike(params: {
  token: string;
  commentId: string;
}): Promise<{ ok: boolean; liked: boolean | null; likeCount: number | null; message: string }> {
  const token = String(params.token || '').trim();
  const commentId = String(params.commentId || '').trim();
  if (!token || !commentId) {
    return { ok: false, liked: null, likeCount: null, message: '参数不完整' };
  }
  const result = await requestCandidates<{ liked?: boolean; like_count?: number }>(
    [
      `/game/reviews/comments/${commentId}/like`,
      `/game/review/comments/${commentId}/like`,
      `/content/game-reviews/comments/${commentId}/like`,
    ],
    {
      method: 'POST',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'toggle' }),
    },
  );
  if (!result.ok) {
    return { ok: false, liked: null, likeCount: null, message: result.message };
  }
  const likeCount = result.data?.like_count;
  return {
    ok: true,
    liked: typeof result.data?.liked === 'boolean' ? result.data?.liked : null,
    likeCount: Number.isFinite(Number(likeCount)) ? Number(likeCount) : null,
    message: result.message || '操作成功',
  };
}

export async function getGameReviewCommentLikeStatuses(params: {
  token: string;
  commentIds: string[];
}): Promise<Record<string, boolean>> {
  const token = String(params.token || '').trim();
  const commentIds = Array.from(
    new Set(
      (params.commentIds || [])
        .map((id) => String(id || '').trim())
        .filter((id) => Boolean(id) && (MONGO_OBJECT_ID_PATTERN.test(id) || id.startsWith('local-'))),
    ),
  ).slice(0, 200);
  if (!token || commentIds.length === 0) return {};

  const result = await requestCandidates<{ liked_ids?: string[] }>(
    [
      '/game/reviews/comments/like-status-batch',
      '/game/review/comments/like-status-batch',
      '/content/game-reviews/comments/like-status-batch',
    ],
    {
      method: 'POST',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: commentIds }),
      cache: 'no-store',
    },
  );
  if (!result.ok) return {};
  const likedIds = Array.isArray(result.data?.liked_ids) ? result.data!.liked_ids! : [];
  const map: Record<string, boolean> = {};
  likedIds.forEach((id) => {
    const key = String(id || '').trim();
    if (!key) return;
    map[key] = true;
  });
  return map;
}

function readLocalBoolean(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeLocalBoolean(key: string, value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch {}
}

export async function getGameReviewEmailPreference(token: string): Promise<{ enabled: boolean; source: 'remote' | 'local' }> {
  const auth = String(token || '').trim();
  if (!auth) return { enabled: readLocalBoolean(USER_EMAIL_PREF_LOCAL_KEY), source: 'local' };
  const result = await requestCandidates<{
    notification_email_enabled?: boolean;
    reply_email_enabled?: boolean;
  }>(
    ['/users/preferences/game-reviews', '/users/preferences/notifications', '/game/reviews/preferences'],
    {
      method: 'GET',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${auth}`,
      },
      cache: 'no-store',
    },
  );
  if (!result.ok) return { enabled: readLocalBoolean(USER_EMAIL_PREF_LOCAL_KEY), source: 'local' };
  const enabled = Boolean(result.data?.notification_email_enabled ?? result.data?.reply_email_enabled);
  writeLocalBoolean(USER_EMAIL_PREF_LOCAL_KEY, enabled);
  return { enabled, source: 'remote' };
}

export async function updateGameReviewEmailPreference(params: {
  token: string;
  enabled: boolean;
}): Promise<{ ok: boolean; enabled: boolean; source: 'remote' | 'local'; message: string }> {
  const auth = String(params.token || '').trim();
  if (!auth) {
    writeLocalBoolean(USER_EMAIL_PREF_LOCAL_KEY, Boolean(params.enabled));
    return { ok: true, enabled: Boolean(params.enabled), source: 'local', message: '已保存到本地' };
  }
  const body = JSON.stringify({
    notification_email_enabled: Boolean(params.enabled),
    reply_email_enabled: Boolean(params.enabled),
  });
  const result = await requestCandidates<any>(
    ['/users/preferences/game-reviews', '/users/preferences/notifications', '/game/reviews/preferences'],
    {
      method: 'PATCH',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    },
  );
  if (!result.ok) {
    writeLocalBoolean(USER_EMAIL_PREF_LOCAL_KEY, Boolean(params.enabled));
    return { ok: true, enabled: Boolean(params.enabled), source: 'local', message: '已保存到本地' };
  }
  writeLocalBoolean(USER_EMAIL_PREF_LOCAL_KEY, Boolean(params.enabled));
  return { ok: true, enabled: Boolean(params.enabled), source: 'remote', message: result.message || '保存成功' };
}

export async function getGameReviewAdminEmailSwitch(token: string): Promise<{ enabled: boolean | null; source: 'remote' | 'local' }> {
  const auth = String(token || '').trim();
  if (!auth) return { enabled: readLocalBoolean(ADMIN_EMAIL_SWITCH_LOCAL_KEY), source: 'local' };
  const result = await requestCandidates<{ game_review_email_enabled?: boolean }>(
    ['/admin/game-reviews/settings', '/game/reviews/admin/settings'],
    {
      method: 'GET',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${auth}`,
      },
      cache: 'no-store',
    },
  );
  if (!result.ok) return { enabled: readLocalBoolean(ADMIN_EMAIL_SWITCH_LOCAL_KEY), source: 'local' };
  const enabled = Boolean(result.data?.game_review_email_enabled);
  writeLocalBoolean(ADMIN_EMAIL_SWITCH_LOCAL_KEY, enabled);
  return { enabled, source: 'remote' };
}

export async function updateGameReviewAdminEmailSwitch(params: {
  token: string;
  enabled: boolean;
}): Promise<{ ok: boolean; enabled: boolean; source: 'remote' | 'local'; message: string }> {
  const auth = String(params.token || '').trim();
  if (!auth) {
    return { ok: false, enabled: Boolean(params.enabled), source: 'local', message: '登录状态已失效' };
  }
  const body = JSON.stringify({ game_review_email_enabled: Boolean(params.enabled) });
  const result = await requestCandidates<any>(
    ['/admin/game-reviews/settings', '/game/reviews/admin/settings'],
    {
      method: 'PATCH',
      headers: {
        ...buildTrackingHeaders(),
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    },
  );
  if (!result.ok) {
    writeLocalBoolean(ADMIN_EMAIL_SWITCH_LOCAL_KEY, Boolean(params.enabled));
    return { ok: true, enabled: Boolean(params.enabled), source: 'local', message: '已保存到本地' };
  }
  writeLocalBoolean(ADMIN_EMAIL_SWITCH_LOCAL_KEY, Boolean(params.enabled));
  return { ok: true, enabled: Boolean(params.enabled), source: 'remote', message: result.message || '保存成功' };
}
