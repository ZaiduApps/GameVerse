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
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';

function stripHtml(input?: string | null): string {
  return String(input || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(1, max - 3)).trim()}...`;
}

function buildPostTitle(post: CommunityPost, siteName: string): string {
  const core = String(post.title || post.summary || '社区帖子').trim() || '社区帖子';
  return clamp(`${core} | ${siteName} 社区`, 90);
}

function buildPostDescription(post: CommunityPost): string {
  const source = String(post.summary || post.content || '查看社区帖子详情').trim();
  return clamp(stripHtml(source), 180);
}

function getPostImage(post: CommunityPost, fallbackImage: string): string {
  const image = String(post.imageUrl || '').trim();
  return image || fallbackImage;
}

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
  const title = buildPostTitle(post, siteName);
  const description = buildPostDescription(post);
  const image = getPostImage(post, String(config?.basic?.share_image || '').trim());

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
      images: image ? [image] : [],
      authors: post.user?.name ? [post.user.name] : undefined,
      tags: Array.isArray(post.tags) ? post.tags.filter(Boolean) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
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
  const postDescription = buildPostDescription(post as CommunityPost);
  const postImage = getPostImage(post as CommunityPost, String(config?.basic?.share_image || '').trim());

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: String((post as CommunityPost).title || (post as CommunityPost).summary || '社区帖子').trim(),
    description: postDescription || undefined,
    image: postImage ? [postImage] : undefined,
    mainEntityOfPage: canonicalUrl,
    inLanguage: 'zh-CN',
    author: {
      '@type': 'Person',
      name: String((post as CommunityPost).user?.name || '匿名用户').trim(),
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: config?.basic?.logo_url
        ? {
            '@type': 'ImageObject',
            url: config.basic.logo_url,
          }
        : undefined,
    },
    articleSection: String((post as CommunityPost).category || '社区').trim(),
    keywords: Array.isArray((post as CommunityPost).tags)
      ? (post as CommunityPost).tags!.filter(Boolean).join(',')
      : undefined,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: Number((post as CommunityPost).likesCount || 0),
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: Number((post as CommunityPost).commentsCount || 0),
      },
    ],
  };

  const breadcrumbJsonLd = {
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
        name: String((post as CommunityPost).title || (post as CommunityPost).summary || '帖子详情').trim(),
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
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
