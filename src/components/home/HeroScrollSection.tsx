'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download, Sparkles } from 'lucide-react';

import { resolveGameName } from '@/lib/game-display-name';
import type { ApiGame } from '@/types';

interface HeroScrollSectionProps {
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

export default function HeroScrollSection({
  title,
  games,
  fallbackImage,
  viewAllHref,
  viewAllText = '查看全部',
}: HeroScrollSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncEdgeState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollLeft(track.scrollLeft > 4);
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncEdgeState();
    window.addEventListener('resize', syncEdgeState);
    return () => window.removeEventListener('resize', syncEdgeState);
  }, [syncEdgeState]);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>('[data-hero-card]');
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap || '') || 0;
    const step = (card?.offsetWidth || track.clientWidth) + gap;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  if (games.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          <Sparkles className="h-5 w-5 text-tone-blue" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {viewAllHref ? (
            <Link href={viewAllHref} prefetch={false} className="text-sm font-bold text-[#005e9f] hover:underline">
              {viewAllText}
              <span className="sr-only">{title}</span>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canScrollLeft}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white text-[#595c5d] shadow-sm transition-colors hover:bg-[#e9ecee] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#0f1723] dark:text-[#9ca6b8] dark:hover:bg-[#223043]"
            aria-label="向左滚动"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canScrollRight}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white text-[#595c5d] shadow-sm transition-colors hover:bg-[#e9ecee] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#0f1723] dark:text-[#9ca6b8] dark:hover:bg-[#223043]"
            aria-label="向右滚动"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={syncEdgeState}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
      >
        {games.map((game) => (
          <article
            key={game._id}
            data-hero-card
            className="group relative w-[85%] flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-border/60 bg-[#e6e8ea] shadow-sm transition-shadow hover:shadow-md dark:bg-[#1a2433] sm:w-[60%] lg:w-[calc((100%-1.5rem)/3)]"
          >
            <div className="relative aspect-[21/9] w-full">
              <Image
                src={game.header_image || game.icon || fallbackImage}
                alt={resolveGameName(game)}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 639px) 85vw, (max-width: 1023px) 60vw, 33vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h4 className="truncate text-lg font-semibold text-white">{resolveGameName(game)}</h4>
                  {(game.tags || []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(game.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={`${game._id}-${tag}`}
                          className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-bold leading-none text-[#2c2f30]">
                  <Download className="h-3.5 w-3.5" />
                  下载
                </span>
              </div>
            </div>
            <Link
              href={getGameHref(game)}
              prefetch={false}
              className="absolute inset-0 z-30 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005e9f]"
              aria-label={`查看${resolveGameName(game)}详情`}
            >
              <span className="sr-only">查看{resolveGameName(game)}详情</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
