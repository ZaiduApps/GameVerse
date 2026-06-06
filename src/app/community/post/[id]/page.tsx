import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { MOCK_COMMUNITY_POSTS } from '@/lib/constants';
import type { CommunityPost } from '@/types';
import CommunityPostDetailView from './CommunityPostDetailView';
import {
  getCommunityCommentThreads,
  getCommunityPostById,
  type CommunityCommentThread,
} from '@/lib/community-api';
import {
  buildCommunityPostBreadcrumbJsonLd,
  buildCommunityPostDiscussionJsonLd,
  buildCommunityPostSeoDescription,
  buildCommunityPostSeoTitle,
  getCommunityAuthorProfileUrl,
  getCommunityPostShareImage,
} from '@/lib/community-seo';
import { absoluteUrl, sanitizeSeoText } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';

async function getPostById(id: string): Promise<CommunityPost | null> {
  const apiPost = await getCommunityPostById(id);
  if (apiPost) return apiPost;
  const fallback = MOCK_COMMUNITY_POSTS.find((p) => p.id === id);
  return fallback || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [config, post] = await Promise.all([getPublicSiteConfig(300), getPostById(id)]);

  if (!post) {
    return {
      title: '帖子不存在',
      description: '未找到对应社区帖子。',
      robots: { index: false, follow: false },
    };
  }

  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const canonicalPath = `/community/post/${encodeURIComponent(id)}`;
  const title = buildCommunityPostSeoTitle(post, siteName);
  const description = buildCommunityPostSeoDescription(post);
  const image = getCommunityPostShareImage(post, String(config?.basic?.share_image || '').trim());
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

  const [config, post, apiComments] = await Promise.all([
    getPublicSiteConfig(300),
    getPostById(id),
    getCommunityCommentThreads(id, 30),
  ]);

  if (!post) {
    notFound();
  }

  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const canonicalPath = `/community/post/${encodeURIComponent(id)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const communityPost = post as CommunityPost;
  const discussionJsonLd = buildCommunityPostDiscussionJsonLd({
    post: communityPost,
    comments: apiComments as CommunityCommentThread[],
    siteName,
    siteLogoUrl: config?.basic?.logo_url,
    canonicalUrl,
  });
  const breadcrumbJsonLd = buildCommunityPostBreadcrumbJsonLd({
    post: communityPost,
    canonicalUrl,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(discussionJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CommunityPostDetailView
        post={post as CommunityPost}
        initialComments={apiComments as CommunityCommentThread[]}
      />
    </>
  );
}
