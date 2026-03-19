
'use client';

import CommunitySidebar from '@/components/community/CommunitySidebar';
import CreatePostForm from '@/components/community/CreatePostForm';
import CommunityPostCard from '@/components/community/CommunityPostCard';
import CommunityInfoPanel from '@/components/community/CommunityInfoPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_COMMUNITY_POSTS } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { getCommunityFeed } from '@/lib/community-api';
import { useEffect, useState } from 'react';
import type { CommunityPost } from '@/types';

export default function CommunityPage() {
  const [latestPosts, setLatestPosts] = useState<CommunityPost[]>(MOCK_COMMUNITY_POSTS);
  const [hotPosts, setHotPosts] = useState<CommunityPost[]>(
    MOCK_COMMUNITY_POSTS.filter((_, i) => i % 2 === 0),
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      const [latest, hot] = await Promise.all([
        getCommunityFeed('latest', 20),
        getCommunityFeed('hot', 20),
      ]);

      if (!alive) return;
      if (latest.length > 0) setLatestPosts(latest);
      if (hot.length > 0) setHotPosts(hot);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row lg:gap-x-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/4 xl:w-1/5 mb-6 lg:mb-0">
          <CommunitySidebar />
        </div>

        {/* Center Content */}
        <div className="w-full lg:w-1/2 xl:flex-grow lg:min-w-0"> {/* Added lg:min-w-0 for flexbox growing */}
          <CreatePostForm />
          <Separator className="my-6" />
          
          <Tabs defaultValue="latest" className="w-full">
            <TabsList className="mb-4 bg-card border">
              <TabsTrigger value="latest" className="text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">最新</TabsTrigger>
              <TabsTrigger value="hot" className="text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">热门</TabsTrigger>
            </TabsList>
            <TabsContent value="latest" className="space-y-4">
              {latestPosts.map((post, index) => (
                <CommunityPostCard key={post.id} post={post} index={index} />
              ))}
            </TabsContent>
            <TabsContent value="hot" className="space-y-4">
              {hotPosts.map((post, index) => (
                <CommunityPostCard key={post.id} post={post} index={index} />
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Info Panel (Optional) */}
        <div className="hidden xl:block xl:w-1/4 mt-6 lg:mt-0">
          <CommunityInfoPanel posts={latestPosts} />
        </div>
      </div>
    </div>
  );
}
