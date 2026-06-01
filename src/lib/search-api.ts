import { trackedApiFetch } from '@/lib/api';
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
  const title = String(input?.title || '').trim();
  const type = input?.type;

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

  const response = await trackedApiFetch(`/search/global?${query.toString()}`, {
    signal: params.signal,
    timeoutMs: 12000,
    logKey: 'search-global',
  });

  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`);
  }

  const payload = await response.json().catch(() => null);
  if (!payload || payload?.code !== 0) {
    throw new Error(String(payload?.message || 'Search response is invalid'));
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
