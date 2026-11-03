import { trackedApiFetch } from '@/lib/api';
import { resolveGameName } from '@/lib/game-display-name';
import type { SearchResult } from '@/types';

export interface GlobalSearchSection {
  list: SearchResult[];
  total: number;
}

export interface GlobalSearchResult {
  q: string;
  limitPerType: number;
  total: number;
  games: GlobalSearchSection;
  articles: GlobalSearchSection;
  posts: GlobalSearchSection;
  topics: GlobalSearchSection;
}

interface ApiSearchItem {
  id?: string;
  title?: string;
  type?: SearchResult['type'];
  category?: string;
  imageUrl?: string;
  subtitle?: string;
  href?: string;
  pkg?: string;
  region?: string;
  rating?: number;
  version?: string;
  fileSize?: number | null;
  latestAt?: string;
  sourceType?: string;
  metadata?: {
    chs?: string;
    cht?: string;
    en?: string;
    region?: string;
  };
}

interface ApiSearchSection {
  list?: ApiSearchItem[];
  total?: number;
}

function createEmptySection(): GlobalSearchSection {
  return {
    list: [],
    total: 0,
  };
}

/**
 * 搜索接口失败（HTTP 非 2xx 或业务 code 非 0）。
 *
 * 调用方必须能区分「请求失败」与「确实没有结果」：过去两者都被 catch 成空态，
 * 限流时浮层显示「未找到相关结果」，用户会以为站点里没有这个游戏。
 */
export class SearchApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'SearchApiError';
    this.status = status;
  }
}

export function createEmptyGlobalSearchResult(q = '', limitPerType = 6): GlobalSearchResult {
  return {
    q,
    limitPerType,
    total: 0,
    games: createEmptySection(),
    articles: createEmptySection(),
    posts: createEmptySection(),
    topics: createEmptySection(),
  };
}

function normalizeItem(input: ApiSearchItem): SearchResult | null {
  const id = String(input?.id || '').trim();
  const type = input?.type;

  // 游戏条目的 title 是 Google Play 原名，与列表/详情页展示的名字对不上。
  // 这里就地换成展示名，搜索结果的所有消费方不必再各自处理一遍。
  const title =
    type === 'game'
      ? resolveGameName({
          metadata: input?.metadata,
          name: input?.title,
          pkg: input?.pkg,
        })
      : String(input?.title || '').trim();

  if (!id || !title || !type) {
    return null;
  }

  return {
    id,
    title,
    type,
    category: String(input?.category || '').trim() || '搜索结果',
    imageUrl: String(input?.imageUrl || '').trim(),
    subtitle: String(input?.subtitle || '').trim() || undefined,
    href: String(input?.href || '').trim() || undefined,
    pkg: String(input?.pkg || '').trim() || undefined,
    region: String(input?.region || '').trim() || undefined,
    rating:
      input?.rating === undefined || input?.rating === null
        ? undefined
        : Number(input.rating),
    version: String(input?.version || '').trim() || undefined,
    fileSize: input?.fileSize ?? undefined,
    latestAt: String(input?.latestAt || '').trim() || undefined,
    sourceType: String(input?.sourceType || '').trim() || undefined,
  };
}

function normalizeSection(input?: ApiSearchSection): GlobalSearchSection {
  return {
    list: Array.isArray(input?.list)
      ? input.list
          .map((item) => normalizeItem(item))
          .filter((item): item is SearchResult => Boolean(item))
      : [],
    total: Number(input?.total || 0),
  };
}

export async function searchGlobal(params: {
  q: string;
  limitPerType?: number;
  signal?: AbortSignal;
  /**
   * SSR 场景透传访客 IP。后端按 IP 分限流桶；服务端直连 127.0.0.1 时不带这个头，
   * 全站访客会共用一个桶。原样转发 X-Forwarded-For 链，由后端 trust proxy 取真实访客。
   */
  forwardedFor?: string;
}): Promise<GlobalSearchResult> {
  const q = String(params.q || '').trim();
  const limitPerType = Math.min(12, Math.max(1, Number(params.limitPerType || 6)));

  if (q.length < 2) {
    return createEmptyGlobalSearchResult(q, limitPerType);
  }

  const query = new URLSearchParams({
    q,
    limitPerType: String(limitPerType),
  });

  const forwardedFor = String(params.forwardedFor || '').trim();

  const response = await trackedApiFetch(`/search/global?${query.toString()}`, {
    signal: params.signal,
    timeoutMs: 12000,
    logKey: 'search-global',
    ...(forwardedFor ? { headers: { 'x-forwarded-for': forwardedFor } } : {}),
  });

  if (!response.ok) {
    throw new SearchApiError(`Search request failed with status ${response.status}`, response.status);
  }

  const payload = await response.json().catch(() => null);
  if (!payload || payload?.code !== 0) {
    throw new SearchApiError(String(payload?.message || 'Search response is invalid'), response.status);
  }

  const data = payload?.data || {};

  return {
    q: String(data?.q || q).trim(),
    limitPerType: Number(data?.limitPerType || limitPerType),
    total: Number(data?.total || 0),
    games: normalizeSection(data?.games),
    articles: normalizeSection(data?.articles),
    posts: normalizeSection(data?.posts),
    topics: normalizeSection(data?.topics),
  };
}
