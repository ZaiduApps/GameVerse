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

// 全站通用的安装/格式说明；即使上游误标成 game 来源，也不当成页面专属 FAQ。
const DEFAULT_GLOBAL_FAQ_QUESTIONS = new Set([
  '如何安装游戏?',
  '什么是APKS格式的游戏?',
  'APKS和普通APK有什么区别?',
]);

function normalizeFaqQuestion(question: unknown): string {
  return String(question || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/？/g, '?');
}

/**
 * 只挑该游戏自己的 FAQ 用于 FAQPage 结构化数据。
 * 全站复用同一组模板问题属于重复结构化数据，宁可不输出也不要每页复制一遍。
 */
export function selectDedicatedGameFaqItems(
  faq?: GameDetailData['faq'] | null,
): GameFaqItem[] {
  return normalizeGameFaqItems(faq).filter((item) => {
    if (String(item.source || '').trim().toLowerCase() !== 'game') return false;
    return !DEFAULT_GLOBAL_FAQ_QUESTIONS.has(normalizeFaqQuestion(item.question));
  });
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
