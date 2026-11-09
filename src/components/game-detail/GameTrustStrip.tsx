import type { GameTrustItem } from '@/lib/game-trust-strip';
import { cn } from '@/lib/utils';

/**
 * 详情页首屏可信信息条（派发单 #180）。
 *
 * 只渲染 buildGameTrustItems 真实产出的条目；空数组时整块不渲染，不写占位文案。
 * 移动端 2 列小网格（校验值一条占满整行），桌面收成一行。
 */
export default function GameTrustStrip({
  items,
  className,
}: {
  items: GameTrustItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <dl
      data-stitch="trust-strip"
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border/60 bg-muted/50 px-3 py-2.5',
        'lg:flex lg:flex-wrap lg:items-center lg:gap-x-8 lg:gap-y-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className={cn('min-w-0', item.key === 'checksum' && 'col-span-2 lg:col-span-1')}
        >
          <dt className="text-[10px] font-medium text-muted-foreground lg:text-[11px]">{item.label}</dt>
          <dd
            className="truncate text-xs font-semibold text-foreground lg:text-sm"
            title={item.value}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
