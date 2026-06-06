import type { CommunityCommentThread } from '@/lib/community-api';
import { getCommunityAuthorProfileHref } from '@/lib/community-profile';
import { absoluteUrl, hasSeoMarkupNoise, normalizeSeoAssetUrl, sanitizeSeoText } from '@/lib/seo';
import type { CommunityPost } from '@/types';

type LinkedPageMention = {
  '@type': 'WebPage';
  url: string;
  name: string;
  description?: string;
  image?: string;
};

export function clampCommunitySeoText(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(1, max - 3)).trim()}...`;
}

export function buildCommunityPostSeoTitle(post: CommunityPost, siteName: string): string {
  const core =
    sanitizeSeoText(post.title || post.summary || '社区帖子') || '社区帖子';
  return clampCommunitySeoText(`${core} | ${siteName} 社区`, 90);
}

export function buildCommunityPostSeoDescription(post: CommunityPost): string {
  const summary = sanitizeSeoText(post.summary);
  const content = sanitizeSeoText(post.content);
  const source =
    (!summary ||
    (hasSeoMarkupNoise(post.summary) && content.length > summary.length)
      ? content || summary
      : summary || content) || '查看社区帖子详情';
  return clampCommunitySeoText(source, 180);
}

export function getCommunityPostContentImage(post: CommunityPost): string {
  return normalizeSeoAssetUrl(post.imageUrl);
}

export function getCommunityPostShareImage(post: CommunityPost, fallbackImage: string): string {
  return getCommunityPostContentImage(post) || normalizeSeoAssetUrl(fallbackImage);
}

export function getCommunityAuthorProfileUrl(post: CommunityPost): string | undefined {
  const href = getCommunityAuthorProfileHref(post);
  return href ? absoluteUrl(href) : undefined;
}

function getAuthorAvatarImage(post: CommunityPost): string | undefined {
  const avatar = String(post.user?.avatarUrl || '').trim();
  if (!avatar || avatar === '/favicon.ico') return undefined;
  return normalizeSeoAssetUrl(avatar) || undefined;
}

function buildInteractionStatistic(post: CommunityPost) {
  return [
    {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/LikeAction',
      userInteractionCount: Number(post.likesCount || 0),
    },
    {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: Number(post.commentsCount || 0),
    },
    {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ViewAction',
      userInteractionCount: Number(post.viewsCount || 0),
    },
  ];
}

function buildLinkedPageMentions(post: CommunityPost): LinkedPageMention[] {
  return (post.linkPreviews || [])
    .map((preview): LinkedPageMention | null => {
      const url = String(preview.url || '').trim();
      if (!/^https?:\/\//i.test(url)) return null;
      return {
        '@type': 'WebPage',
        url,
        name: sanitizeSeoText(preview.title || preview.site_name || url) || url,
        description: sanitizeSeoText(preview.description || '') || undefined,
        image: normalizeSeoAssetUrl(preview.image || preview.icon) || undefined,
      };
    })
    .filter((item): item is LinkedPageMention => Boolean(item))
    .slice(0, 5);
}

export function buildCommunityPostDiscussionJsonLd(params: {
  post: CommunityPost;
  comments: CommunityCommentThread[];
  siteName: string;
  siteLogoUrl?: string;
  canonicalUrl: string;
}) {
  const { post, comments, siteName, siteLogoUrl, canonicalUrl } = params;
  const postDescription = buildCommunityPostSeoDescription(post);
  const postImage = getCommunityPostContentImage(post);
  const authorProfileUrl = getCommunityAuthorProfileUrl(post);
  const postPublishedAt = post.rawTimestamp || post.updatedAt || undefined;
  const postModifiedAt = post.updatedAt || post.rawTimestamp || undefined;
  const authorName = String(post.user?.name || '匿名用户').trim();
  const headline = sanitizeSeoText(post.title || '');
  const linkedPageMentions = buildLinkedPageMentions(post);

  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': `${canonicalUrl}#post`,
    headline: headline || undefined,
    name: headline || undefined,
    description: postDescription || undefined,
    text: sanitizeSeoText(post.content || '') || postDescription || undefined,
    image: postImage ? [postImage] : undefined,
    datePublished: postPublishedAt,
    dateModified: postModifiedAt,
    url: canonicalUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    inLanguage: 'zh-CN',
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorProfileUrl,
      image: getAuthorAvatarImage(post),
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: siteLogoUrl
        ? {
            '@type': 'ImageObject',
            url: normalizeSeoAssetUrl(siteLogoUrl),
          }
        : undefined,
    },
    articleSection: String(post.category || '社区').trim(),
    isPartOf: {
      '@type': 'WebPage',
      url: absoluteUrl('/community'),
      name: `${siteName} 社区`,
    },
    discussionUrl: canonicalUrl,
    commentCount: Number(post.commentsCount || 0),
    keywords: Array.isArray(post.tags) ? post.tags.filter(Boolean).join(',') : undefined,
    interactionStatistic: buildInteractionStatistic(post),
    sharedContent: linkedPageMentions.length > 0 ? linkedPageMentions : undefined,
    comment: (comments || [])
      .slice(0, 20)
      .map((comment) => {
        const text = sanitizeSeoText(comment.text || '');
        return {
          '@type': 'Comment',
          text,
          datePublished: comment.createdAt || undefined,
          author: {
            '@type': 'Person',
            name: sanitizeSeoText(comment.user?.name || '匿名用户') || '匿名用户',
            image: normalizeSeoAssetUrl(comment.user?.avatarUrl) || undefined,
          },
          interactionStatistic: [
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/LikeAction',
              userInteractionCount: Number(comment.likeCount || 0),
            },
          ],
          comment: (comment.replies || [])
            .slice(0, 5)
            .map((reply) => ({
              '@type': 'Comment',
              text: sanitizeSeoText(reply.text || ''),
              datePublished: reply.createdAt || undefined,
              author: {
                '@type': 'Person',
                name: sanitizeSeoText(reply.user?.name || '匿名用户') || '匿名用户',
                image: normalizeSeoAssetUrl(reply.user?.avatarUrl) || undefined,
              },
              interactionStatistic: [
                {
                  '@type': 'InteractionCounter',
                  interactionType: 'https://schema.org/LikeAction',
                  userInteractionCount: Number(reply.likeCount || 0),
                },
              ],
            }))
            .filter((reply) => Boolean(reply.text && reply.datePublished)),
        };
      })
      .filter((comment) => Boolean(comment.text && comment.datePublished)),
  };
}

export function buildCommunityPostBreadcrumbJsonLd(params: {
  post: CommunityPost;
  canonicalUrl: string;
}) {
  const { post, canonicalUrl } = params;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '社区',
        item: absoluteUrl('/community'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name:
          sanitizeSeoText(post.title || post.summary || '帖子详情') ||
          '帖子详情',
        item: canonicalUrl,
      },
    ],
  };
}
