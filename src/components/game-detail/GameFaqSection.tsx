// 攻略指南与常见问题（FAQ）区块。
// 版式对齐 Stitch 视觉稿：PC 为左右双列卡片（左侧色块图标 + 问题 + 答案），移动端为单列紧凑卡片（左侧单字角标）。
// 内容全部来自接口 FAQ，没有真实数据时只渲染安装说明（intro），不铺任何示例文案。

import type { ReactNode } from 'react';
import { Award, Globe, Lightbulb, Smartphone, type LucideIcon } from 'lucide-react';

import type { GameFaqItem } from '@/lib/game-faq';
import { cn, renderMarkdown } from '@/lib/utils';

// FAQ 条目的四种视觉处理，按顺序循环取用；PC 用图标块，移动端用单字角标。
const FAQ_TONES: { icon: LucideIcon; tile: string; mark: string; markTone: string }[] = [
  { icon: Smartphone, tile: 'bg-primary/10 text-primary', mark: '问', markTone: 'bg-tone-amber' },
  { icon: Globe, tile: 'bg-tone-blue/10 text-tone-blue', mark: '服', markTone: 'bg-tone-cyan' },
  { icon: Award, tile: 'bg-tone-green/10 text-tone-green', mark: '职', markTone: 'bg-tone-violet' },
  { icon: Lightbulb, tile: 'bg-tone-violet/10 text-tone-violet', mark: '答', markTone: 'bg-primary' },
];

interface GameFaqSectionProps {
  id?: string;
  title: string;
  hint?: string;
  items: GameFaqItem[];
  intro?: ReactNode;
  action?: ReactNode;
}

export default function GameFaqSection({ id, title, hint, items, intro, action }: GameFaqSectionProps) {
  // 没有 FAQ 且没有前言时不渲染整个区块；只有安装说明时也必须渲染，避免安装步骤整体消失。
  if (items.length === 0 && !intro) return null;

  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-2xl border border-[#abadae]/20 bg-white p-4 shadow-sm lg:scroll-mt-24 lg:p-6 dark:border-border/45 dark:bg-card/80"
    >
      <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5">
        <div className="flex min-w-0 items-center gap-1.5 lg:gap-2">
          <span className="h-3.5 w-1 shrink-0 rounded-full bg-primary lg:h-5 lg:w-1.5" aria-hidden="true" />
          <h2 className="truncate text-sm font-bold text-[#2c2f30] lg:text-lg dark:text-foreground">{title}</h2>
          {hint ? (
            <span className="hidden shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary lg:inline-block lg:text-xs">
              {hint}
            </span>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-1">{action}</div> : null}
      </div>

      {intro}

      {items.length > 0 ? (
        <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3.5 lg:space-y-0">
          {items.map((item, index) => {
            const tone = FAQ_TONES[index % FAQ_TONES.length];
            const Icon = tone.icon;
            return (
              <div
                key={item.source + ':' + item.id}
                className="rounded-xl bg-[#eff1f2]/70 p-3 transition-colors lg:space-y-2.5 lg:p-4 [@media(hover:hover)]:hover:bg-[#eff1f2]"
              >
                <div className="flex items-start gap-2 lg:items-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white lg:hidden',
                      tone.markTone,
                    )}
                  >
                    {tone.mark}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn('hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg lg:flex', tone.tile)}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="text-xs font-bold leading-snug text-[#2c2f30] lg:text-sm dark:text-foreground">{item.question}</h3>
                </div>
                <div
                  className="mt-1.5 pl-6 text-xs leading-relaxed text-[#595c5d] lg:mt-0 lg:pl-0 dark:text-muted-foreground [&_a]:break-all [&_img]:my-4 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_p]:my-2"
                  dangerouslySetInnerHTML={renderMarkdown(item.answer_markdown)}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
