'use client';

// 移动端吸顶分类 Tab，对应视觉稿的「详情 / 评价 / 攻略指南 / 社区动态」。
// 交互：前三个平滑滚动到对应区块（滚动时自动切换高亮）；社区动态直接进入固定游戏话题。

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toTrackingTarget } from '@/lib/community-entry';
import { reportCommunityLinkClick } from '@/lib/link-click-tracking';
import { cn } from '@/lib/utils';

import { MOBILE_TABS } from './game-detail-mock-copy';

// 吸顶偏移 = 顶部 56px 导航 + Tab 栏自身高度，滚动定位时用于抵消固定栏遮挡。
const STICKY_OFFSET = 104;
const COMMUNITY_SECTION_ID = 'game-detail-section-community';

interface GameDetailMobileTabsProps {
  reviewCountLabel?: string;
  /** 固定游戏话题 URL；有值时「社区动态」Tab 直接进话题页，不再只做页内滚动。 */
  communityHref?: string;
  pkg?: string;
  topicSlug?: string;
}

export default function GameDetailMobileTabs({
  reviewCountLabel,
  communityHref,
  pkg,
  topicSlug,
}: GameDetailMobileTabsProps) {
  const router = useRouter();
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

  const handleSelect = useCallback(
    (id: string) => {
      // 社区动态 Tab 走固定游戏话题（B 档最短路径），不再滚到页内区块。
      if (id === COMMUNITY_SECTION_ID && communityHref) {
        if (topicSlug) {
          reportCommunityLinkClick({
            entryAction: 'detail_tab',
            from: 'detail_tab',
            to: toTrackingTarget(communityHref),
            pkg,
            topicSlug,
          });
        }
        router.push(communityHref);
        return;
      }

      const target = document.getElementById(id);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
      setActiveId(id);
    },
    [communityHref, pkg, router, topicSlug],
  );

  return (
    <div className="sticky top-14 z-30 border-b border-border/40 bg-muted/95 px-4 pt-2 pb-1 backdrop-blur-md dark:bg-background/95 lg:hidden">
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
                'relative inline-flex min-h-11 min-w-[44px] shrink-0 items-center justify-center py-2 font-bold transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {tab.label}
              {tab.id === 'game-detail-section-reviews' && reviewCountLabel ? (
                <span className="ml-1 text-xs font-normal text-muted-foreground">{reviewCountLabel}</span>
              ) : null}
              {isActive ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
