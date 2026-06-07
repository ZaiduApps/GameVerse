import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, CheckCircle2, Eye, Heart, MapPin, MessageSquare, PenLine } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { absoluteUrl, normalizeSeoAssetUrl, sanitizeSeoText } from '@/lib/seo';
import { getPublicProfile, type PublicProfilePost } from '@/lib/public-profile-api';

function formatDate(value?: string): string {
  if (!value) return '未知时间';
  try {
    return new Date(value).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

function postPreview(post: PublicProfilePost): string {
  const text = sanitizeSeoText(post.summary || post.content || '');
  return text || '查看这条社区动态。';
}

function getPostTitle(post: PublicProfilePost): string {
  return sanitizeSeoText(post.title) || postPreview(post);
}

function getPostImages(post: PublicProfilePost): string[] {
  const values = [
    post.cover,
    ...(Array.isArray(post.preview_images) ? post.preview_images : []),
  ];
  return Array.from(
    new Set(
      values
        .map((url) => String(url || '').trim())
        .filter(Boolean),
    ),
  ).slice(0, 3);
}

function getPostJsonLdImages(post: PublicProfilePost): string[] | undefined {
  const images = getPostImages(post)
    .map((url) => normalizeSeoAssetUrl(url))
    .filter(Boolean);
  return images.length ? images : undefined;
}

function buildPublicProfileDescription(data: {
  user: {
    name?: string;
    username?: string;
    signature?: string;
  };
  stats: {
    post_count?: number;
    view_count?: number;
    like_count?: number;
    comment_count?: number;
  };
}): string {
  const name = data.user.name || data.user.username || '社区用户';
  const signature = sanitizeSeoText(data.user.signature || '');
  const signatureSafe =
    signature.length >= 24 &&
    !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(signature) &&
    !/(?:\+?\d[\s-]?){7,}/.test(signature)
      ? `${signature}。`
      : '';
  return `${signatureSafe}${name} 的 APKScc 社区主页，收录 ${Number(data.stats.post_count || 0)} 条公开动态、${Number(data.stats.view_count || 0)} 次浏览、${Number(data.stats.like_count || 0)} 次点赞和 ${Number(data.stats.comment_count || 0)} 条评论互动，展示游戏资讯、资源反馈、下载体验、版本讨论、攻略分享和玩家主页内容，便于关注作者的最新社区动态、公开资料、互动记录和游戏资源观点。`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ idOrUsername: string }>;
}): Promise<Metadata> {
  const { idOrUsername } = await params;
  const data = await getPublicProfile(idOrUsername);
  if (!data) {
    return {
      title: '用户不存在',
      robots: { index: false, follow: false },
    };
  }

  const name = data.user.name || data.user.username || '社区用户';
  const description = buildPublicProfileDescription(data);
  const canonicalTarget = data.user.username || idOrUsername;
  const canonicalPath = `/u/${encodeURIComponent(canonicalTarget)}`;
  const avatarUrl = normalizeSeoAssetUrl(data.user.avatar);

  return {
    title: `${name} 的主页 | 社区`,
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${name} 的主页`,
      description,
      url: absoluteUrl(canonicalPath),
      images: avatarUrl ? [{ url: avatarUrl, width: 512, height: 512, alt: `${name} 的头像` }] : [],
      type: 'profile',
    },
    twitter: {
      card: avatarUrl ? 'summary_large_image' : 'summary',
      title: `${name} 的主页`,
      description,
      images: avatarUrl ? [{ url: avatarUrl, alt: `${name} 的头像` }] : [],
    },
  };
}

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ idOrUsername: string }>;
}) {
  const { idOrUsername } = await params;
  const data = await getPublicProfile(idOrUsername);
  if (!data) notFound();

  const user = data.user;
  const displayName = user.name || user.username || '社区用户';
  const location = [user.country, user.province, user.city].filter(Boolean).join(' / ');
  const canonicalTarget = user.username || idOrUsername;
  const canonicalPath = `/u/${encodeURIComponent(canonicalTarget)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const avatarUrl = normalizeSeoAssetUrl(user.avatar);
  const profileHandle = user.username ? `@${user.username}` : user._id ? `#${user._id}` : '';
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${canonicalUrl}#profile`,
    url: canonicalUrl,
    name: `${displayName} 的社区主页`,
    description: buildPublicProfileDescription(data),
    dateCreated: user.created_at || undefined,
    dateModified: user.updated_at || user.created_at || undefined,
    mainEntity: {
      '@type': 'Person',
      '@id': `${canonicalUrl}#person`,
      url: canonicalUrl,
      name: displayName,
      alternateName: profileHandle || undefined,
      identifier: String(user._id || ''),
      image: avatarUrl || undefined,
      description: buildPublicProfileDescription(data),
      homeLocation: location
        ? {
            '@type': 'Place',
            name: location,
          }
        : undefined,
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/WriteAction',
          userInteractionCount: Number(data.stats.post_count || 0),
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/ViewAction',
          userInteractionCount: Number(data.stats.view_count || 0),
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: Number(data.stats.like_count || 0),
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/CommentAction',
          userInteractionCount: Number(data.stats.comment_count || 0),
        },
      ],
    },
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
        name: `${displayName} 的主页`,
        item: canonicalUrl,
      },
    ],
  };
  const itemListJsonLd =
    data.posts.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${canonicalUrl}#posts`,
          name: `${displayName} 的公开动态`,
          itemListOrder: 'https://schema.org/ItemListOrderDescending',
          numberOfItems: data.posts.length,
          itemListElement: data.posts.map((post, index) => {
            const postUrl = absoluteUrl(`/community/post/${encodeURIComponent(post._id)}`);
            return {
              '@type': 'ListItem',
              position: index + 1,
              url: postUrl,
              item: {
                '@type': 'SocialMediaPosting',
                additionalType: 'https://schema.org/DiscussionForumPosting',
                '@id': `${postUrl}#post`,
                headline: getPostTitle(post),
                url: postUrl,
                datePublished: post.publish_at || undefined,
                dateModified: post.updated_at || post.publish_at || undefined,
                image: getPostJsonLdImages(post),
                text: sanitizeSeoText(post.content || post.summary || '') || undefined,
                author: {
                  '@id': `${canonicalUrl}#person`,
                },
                interactionStatistic: [
                  {
                    '@type': 'InteractionCounter',
                    interactionType: 'https://schema.org/ViewAction',
                    userInteractionCount: Number(post.view_count || 0),
                  },
                  {
                    '@type': 'InteractionCounter',
                    interactionType: 'https://schema.org/LikeAction',
                    userInteractionCount: Number(post.like_count || 0),
                  },
                  {
                    '@type': 'InteractionCounter',
                    interactionType: 'https://schema.org/CommentAction',
                    userInteractionCount: Number(post.comment_count || 0),
                  },
                ],
              },
            };
          }),
        }
      : null;

  return (
    <section className="mx-auto max-w-5xl space-y-6 py-6 md:py-8" aria-label={`${displayName} 的社区主页`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {itemListJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      ) : null}
      <Card className="overflow-hidden border-primary/10 shadow-md">
        <div className="h-28 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/5" />
        <CardContent className="relative px-5 pb-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar className="-mt-10 h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatar || ''} alt={displayName} />
                <AvatarFallback className="text-xl">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                  {user.isVerified && (
                    <Badge variant="secondary" className="gap-1 border-green-200 bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      已认证
                    </Badge>
                  )}
                </div>
                {profileHandle ? (
                  <p className="text-sm text-muted-foreground">{profileHandle}</p>
                ) : null}
                <p className="max-w-2xl text-sm leading-6 text-foreground/80">
                  {user.signature || '这个用户正在探索社区。'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(user.created_at)} 加入
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['帖子', data.stats.post_count],
          ['浏览', data.stats.view_count],
          ['点赞', data.stats.like_count],
          ['评论', data.stats.comment_count],
        ].map(([label, value]) => (
          <Card key={label} className="border-primary/5 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{Number(value || 0)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/5 shadow-md">
        <CardHeader>
          <h2 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
            <PenLine className="h-5 w-5 text-primary" />
            公开动态
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.posts.length === 0 ? (
            <p className="rounded-lg bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
              暂无公开动态
            </p>
          ) : data.posts.map((post) => {
            const images = getPostImages(post);
            return (
              <Link
                key={post._id}
                href={`/community/post/${post._id}`}
                className="block rounded-lg border border-border/70 p-4 transition-colors hover:border-primary/30 hover:bg-muted/35"
              >
                <span className="flex gap-3">
                  {images.length > 0 && (
                    <span className="grid h-16 w-24 shrink-0 grid-cols-2 gap-1 overflow-hidden rounded-md bg-muted">
                      <img
                        src={images[0]}
                        alt={getPostTitle(post)}
                        className={images.length === 1 ? 'col-span-2 h-full w-full object-cover' : 'h-full w-full object-cover'}
                      />
                      {images.slice(1, 3).map((image, index) => (
                        <img
                          key={`${post._id}-preview-${image}`}
                          src={image}
                          alt={`${getPostTitle(post)} 配图 ${index + 2}`}
                          className="h-full w-full object-cover"
                        />
                      ))}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 font-semibold text-foreground">
                      {post.title || postPreview(post)}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {postPreview(post)}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(post.publish_at)}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.view_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {post.like_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.comment_count || 0}
                      </span>
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
