import { cache } from 'react';

import { trackedApiFetch } from '@/lib/api';
import { getSiteShareImageUrl, normalizeSeoAssetUrl, resolveGameSeoImage, sanitizeSeoText } from '@/lib/seo';
import type { ApiAlbum, ApiGame, ApiResponse } from '@/types';

const ALBUM_REVALIDATE_SECONDS = 300;
const ALBUM_TIMEOUT_MS = 10000;

function normalizeText(value?: string | null): string {
  return String(value || '').trim();
}

function collectAlbumGameTags(games: ApiGame[]): string[] {
  return Array.from(
    new Set(
      games
        .flatMap((game) => (Array.isArray(game?.tags) ? game.tags : []))
        .map((tag) => normalizeText(tag))
        .filter(Boolean),
    ),
  );
}

function normalizeAlbumData(album: ApiAlbum): ApiAlbum {
  return {
    ...album,
    title: normalizeText(album?.title),
    subtitle: normalizeText(album?.subtitle),
    description: normalizeText(album?.description),
    cover: normalizeText(album?.cover),
    icon: normalizeText(album?.icon),
    mode: normalizeText(album?.mode),
    style: normalizeText(album?.style) || 'Grid',
    tags: Array.isArray(album?.tags)
      ? album.tags.map((tag) => normalizeText(tag)).filter(Boolean)
      : [],
    games: normalizeAlbumGames(album),
  };
}

const loadAlbumDetail = cache(async (albumId: string, revalidate: number): Promise<ApiAlbum | null> => {
  const safeAlbumId = normalizeText(albumId);
  if (!safeAlbumId) return null;

  try {
    const res = await trackedApiFetch(`/albums/album-details/${encodeURIComponent(safeAlbumId)}`, {
      cache: 'force-cache',
      next: { revalidate },
      timeoutMs: ALBUM_TIMEOUT_MS,
      logKey: 'album-detail',
    });
    if (!res.ok) return null;

    const json = (await res.json().catch(() => null)) as ApiResponse<ApiAlbum> | null;
    if (!json || Number(json.code ?? -1) !== 0 || !json.data) return null;

    return normalizeAlbumData(json.data);
  } catch {
    return null;
  }
});

export async function getAlbumDetail(
  albumId: string,
  revalidate = ALBUM_REVALIDATE_SECONDS,
): Promise<ApiAlbum | null> {
  return loadAlbumDetail(albumId, Math.max(1, Number(revalidate) || ALBUM_REVALIDATE_SECONDS));
}

export function getAlbumHref(input: Pick<ApiAlbum, '_id'> | string): string {
  const albumId = typeof input === 'string' ? input : input?._id;
  const safeAlbumId = normalizeText(albumId);
  return safeAlbumId ? `/albums/${encodeURIComponent(safeAlbumId)}` : '/app';
}

export function normalizeAlbumGames(album: ApiAlbum | null | undefined): ApiGame[] {
  const source = Array.isArray(album?.games) ? album.games : [];
  const deduped = new Map<string, ApiGame>();

  for (const game of source) {
    const key = normalizeText(game?.pkg || game?._id);
    if (!key || deduped.has(key)) continue;
    if (!normalizeText(game?.name)) continue;
    deduped.set(key, game);
  }

  return Array.from(deduped.values());
}

export function getAlbumDescription(album: ApiAlbum | null | undefined): string {
  const description = sanitizeSeoText(album?.description);
  if (description) return description;

  const subtitle = sanitizeSeoText(album?.subtitle);
  if (subtitle) return subtitle;

  const title = normalizeText(album?.title) || '专题推荐';
  const games = normalizeAlbumGames(album);
  if (games.length === 0) return `${title}合集。`;

  const gameNames = games
    .slice(0, 3)
    .map((game) => normalizeText(game?.name))
    .filter(Boolean);
  const primaryTag = collectAlbumGameTags(games)[0] || '';

  const text = [
    `${title}专题当前收录 ${games.length} 款精选内容。`,
    primaryTag ? `覆盖 ${primaryTag} 等方向。` : '',
    gameNames.length > 0 ? `可快速查看 ${gameNames.join('、')} 等热门作品。` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return sanitizeSeoText(text);
}

export function getAlbumShareImage(album: ApiAlbum | null | undefined, siteShareImage?: string | null): string {
  const albumImage = normalizeSeoAssetUrl(album?.cover) || normalizeSeoAssetUrl(album?.icon);
  if (albumImage) return albumImage;

  const games = normalizeAlbumGames(album);
  for (const game of games) {
    const gameImage = resolveGameSeoImage(game, siteShareImage);
    if (gameImage) return gameImage;
  }

  return getSiteShareImageUrl(siteShareImage);
}

export function getAlbumStyleLabel(style?: string | null): string {
  const normalized = normalizeText(style).toLowerCase();
  if (normalized === 'box') return '热门榜单';
  if (normalized === 'pre') return '预约专题';
  if (normalized === 'list') return '工具精选';
  return '精选专题';
}

export function getAlbumKeywords(album: ApiAlbum | null | undefined): string[] {
  const title = normalizeText(album?.title);
  const subtitle = normalizeText(album?.subtitle);
  const tags = Array.isArray(album?.tags)
    ? album.tags.map((tag) => normalizeText(tag)).filter(Boolean)
    : [];
  const games = normalizeAlbumGames(album);
  const gameNames = games
    .slice(0, 6)
    .map((game) => normalizeText(game?.name))
    .filter(Boolean);
  const gameTags = collectAlbumGameTags(games).slice(0, 8);

  return Array.from(
    new Set(
      [
        title,
        title ? `${title}专题` : '',
        title ? `${title}游戏合集` : '',
        subtitle,
        ...tags,
        ...gameNames,
        ...gameTags,
      ].filter(Boolean),
    ),
  );
}
