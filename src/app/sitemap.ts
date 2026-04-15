import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/seo';

type GameSitemapItem = {
  pkg?: string;
  updated_at?: string;
  latest_at?: string;
  created_at?: string;
  status?: number;
  is_deleted?: number | boolean;
};

type PagedList<T> = {
  list?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
};

const FALLBACK_STATIC_PATHS = ['/', '/app', '/community', '/news', '/rankings', '/submit-resource', '/download/app'];
const SITEMAP_PAGE_SIZE = 500;
const SITEMAP_MAX_PAGES = 200;

function getServerApiBaseUrl() {
  const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
  const base = (
    process.env.API_BASE_URL ||
    (appEnv === 'production'
      ? process.env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
      : process.env.API_BASE_URL_DEV || 'http://127.0.0.1:9527')
  ).replace(/\/+$/, '');
  return base;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeListData<T>(payload: any): PagedList<T> {
  const data = payload?.data;
  if (Array.isArray(data)) {
    return { list: data as T[] };
  }
  if (data && typeof data === 'object') {
    return {
      list: Array.isArray(data.list) ? (data.list as T[]) : [],
      total: Number(data.total || 0),
      page: Number(data.page || 1),
      pageSize: Number(data.pageSize || 0),
    };
  }
  return { list: [] };
}

async function fetchJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${getServerApiBaseUrl()}${path}`, {
      cache: 'no-store',
      headers: {
        'x-tracking-skip': '1',
        'x-client-platform': 'web',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function toGameEntry(item: GameSitemapItem): MetadataRoute.Sitemap[number] | null {
  const pkg = String(item?.pkg || '').trim();
  if (!pkg) return null;
  const isDeleted = item?.is_deleted === true || Number(item?.is_deleted || 0) === 1;
  if (isDeleted) return null;
  if (item?.status !== undefined && Number(item.status) !== 1) return null;

  const lastmod = parseDate(item.updated_at) || parseDate(item.latest_at) || parseDate(item.created_at);
  return {
    url: absoluteUrl(`/app/${encodeURIComponent(pkg)}`),
    lastModified: lastmod,
    changeFrequency: 'daily',
    priority: 0.8,
  };
}

async function fetchGamesFromSeoEndpoint(): Promise<MetadataRoute.Sitemap[number][]> {
  const result: MetadataRoute.Sitemap[number][] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= SITEMAP_MAX_PAGES; page += 1) {
    const json = await fetchJson(`/seo/sitemap/games?page=${page}&pageSize=${SITEMAP_PAGE_SIZE}`);
    if (!json || (json.code !== 0 && json.code !== undefined)) break;

    const { list, total, pageSize } = normalizeListData<GameSitemapItem>(json);
    const safeList = Array.isArray(list) ? list : [];
    if (safeList.length === 0) break;

    for (const item of safeList) {
      const entry = toGameEntry(item);
      if (!entry) continue;
      if (seen.has(entry.url)) continue;
      seen.add(entry.url);
      result.push(entry);
    }

    if (total && page * (pageSize || SITEMAP_PAGE_SIZE) >= total) break;
    if (safeList.length < SITEMAP_PAGE_SIZE) break;
  }

  return result;
}

async function fetchGamesFromListFallback(): Promise<MetadataRoute.Sitemap[number][]> {
  const json = await fetchJson('/game/list');
  if (!json || (json.code !== 0 && json.code !== undefined)) return [];

  const { list } = normalizeListData<GameSitemapItem>(json);
  const safeList = Array.isArray(list) ? list : [];
  const result: MetadataRoute.Sitemap[number][] = [];
  const seen = new Set<string>();

  for (const item of safeList) {
    const entry = toGameEntry(item);
    if (!entry) continue;
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    result.push(entry);
  }

  return result;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = FALLBACK_STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === '/' ? 'hourly' : 'daily',
    priority: path === '/' ? 1 : 0.7,
  }));

  const dynamicEntries = await fetchGamesFromSeoEndpoint();
  if (dynamicEntries.length > 0) {
    return [...staticEntries, ...dynamicEntries];
  }

  const fallbackEntries = await fetchGamesFromListFallback();
  return [...staticEntries, ...fallbackEntries];
}

