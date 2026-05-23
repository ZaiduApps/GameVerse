'use client';

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CommunityTopicItem } from '@/lib/community-api';
import { cn } from '@/lib/utils';
import { Building2, ChevronDown, ChevronUp, Flame, Hash, Heart } from 'lucide-react';

interface CommunitySidebarProps {
  hotTopics: CommunityTopicItem[];
  officialTopics: CommunityTopicItem[];
  followedTopics?: CommunityTopicItem[];
  selectedTopicId?: string;
  onSelectTopic: (topic: CommunityTopicItem | null) => void;
  followedTopicIds?: string[];
  onToggleFollow?: (topic: CommunityTopicItem) => void;
  followLoadingTopicId?: string;
  loading?: boolean;
  followedCollapsedCount?: number;
  showAllFollowed?: boolean;
  onToggleFollowedExpand?: () => void;
}

export default function CommunitySidebar({
  hotTopics,
  officialTopics,
  followedTopics = [],
  selectedTopicId,
  onSelectTopic,
  followedTopicIds = [],
  onToggleFollow,
  followLoadingTopicId = '',
  loading = false,
  followedCollapsedCount = 6,
  showAllFollowed = false,
  onToggleFollowedExpand,
}: CommunitySidebarProps) {
  const followedSet = new Set((followedTopicIds || []).map((id) => String(id || '').trim()));
  const visibleFollowedTopics = showAllFollowed
    ? followedTopics
    : followedTopics.slice(0, Math.max(1, followedCollapsedCount));
  const hasFollowedOverflow = followedTopics.length > Math.max(1, followedCollapsedCount);

  const renderTopicButton = (topic: CommunityTopicItem) => {
    const topicId = String(topic._id || '').trim();
    const isActive = Boolean(topicId) && topicId === selectedTopicId;
    const isFollowed = Boolean(topicId) && followedSet.has(topicId);
    const followBusy = topicId === followLoadingTopicId;
    const icon = topic.icon || topic.app_info?.icon || '';

    return (
      <Button
        key={topicId || topic.slug || topic.name}
        type="button"
        variant="ghost"
        className={cn(
          'h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-left',
          isActive
            ? 'bg-primary/10 font-semibold text-primary'
            : 'text-foreground/80 hover:bg-primary/5 hover:text-primary',
        )}
        onClick={() => onSelectTopic(topic)}
      >
        {icon ? (
          <Image
            src={icon}
            alt={topic.name}
            width={50}
            height={50}
            className="rounded-md object-cover"
          />
        ) : (
          <span className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Hash className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <span className="line-clamp-1 block text-sm">#{topic.name}</span>
          <span className="text-[11px] text-muted-foreground">热度 {Number(topic.heat_score || 0)}</span>
        </div>
        {onToggleFollow ? (
          <span
            role="button"
            tabIndex={0}
            className={cn(
              'ml-1 rounded border px-1.5 py-0.5 text-[11px] leading-4',
              isFollowed
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground',
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (followBusy) return;
              onToggleFollow(topic);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              if (followBusy) return;
              onToggleFollow(topic);
            }}
          >
            {followBusy ? '...' : isFollowed ? '已关注' : '关注'}
          </span>
        ) : null}
      </Button>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="px-3 pb-1 pt-3">
        <CardTitle className="text-sm font-semibold">社区话题</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-3 pt-1">
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'h-auto w-full justify-start px-3 py-2.5 text-sm',
            !selectedTopicId
              ? 'bg-primary/10 font-semibold text-primary'
              : 'text-foreground/80 hover:bg-primary/5 hover:text-primary',
          )}
          onClick={() => onSelectTopic(null)}
        >
          <Hash className="mr-2 h-4 w-4" />
          全部话题
        </Button>

        <section className="space-y-1">
          <div className="flex items-center px-1 pb-1 text-xs font-semibold text-muted-foreground">
            <Flame className="mr-1.5 h-3.5 w-3.5 text-orange-500" />
            热门话题
          </div>
          {hotTopics.map(renderTopicButton)}
          {!loading && hotTopics.length === 0 ? (
            <div className="px-2 py-2 text-xs text-muted-foreground">暂无热门话题</div>
          ) : null}
        </section>

        {followedTopics.length > 0 ? (
          <section className="space-y-1">
            <div className="flex items-center px-1 pb-1 text-xs font-semibold text-muted-foreground">
              <Heart className="mr-1.5 h-3.5 w-3.5 text-rose-500" />
              我的关注
            </div>
            {visibleFollowedTopics.map(renderTopicButton)}
            {hasFollowedOverflow ? (
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-full justify-center text-xs text-muted-foreground hover:text-foreground"
                onClick={onToggleFollowedExpand}
              >
                {showAllFollowed ? (
                  <>
                    收起
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    展开更多
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-1">
          <div className="flex items-center px-1 pb-1 text-xs font-semibold text-muted-foreground">
            <Building2 className="mr-1.5 h-3.5 w-3.5 text-sky-600" />
            官方
          </div>
          {officialTopics.map(renderTopicButton)}
          {!loading && officialTopics.length === 0 ? (
            <div className="px-2 py-2 text-xs text-muted-foreground">暂无官方话题</div>
          ) : null}
        </section>

        {hotTopics.length === 0 && officialTopics.length === 0 && !loading && (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">暂无话题</div>
        )}

        {loading && (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">加载中...</div>
        )}
      </CardContent>
    </Card>
  );
}
