'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download, Star } from 'lucide-react';

import type { ApiGame } from '@/types';

const PAGE_SIZE_DESKTOP = 6;
const PAGE_SIZE_MOBILE = 4;

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  if (diffMs <= 0) return formatDate(dateStr);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}分钟前`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}小时前`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}天前`;
  return formatDate(dateStr);
}

function formatBytes(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const fixed = size >= 100 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(fixed)} ${units[unitIndex]}`;
}

interface RecentUpdatesSectionProps {
  title: string;
  games: ApiGame[];
  fallbackImage: string;
  viewAllHref?: string;
  viewAllText?: string;
}

function getGameHref(game: ApiGame): string {
  const target = String(game.pkg || game._id || '').trim();
  if (!target) return '/app';
  return `/app/${encodeURIComponent(target)}`;
}

export default function RecentUpdatesSection({
  title,
  games,
  fallbackImage,
  viewAllHref,
  viewAllText = '查看全部',
}: RecentUpdatesSectionProps) {
  const [desktopPage, setDesktopPage] = useState(0);
  const [mobilePage, setMobilePage] = useState(0);

  const desktopTotalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE_DESKTOP));
  const mobileTotalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE_MOBILE));

  const desktopVisible = useMemo(() => {
    const start = desktopPage * PAGE_SIZE_DESKTOP;
    return games.slice(start, start + PAGE_SIZE_DESKTOP);
  }, [desktopPage, games]);

  const mobileVisible = useMemo(() => {
    const start = mobilePage * PAGE_SIZE_MOBILE;
    return games.slice(start, start + PAGE_SIZE_MOBILE);
  }, [mobilePage, games]);

  const toPrevPage = () => {
    setDesktopPage((prev) => (prev - 1 + desktopTotalPages) % desktopTotalPages);
    setMobilePage((prev) => (prev - 1 + mobileTotalPages) % mobileTotalPages);
  };

  const toNextPage = () => {
    setDesktopPage((prev) => (prev + 1) % desktopTotalPages);
    setMobilePage((prev) => (prev + 1) % mobileTotalPages);
  };

  const renderCards = (items: ApiGame[]) => (
    items.map((game) => {
      const version = String(game.version || '').trim();
      const updateTime = formatRelativeTime(game.latest_at);
      const region = String(game.metadata?.region || '').trim();
      const fileSize = String(game.file_size_text || '').trim() || formatBytes(game.file_size);
      const downloadCount = String(game.download_count_show || '').trim();
      const summary = String(game.summary || '').trim();

      const chips = [
        version ? `v${version}` : '',
        updateTime || '',
        fileSize || '',
        downloadCount ? `${downloadCount} 下载` : '',
      ].filter(Boolean);

      return (
        <Link
          key={game._id}
          href={getGameHref(game)}
          className="flex min-h-[94px] items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0f1723] dark:shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
        >
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-[#dadddf] dark:bg-[#1a2433]">
            <Image src={game.icon || fallbackImage} alt={game.name} fill className="object-cover" sizes="56px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-black dark:text-[#edf2fb]">{game.name}</p>
              {typeof game.star === 'number' && game.star > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eff1f2] px-2 py-0.5 text-[10px] font-bold text-[#595c5d] dark:bg-[#223043] dark:text-[#9ca6b8]">
                  <Star className="h-3 w-3 fill-[#fdc003] text-[#fdc003]" />
                  {game.star.toFixed(1)}
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-[#595c5d] dark:text-[#9ca6b8]">{summary || game.tags?.[0] || '近期更新'}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {region && (
                <span className="rounded-md bg-[#f5f6f7] px-1.5 py-0.5 text-[10px] font-bold text-[#595c5d] dark:bg-[#223043] dark:text-[#9ca6b8]">{region}</span>
              )}
              {chips.slice(0, 2).map((chip) => (
                <span key={`${game._id}-${chip}`} className="rounded-md bg-[#eaf3ff] px-1.5 py-0.5 text-[10px] font-bold text-[#004a7e] dark:bg-[#1e3550] dark:text-[#a9d6ff]">
                  {chip}
                </span>
              ))}
              {!region && chips.length === 0 && (
                <span className="rounded-md bg-[#f5f6f7] px-1.5 py-0.5 text-[10px] font-bold text-[#595c5d] dark:bg-[#223043] dark:text-[#9ca6b8]">近期更新</span>
              )}
            </div>
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-[#005e9f] px-2.5 py-1 text-[10px] font-bold text-white sm:inline-flex">
            <Download className="h-3 w-3" />
            查看
          </span>
        </Link>
      );
    })
  );

  return (
    <section className="rounded-[26px] bg-[#eff1f2] p-5 dark:bg-[#111824] sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black tracking-tight dark:text-[#edf2fb]">{title || '最近更新'}</h3>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-sm font-bold text-[#005e9f] hover:underline"
              aria-label={`${viewAllText}${title || '最近更新'}`}
            >
              {viewAllText}
              <span className="sr-only">{title || '最近更新'}</span>
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toPrevPage}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#595c5d] shadow-sm transition-colors hover:bg-[#e9ecee] dark:bg-[#0f1723] dark:text-[#9ca6b8] dark:hover:bg-[#223043]"
            aria-label="上一页"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toNextPage}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#595c5d] shadow-sm transition-colors hover:bg-[#e9ecee] dark:bg-[#0f1723] dark:text-[#9ca6b8] dark:hover:bg-[#223043]"
            aria-label="下一页"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:hidden">{renderCards(mobileVisible)}</div>
      <div className="hidden grid-cols-1 gap-3 sm:grid lg:grid-cols-2">{renderCards(desktopVisible)}</div>
    </section>
  );
}
