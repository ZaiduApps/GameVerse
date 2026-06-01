import { Loader2 } from 'lucide-react';

export default function CommunityLoading() {
  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="mb-4 flex items-center justify-center rounded-lg border bg-card px-4 py-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        正在加载社区内容...
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`community-sidebar-skeleton-${index}`} className="h-20 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-lg border bg-card" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`community-feed-skeleton-${index}`} className="h-44 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
