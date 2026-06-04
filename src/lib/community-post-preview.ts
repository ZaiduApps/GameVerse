import type { ApiDynamicPost, CommunityPost } from '@/types';

type CommunityPostPreviewSource = Pick<
  Partial<CommunityPost>,
  'title' | 'summary' | 'content'
> & {
  body?: ApiDynamicPost['body'] | null;
};

function normalizeEscapedNewlines(input?: string | null): string {
  return String(input || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .trim();
}

export function communityPostToPlainText(input?: string | null): string {
  const raw = normalizeEscapedNewlines(input);
  if (!raw) return '';

  return raw
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, ' $1 ')
    .replace(
      /<p[^>]*class=["'][^"']*defined-image[^"']*["'][^>]*>[\s\S]*?<\/p>/gi,
      ' ',
    )
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, ' $1 ')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/!\[([^\]]*)\]\((?:[^)]+)\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, ' $1 ')
    .replace(/!\[([^\]]*)\]\(/g, ' $1 ')
    .replace(/\[([^\]]+)\]\(/g, ' $1 ')
    .replace(/^>+\s?/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^---+$/gm, ' ')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[`*_~]/g, ' ')
    .replace(/\b(?:https?|acbox|uu-mobile):\/\/[^\s<>"')\]]+/gi, ' ')
    .replace(
      /<\/?(?:p|div|section|article|blockquote|li|ul|ol|h[1-6]|span|strong|em|code|pre|table|thead|tbody|tr|th|td)[^>]*>/gi,
      ' ',
    )
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .replace(/([《「『（【〈“‘])\s+/g, '$1')
    .replace(/\s+([》」』）】〉”’、，。！？；：])/g, '$1')
    .trim();
}

export function getCommunityPostPreviewText(
  post: CommunityPostPreviewSource,
  maxLength = 160,
  fallback = '暂无内容',
): string {
  const summaryText = communityPostToPlainText(post.summary || '');
  const contentText = communityPostToPlainText(post.content || post.body || '');
  const titleText = communityPostToPlainText(post.title || '');
  const source =
    (summaryText.length >= 12 ? summaryText : '') ||
    (contentText.length >= 12 ? contentText : '') ||
    summaryText ||
    contentText ||
    titleText ||
    fallback;

  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trim()}...`;
}
