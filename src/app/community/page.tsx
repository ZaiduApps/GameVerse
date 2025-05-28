
import CommunitySidebar from '@/components/community/CommunitySidebar';
import CreatePostForm from '@/components/community/CreatePostForm';
import CommunityPostCard from '@/components/community/CommunityPostCard';
import CommunityInfoPanel from '@/components/community/CommunityInfoPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_COMMUNITY_POSTS } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';

export default function CommunityPage() {
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
          
          <Tabs defaultValue="recommended" className="w-full">
            <TabsList className="mb-4 bg-card border">
              <TabsTrigger value="hot" className="text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">热门</TabsTrigger>
              <TabsTrigger value="latest" className="text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">最新</TabsTrigger>
              <TabsTrigger value="recommended" className="text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">推荐</TabsTrigger>
            </TabsList>
            <TabsContent value="hot" className="space-y-4">
              {MOCK_COMMUNITY_POSTS.filter((_,i) => i % 2 === 0).map((post) => ( // Show some posts for "Hot"
                <CommunityPostCard key={post.id} post={post} />
              ))}
            </TabsContent>
            <TabsContent value="latest" className="space-y-4">
              {MOCK_COMMUNITY_POSTS.map((post) => ( // Show all posts for "Latest"
                <CommunityPostCard key={post.id} post={post} />
              ))}
            </TabsContent>
            <TabsContent value="recommended" className="space-y-4">
               {/* Filter for posts that might be categorized as "recommended" (using old "news" logic) */}
              {MOCK_COMMUNITY_POSTS.filter(p => p.tags?.includes("攻略") || p.tags?.includes("新活动")).map((post) => (
                <CommunityPostCard key={post.id} post={post} />
              ))}
              {MOCK_COMMUNITY_POSTS.filter(p => p.tags?.includes("攻略") || p.tags?.includes("新活动")).length === 0 && (
                <p className="text-muted-foreground text-center py-4">暂无推荐内容</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Info Panel (Optional) */}
        <div className="hidden xl:block xl:w-1/4 mt-6 lg:mt-0">
          <CommunityInfoPanel />
        </div>
      </div>
    </div>
  );
}

