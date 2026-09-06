'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import type { ApiGameDetail, GamePageSnapshot } from '@/types';

const GameReviewPanel = dynamic(() => import('@/components/game-detail/GameReviewPanel'), {
  ssr: false,
  loading: () => <GameReviewFallback />,
});

interface DeferredGameReviewPanelProps {
  game: Pick<ApiGameDetail, '_id' | 'pkg' | 'name' | 'star'>;
  summary?: GamePageSnapshot['reviewSummary'];
}

function formatCount(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.max(0, Math.floor(value)));
}

function GameReviewFallback({ summary }: Pick<DeferredGameReviewPanelProps, 'summary'> = {}) {
  const score = Number(summary?.displayScore || 0);
  const count = Math.max(0, Number(summary?.ratingCount || 0));
  return (
    <div
      className="min-h-[31rem] rounded-2xl border border-[#abadae]/10 bg-white p-5 dark:border-border/45 dark:bg-card/75"
      aria-busy="true"
      aria-label="正在加载玩家评价"
    >
      <h2 className="text-xl font-bold">玩家评分与评论</h2>
      <p className="mt-3 text-sm text-[#595c5d] dark:text-muted-foreground">
        {score > 0 ? `${score.toFixed(1)} / 5.0 · ${formatCount(count)} 人评分` : '正在加载评价与评论…'}
      </p>
      <div className="mt-5 space-y-4" aria-hidden="true">
        <div className="rounded-2xl border border-[#abadae]/15 bg-[#f7f8f9] p-4">
          <div className="h-4 w-20 rounded bg-[#dadddf]/80" />
          <div className="mt-3 h-8 w-32 rounded bg-[#dadddf]/80" />
          <div className="mt-5 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <div className="h-3 w-8 rounded bg-[#dadddf]/70" />
                <div className="h-2 flex-1 rounded-full bg-[#e7eaed]" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-16 rounded-2xl border border-[#abadae]/15 bg-white dark:bg-card/75" />
        <div className="space-y-3">
          <div className="h-5 w-24 rounded bg-[#dadddf]/70" />
          <div className="h-24 rounded-xl border border-[#abadae]/15 bg-[#f7f8f9]" />
        </div>
      </div>
    </div>
  );
}

export default function DeferredGameReviewPanel({ game, summary }: DeferredGameReviewPanelProps) {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [compact, setCompact] = useState<boolean | null>(null);

  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!boundary) return;
    if (!('IntersectionObserver' in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setIsNearViewport(true);
      observer.disconnect();
    }, { rootMargin: '600px 0px' });
    observer.observe(boundary);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const apply = () => setCompact(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  return (
    <div ref={boundaryRef}>
      {isNearViewport && compact !== null
        ? <GameReviewPanel game={game} compact={compact} />
        : <GameReviewFallback summary={summary} />}
    </div>
  );
}
