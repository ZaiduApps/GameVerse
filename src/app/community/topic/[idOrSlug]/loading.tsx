import { Loader2 } from 'lucide-react';

export default function CommunityTopicLoading() {
  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="mb-4 flex items-center justify-center rounded-lg border bg-card px-4 py-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        正在加载话题内容...
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="h-52 animate-pulse rounded-xl border bg-card" />
          <div className="h-12 animate-pulse rounded-lg border bg-card" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`topic-feed-skeleton-${index}`} className="h-44 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
        <div className="h-52 animate-pulse rounded-lg border bg-card" />
      </div>
    </div>
  );
}
