'use client';

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CommunityTopicItem } from '@/lib/community-api';
import { cn } from '@/lib/utils';
import { Flame, Hash } from 'lucide-react';

interface CommunitySidebarProps {
  topics: CommunityTopicItem[];
  selectedTopicId?: string;
  onSelectTopic: (topic: CommunityTopicItem | null) => void;
  followedTopicIds?: string[];
  onToggleFollow?: (topic: CommunityTopicItem) => void;
  followLoadingTopicId?: string;
  loading?: boolean;
}

export default function CommunitySidebar({
  topics,
  selectedTopicId,
  onSelectTopic,
  followedTopicIds = [],
  onToggleFollow,
  followLoadingTopicId = '',
  loading = false,
}: CommunitySidebarProps) {
  const followedSet = new Set((followedTopicIds || []).map((id) => String(id || '').trim()));

  return (
    <Card className="sticky top-20 shadow-sm">
      <CardHeader className="px-3 pb-2 pt-3">
        <CardTitle className="flex items-center text-sm font-semibold">
          <Flame className="mr-1.5 h-4 w-4 text-orange-500" />
          热门话题
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-3 pt-1">
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

        {topics.map((topic) => {
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
                'h-auto w-full justify-start px-3 py-2.5 text-left text-sm',
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
                  width={22}
                  height={22}
                  className="mr-2 rounded object-cover"
                />
              ) : (
                <Hash className="mr-2 h-4 w-4" />
              )}
              <div className="min-w-0 flex-1">
                <span className="line-clamp-1 block">#{topic.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  热度 {Number(topic.heat_score || 0)}
                </span>
              </div>
              {onToggleFollow ? (
                <span
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'ml-2 rounded border px-1.5 py-0.5 text-[11px] leading-4',
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
        })}

        {topics.length === 0 && !loading && (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">暂无话题</div>
        )}

        {loading && (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">加载中...</div>
        )}
      </CardContent>
    </Card>
  );
}
