'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  toTrackingTarget,
  type CommunityEntryAction,
  type CommunityEntryParams,
} from '@/lib/community-entry';
import { reportCommunityLinkClick } from '@/lib/link-click-tracking';

interface GameTopicEntryLinkProps {
  href: string;
  className?: string;
  /** 只有真正指向固定话题时才传，回落到搜索页的链接不记「话题入口点击」。 */
  tracking?: (CommunityEntryParams & {
    entryAction: CommunityEntryAction;
  }) | null;
  children: ReactNode;
}

/**
 * 详情页里的社区入口链接（服务端组件不能直接挂 onClick，故单独包一层客户端组件）。
 * 点击时补一条 link_click，导航行为与普通 next/link 完全一致。
 */
export default function GameTopicEntryLink({
  href,
  className,
  tracking,
  children,
}: GameTopicEntryLinkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      onClick={() => {
        if (!tracking) return;
        reportCommunityLinkClick({
          entryAction: tracking.entryAction,
          from: tracking.from,
          to: toTrackingTarget(href),
          pkg: tracking.pkg,
          topicSlug: tracking.topicSlug,
        });
      }}
    >
      {children}
    </Link>
  );
}
