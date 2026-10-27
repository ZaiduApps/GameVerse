import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { CommunityPost } from '@/types';
import CommunityPostDetailView from './CommunityPostDetailView';
import {
  getCommunityCommentThreads,
  getCommunityPostById,
  type CommunityCommentThread,
} from '@/lib/community-api';
import {
  buildCommunityPostDiscussionJsonLd,
  buildCommunityPostSeoDescription,
  buildCommunityPostSeoTitle,
  getCommunityAuthorProfileUrl,
  getCommunityPostPublishedTimes,
  getCommunityPostShareImage,
} from '@/lib/community-seo';
import { absoluteUrl, sanitizeSeoText } from '@/lib/seo';
import { decodeRouteSegment, isCommunityPostId } from '@/lib/route-identifier';
import { getPublicSiteConfig } from '@/lib/site-config';

const getPostById = cache(async (id: string): Promise<CommunityPost | null> => {
  return getCommunityPostById(id);
});

/** 形状不对的 id 直接 404，连站点配置都不取。 */
function resolvePostId(id: string): string {
  const postId = decodeRouteSegment(id) ?? '';
  if (!isCommunityPostId(postId)) notFound();
  return postId;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const postId = resolvePostId(id);
  const [config, post] = await Promise.all([getPublicSiteConfig(300), getPostById(postId)]);

  // getCommunityPostById 只在后端明确 404 时返回 null，5xx / 超时等故障已抛错
  // （走 error.tsx / 500），因此这里的 null 可以安全地当作「帖子不存在」。
  if (!post) {
    notFound();
  }

  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const canonicalPath = `/community/post/${encodeURIComponent(postId)}`;
  const title = buildCommunityPostSeoTitle(post, siteName);
  const description = buildCommunityPostSeoDescription(post);
  const image = getCommunityPostShareImage(post, String(config?.basic?.share_image || '').trim());
  // 公告类帖子标题高度雷同，article:published_time 是搜索引擎区分它们的主要依据。
  const postTimes = getCommunityPostPublishedTimes(post);
  const authorUrl = getCommunityAuthorProfileUrl(post);

  return {
    title: { absolute: title },
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        'zh-CN': canonicalPath,
        'x-default': canonicalPath,
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalPath),
      siteName,
      type: 'article',
      publishedTime: postTimes.published,
      modifiedTime: postTimes.modified,
      locale: 'zh_CN',
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: sanitizeSeoText(post.title || post.summary) || siteName }]
        : [],
      authors: post.user?.name ? [post.user.name] : undefined,
      tags: Array.isArray(post.tags) ? post.tags.filter(Boolean) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [{ url: image, alt: sanitizeSeoText(post.title || post.summary) || siteName }] : [],
    },
    authors: post.user?.name
      ? [{ name: post.user.name, url: authorUrl }]
      : undefined,
  };
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = resolvePostId(id);

  const [config, post] = await Promise.all([getPublicSiteConfig(300), getPostById(postId)]);

  // getCommunityPostById 只在后端明确 404 时返回 null，5xx / 超时等故障已抛错
  // （走 error.tsx / 500），因此这里的 null 可以安全地当作「帖子不存在」。
  if (!post) {
    notFound();
  }

  const apiComments = await getCommunityCommentThreads(post.id, 30);

  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const canonicalPath = `/community/post/${encodeURIComponent(postId)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const communityPost = post as CommunityPost;
  const discussionJsonLd = buildCommunityPostDiscussionJsonLd({
    post: communityPost,
    comments: apiComments as CommunityCommentThread[],
    siteName,
    siteLogoUrl: config?.basic?.logo_url,
    canonicalUrl,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(discussionJsonLd) }} />
      <CommunityPostDetailView
        post={post as CommunityPost}
        initialComments={apiComments as CommunityCommentThread[]}
      />
    </>
  );
}
