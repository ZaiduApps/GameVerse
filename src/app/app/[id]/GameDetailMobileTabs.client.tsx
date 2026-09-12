'use client';

// 移动端吸顶分类 Tab，对应视觉稿的「详情 / 评价 / 攻略指南 / 社区动态」。
// 交互：点击平滑滚动到对应区块，滚动时按区块位置自动切换高亮。

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { MOBILE_TABS } from './game-detail-mock-copy';

// 吸顶偏移 = 顶部 56px 导航 + Tab 栏自身高度，滚动定位时用于抵消固定栏遮挡。
const STICKY_OFFSET = 104;

export default function GameDetailMobileTabs({ reviewCountLabel }: { reviewCountLabel?: string }) {
  const [activeId, setActiveId] = useState<string>(MOBILE_TABS[0].id);

  useEffect(() => {
    const sections = MOBILE_TABS.map((tab) => document.getElementById(tab.id)).filter(
      (element): element is HTMLElement => Boolean(element),
    );
    if (sections.length === 0) return;

    const syncActive = () => {
      let current = sections[0].id;
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top - STICKY_OFFSET <= 8) current = section.id;
      });
      setActiveId(current);
    };

    syncActive();
    window.addEventListener('scroll', syncActive, { passive: true });
    return () => window.removeEventListener('scroll', syncActive);
  }, []);

  const handleSelect = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    setActiveId(id);
  }, []);

  return (
    <div className="sticky top-14 z-30 border-b border-[#abadae]/20 bg-[#f5f6f7]/95 px-4 pt-2 pb-1 backdrop-blur-md dark:border-border/45 dark:bg-[#080d14]/95 lg:hidden">
      <nav className="flex items-center gap-6 overflow-x-auto text-sm [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
        {MOBILE_TABS.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'relative shrink-0 py-2 font-bold transition-colors',
                isActive ? 'text-primary' : 'text-[#595c5d] dark:text-muted-foreground',
              )}
            >
              {tab.label}
              {tab.id === 'game-detail-section-reviews' && reviewCountLabel ? (
                <span className="ml-1 text-xs font-normal text-[#757778] dark:text-muted-foreground">{reviewCountLabel}</span>
              ) : null}
              {isActive ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
