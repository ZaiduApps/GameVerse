import { cn } from '@/lib/utils';

type CenterPageSkeletonProps = {
  /** 列表页（单列）或卡片网格页（我关注的游戏）。 */
  variant?: 'list' | 'grid';
  /** 与真实页面保持同一容器宽度，避免骨架切到内容时横向跳动。 */
  maxWidthClassName?: string;
  label?: string;
};

/**
 * 用户中心各页共用的加载骨架。
 *
 * 四个 center 页面都是客户端取数，过去首屏只给一个转圈图标，看起来接近白屏；
 * 这里按「页头 + 卡片 + 列表行」的最终结构铺骨架，既用于页面级 Suspense fallback，
 * 也用于组件内部的 auth/数据加载态，保证切到真实内容时不出现明显位移。
 */
export default function CenterPageSkeleton({
  variant = 'list',
  maxWidthClassName = 'max-w-4xl',
  label = '正在加载个人中心内容',
}: CenterPageSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={cn('mx-auto w-full space-y-4 py-4 md:py-8', maxWidthClassName)}
    >
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-9 w-full animate-pulse rounded-md bg-muted/70" />
        <div className={cn('mt-4', variant === 'grid' ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3')}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn('animate-pulse rounded-lg bg-muted/60', variant === 'grid' ? 'h-28' : 'h-16')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
