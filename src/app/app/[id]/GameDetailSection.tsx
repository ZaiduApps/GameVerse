import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface GameDetailSectionProps {
  id?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

// 详情页所有内容区块共用的卡片外壳：移动端紧凑（p-4 / text-sm），PC 端按视觉稿放大（p-6 / text-lg）。
export default function GameDetailSection({ id, title, subtitle, action, className, children }: GameDetailSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-[#abadae]/20 bg-white p-4 shadow-sm lg:p-6 dark:border-border/45 dark:bg-card/80',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3 lg:mb-5 lg:items-center">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#2c2f30] lg:gap-2 lg:text-lg dark:text-foreground">
            <span className="h-3.5 w-1 shrink-0 rounded-full bg-primary lg:h-4 lg:w-1.5" aria-hidden="true" />
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-[#757778] lg:text-xs dark:text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-1.5 lg:gap-3">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
