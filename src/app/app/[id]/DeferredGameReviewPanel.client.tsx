'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

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
      className="rounded-2xl border border-[#abadae]/10 bg-white p-5 dark:border-border/45 dark:bg-card/75"
      aria-busy="true"
      aria-label="正在加载玩家评价"
    >
      <h2 className="text-xl font-bold">玩家评分与评论</h2>
      <p className="mt-3 text-sm text-[#595c5d] dark:text-muted-foreground">
        {score > 0 ? `${score.toFixed(1)} / 5.0 · ${formatCount(count)} 人评分` : '正在加载评价与评论…'}
      </p>
    </div>
  );
}

export default function DeferredGameReviewPanel({ game, summary }: DeferredGameReviewPanelProps) {
  const [compact, setCompact] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const apply = () => setCompact(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  if (compact === null) return <GameReviewFallback summary={summary} />;
  return <GameReviewPanel game={game} compact={compact} />;
}
