import { Card, CardContent } from '@/components/ui/card';
import { renderMarkdown } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { GameFaqItem } from '@/lib/game-faq';

interface GameFaqSectionProps {
  items: GameFaqItem[];
  mobile?: boolean;
  intro?: React.ReactNode;
}

export default function GameFaqSection({
  items,
  mobile = false,
  intro,
}: GameFaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className={mobile ? 'mt-10' : undefined}>
      <h2
        className={cn(
          'flex items-center font-bold',
          mobile ? 'mb-4 gap-2 text-xl font-black' : 'mb-6 gap-3 text-xl',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'rounded-full bg-[#2e7d32]',
            mobile ? 'h-6 w-1.5' : 'h-8 w-2',
          )}
        />
        常见问题 FAQ
      </h2>
      {intro}
      <div className={mobile ? 'space-y-4' : 'grid gap-4'}>
        {items.map((item) => (
          <Card
            key={`${item.source}:${item.id}`}
            className={cn(
              'border-[#abadae]/10 bg-white dark:border-border/45 dark:bg-card/75',
              mobile ? '' : 'rounded-[1.75rem] bg-white/80',
            )}
          >
            <CardContent className={mobile ? 'p-5' : 'p-6'}>
              <h3 className="text-base font-bold text-[#0f1720] dark:text-foreground">
                {item.question}
              </h3>
              <div
                className="mt-3 text-sm leading-6 text-[#595c5d] dark:text-muted-foreground [&_a]:break-all [&_img]:my-4 [&_p]:my-2"
                dangerouslySetInnerHTML={renderMarkdown(item.answer_markdown)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
