import { renderMarkdown } from './utils';

import type { GameDetailData } from '../types';

export type GameFaqItem = NonNullable<GameDetailData['faq']>['items'][number];

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );

export function normalizeGameFaqItems(
  faq?: GameDetailData['faq'] | null,
): GameFaqItem[] {
  if (!Array.isArray(faq?.items)) return [];

  return faq.items.filter((item): item is GameFaqItem =>
    Boolean(
      item &&
        String(item.id || '').trim() &&
        String(item.question || '').trim() &&
        String(item.answer_markdown || '').trim(),
    ),
  );
}

export function faqMarkdownToPlainText(markdown: unknown): string {
  const html = renderMarkdown(markdown).__html;
  return decodeHtmlEntities(html)
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
