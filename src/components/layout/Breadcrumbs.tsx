// 通用面包屑：服务端组件，仅依赖 props，可被服务端页面与客户端视图复用。
// 可见导航与 BreadcrumbList JSON-LD 由同一份 items 生成，每个页面只应渲染一个本组件。

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import {
  buildBreadcrumbJsonLd,
  toBreadcrumbJsonLdScript,
  type BreadcrumbItem,
} from '@/lib/breadcrumbs';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  /** onDark 给专辑页 hero（白字）。 */
  tone?: 'default' | 'onDark';
  /** 默认 true；同一页面只渲染一处面包屑时保持默认。 */
  withJsonLd?: boolean;
  /** 默认「面包屑」。 */
  label?: string;
}

export default function Breadcrumbs({
  items,
  className,
  tone = 'default',
  withJsonLd = true,
  label = '面包屑',
}: BreadcrumbsProps) {
  if (items.length === 0) return null;

  const onDark = tone === 'onDark';

  return (
    <>
      <nav
        aria-label={label}
        className={cn(
          'flex min-w-0 items-center text-xs font-medium',
          onDark ? 'text-white/70' : 'text-[#595c5d] dark:text-muted-foreground',
          className,
        )}
      >
        <ol className="flex min-w-0 items-center gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.name}-${index}`} className="flex min-w-0 items-center gap-2">
                {index > 0 ? (
                  <ChevronRight
                    className={cn(
                      'h-3 w-3 shrink-0',
                      onDark
                        ? 'text-white/40'
                        : 'text-[#abadae] dark:text-muted-foreground/60',
                    )}
                    aria-hidden="true"
                  />
                ) : null}
                {isLast || !item.href ? (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={cn(
                      'truncate',
                      isLast
                        ? cn(
                            'max-w-[10rem] font-semibold sm:max-w-md',
                            onDark ? 'text-white' : 'text-[#2c2f30] dark:text-foreground',
                          )
                        : undefined,
                    )}
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'inline-flex min-h-8 items-center whitespace-nowrap transition-colors',
                      onDark
                        ? 'hover:text-white'
                        : '[@media(hover:hover)]:hover:text-primary',
                    )}
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {withJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toBreadcrumbJsonLdScript(buildBreadcrumbJsonLd(items)) }}
        />
      ) : null}
    </>
  );
}
