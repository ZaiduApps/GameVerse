import type { CommunityTopicItem } from '@/lib/community-api';
import type { CommunityPost } from '@/types';

export type CommunityFeedTab = 'latest' | 'hot';

export interface CommunityReturnFeedState {
  posts: CommunityPost[];
  page: number;
  total: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CommunityReturnSnapshot {
  version: 1;
  sourcePath: '/community';
  targetPostId: string;
  activeFeedTab: CommunityFeedTab;
  selectedTopic: CommunityTopicItem | null;
  selectedTopicId: string;
  latest: CommunityReturnFeedState;
  hot: CommunityReturnFeedState;
  scrollY: number;
  createdAt: number;
}

interface CommunityReturnIntent {
  version: 1;
  sourcePath: '/community';
  targetPostId: string;
  createdAt: number;
}

const COMMUNITY_RETURN_SNAPSHOT_KEY = 'community:return-snapshot:v1';
const COMMUNITY_RETURN_INTENT_KEY = 'community:return-intent:v1';
const COMMUNITY_RETURN_RESTORE_KEY = 'community:return-restore:v1';
const COMMUNITY_RETURN_SNAPSHOT_TTL_MS = 30 * 60 * 1000;
const COMMUNITY_RETURN_RESTORE_TTL_MS = 30 * 1000;

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string): T | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // 忽略会话存储容量或权限异常，继续使用普通返回逻辑。
  }
}

function removeItem(key: string) {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // 忽略会话存储权限异常。
  }
}

function isFresh(createdAt: unknown, ttl: number): boolean {
  const timestamp = Number(createdAt || 0);
  return Number.isFinite(timestamp) && timestamp > 0 && Date.now() - timestamp <= ttl;
}

function normalizePostId(postId: string): string {
  return String(postId || '').trim();
}

function matchesPostId(value: unknown, postId: string): boolean {
  const expected = normalizePostId(postId);
  return Boolean(expected && normalizePostId(String(value || '')) === expected);
}

function isValidIntent(intent: CommunityReturnIntent | null, postId: string): intent is CommunityReturnIntent {
  return Boolean(
    intent &&
      intent.version === 1 &&
      intent.sourcePath === '/community' &&
      matchesPostId(intent.targetPostId, postId) &&
      isFresh(intent.createdAt, COMMUNITY_RETURN_SNAPSHOT_TTL_MS),
  );
}

function isValidSnapshot(snapshot: CommunityReturnSnapshot | null): snapshot is CommunityReturnSnapshot {
  return Boolean(
    snapshot &&
      snapshot.version === 1 &&
      snapshot.sourcePath === '/community' &&
      normalizePostId(snapshot.targetPostId) &&
      isFresh(snapshot.createdAt, COMMUNITY_RETURN_SNAPSHOT_TTL_MS) &&
      Array.isArray(snapshot.latest?.posts) &&
      Array.isArray(snapshot.hot?.posts),
  );
}

export function writeCommunityReturnSnapshot(snapshot: Omit<CommunityReturnSnapshot, 'version' | 'sourcePath' | 'createdAt'>) {
  const targetPostId = normalizePostId(snapshot.targetPostId);
  if (!targetPostId) return;

  const next: CommunityReturnSnapshot = {
    ...snapshot,
    version: 1,
    sourcePath: '/community',
    targetPostId,
    createdAt: Date.now(),
  };

  writeJson(COMMUNITY_RETURN_SNAPSHOT_KEY, next);
  writeJson(COMMUNITY_RETURN_INTENT_KEY, {
    version: 1,
    sourcePath: '/community',
    targetPostId,
    createdAt: next.createdAt,
  } satisfies CommunityReturnIntent);
}

export function hasValidCommunityReturnIntent(postId: string): boolean {
  const intent = readJson<CommunityReturnIntent>(COMMUNITY_RETURN_INTENT_KEY);
  return isValidIntent(intent, postId);
}

export function requestCommunityReturnRestore(postId: string) {
  const intent = readJson<CommunityReturnIntent>(COMMUNITY_RETURN_INTENT_KEY);
  if (!isValidIntent(intent, postId)) return false;
  writeJson(COMMUNITY_RETURN_RESTORE_KEY, {
    version: 1,
    sourcePath: '/community',
    targetPostId: normalizePostId(postId),
    createdAt: Date.now(),
  } satisfies CommunityReturnIntent);
  return true;
}

export function readCommunityReturnSnapshotForRestore(): CommunityReturnSnapshot | null {
  const restoreRequest = readJson<CommunityReturnIntent>(COMMUNITY_RETURN_RESTORE_KEY);
  removeItem(COMMUNITY_RETURN_RESTORE_KEY);

  if (
    !restoreRequest ||
    restoreRequest.version !== 1 ||
    restoreRequest.sourcePath !== '/community' ||
    !isFresh(restoreRequest.createdAt, COMMUNITY_RETURN_RESTORE_TTL_MS)
  ) {
    return null;
  }

  const snapshot = readJson<CommunityReturnSnapshot>(COMMUNITY_RETURN_SNAPSHOT_KEY);
  if (!isValidSnapshot(snapshot)) return null;
  if (!matchesPostId(snapshot.targetPostId, restoreRequest.targetPostId)) return null;
  return snapshot;
}

