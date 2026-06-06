import type { CommunityPost } from '@/types';

type CommunityAuthorProfileInput = Pick<
  CommunityPost,
  'authorId' | 'authorType' | 'authorUsername'
>;

export function getCommunityAuthorProfileTarget(post: CommunityAuthorProfileInput): string {
  if (String(post.authorType || '').trim() !== 'user') return '';
  return String(post.authorUsername || post.authorId || '').trim();
}

export function getCommunityAuthorProfileHref(post: CommunityAuthorProfileInput): string {
  const target = getCommunityAuthorProfileTarget(post);
  return target ? `/u/${encodeURIComponent(target)}` : '';
}
