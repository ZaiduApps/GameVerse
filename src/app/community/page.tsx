'use client';

import CommunitySidebar from '@/components/community/CommunitySidebar';
import CreatePostForm from '@/components/community/CreatePostForm';
import CommunityPostCard from '@/components/community/CommunityPostCard';
import CommunityInfoPanel from '@/components/community/CommunityInfoPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getCommunityFeed } from '@/lib/community-api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CommunityPost } from '@/types';

function CommunityLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`community-skeleton-${i}`} className="rounded-lg border bg-card p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-28 bg-muted rounded" />
              <div className="h-3 w-40 bg-muted rounded" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-11/12 bg-muted rounded" />
            <div className="h-3 w-9/12 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const [latestPosts, setLatestPosts] = useState<CommunityPost[]>([]);
  const [hotPosts, setHotPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  const loadCommunityFeeds = useCallback(async (showLoading = true) => {
    const requestId = ++requestIdRef.current;
    if (showLoading) setIsLoading(true);

    const [latest, hot] = await Promise.all([
      getCommunityFeed('latest', 20),
      getCommunityFeed('hot', 20),
    ]);

    if (requestId !== requestIdRef.current) return;

    setLatestPosts(latest);
    setHotPosts(hot);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCommunityFeeds(true);

    const handlePageShow = () => {
      loadCommunityFeeds(true);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCommunityFeeds(false);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadCommunityFeeds]);

  const renderPostList = (posts: CommunityPost[]) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在加载社区帖子...
          </div>
          <CommunityLoadingSkeleton />
        </div>
      );
    }

    if (posts.length === 0) {
      return <p className="py-8 text-center text-sm text-muted-foreground">暂无帖子，稍后再试。</p>;
    }

    return posts.map((post, index) => <CommunityPostCard key={post.id} post={post} index={index} />);
  };

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row lg:gap-x-6">
        <div className="w-full lg:w-1/4 xl:w-1/5 mb-6 lg:mb-0">
          <CommunitySidebar />
        </div>

        <div className="w-full lg:w-1/2 xl:flex-grow lg:min-w-0">
          <CreatePostForm />
          <Separator className="my-6" />

          <Tabs defaultValue="latest" className="w-full">
            <TabsList className="mb-4 bg-card border">
              <TabsTrigger value="latest" className="text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                最新
              </TabsTrigger>
              <TabsTrigger value="hot" className="text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                热门
              </TabsTrigger>
            </TabsList>
            <TabsContent value="latest" className="space-y-4">
              {renderPostList(latestPosts)}
            </TabsContent>
            <TabsContent value="hot" className="space-y-4">
              {renderPostList(hotPosts)}
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden xl:block xl:w-1/4 mt-6 lg:mt-0">
          <CommunityInfoPanel posts={latestPosts} />
        </div>
      </div>
    </div>
  );
}
