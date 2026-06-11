'use client';

import type { CommunityPost } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, ExternalLink, Eye, MessageSquare, RotateCcw, Send, Share2, ThumbsDown, ThumbsUp, X, ZoomIn, ZoomOut } from 'lucide-react';

import { buildRenderedMarkdownDocument, cn } from '@/lib/utils';
import { trackedApiFetch } from '@/lib/api';
import {
  COMMUNITY_DETAIL_BLOCKED_LINK_HOSTS,
  getCommunityUrlHost,
  isBlockedCommunityDetailLink,
} from '@/lib/community-link-policy';
import { getCommunityAuthorProfileHref } from '@/lib/community-profile';
import { hasValidCommunityReturnIntent, requestCommunityReturnRestore } from '@/lib/community-return';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getCommunityCommentLikeStatuses,
  getCommunityCommentContext,
  getCommunityCommentReplies,
  getCommunityCommentThreads,
  getCommunityPostLikeStatus,
  getCommunityTopicDetail,
  moderatorDeleteTopicComment,
  moderatorSetTopicCommentStatus,
  recordCommunityPostLinkClick,
  recordCommunityPostView,
  resolveCommunityPostViewSource,
  stripCommunityMarkdownCodeSegments,
  type CommunityCommentThread,
} from '@/lib/community-api';
import AppDownloadGuideDialog from '@/components/app-download-guide-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface CommunityPostDetailViewProps {
  post: CommunityPost;
  initialComments?: CommunityCommentThread[];
}

const BOOKMARK_STORAGE_KEY = 'community:bookmarked-posts:v1';

function readStoredIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function writeStoredIds(key: string, ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

function formatCount(value?: number | null): string {
  const count = Math.max(0, Number(value || 0));
  if (count >= 10000) return `${(count / 10000).toFixed(count >= 100000 ? 0 : 1)}万`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

function getDetailImageCellClass(count: number, index: number) {
  if (count === 1) return 'aspect-[4/3] max-h-[420px] sm:max-w-[640px]';
  if (count === 2) return 'aspect-[4/3]';
  if (count === 3 && index === 0) return 'aspect-[4/3] row-span-2';
  return 'aspect-square';
}

function normalizeComparableImageUrl(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.trim().toLowerCase();
    let path = decodeURIComponent(parsed.pathname || '/').trim();
    if (!path.startsWith('/')) path = `/${path}`;
    path = path.replace(/\/+$/, '') || '/';
    return `${host}${path}`;
  } catch {
    return raw.toLowerCase();
  }
}

function normalizeHeadingText(value?: string): string {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildFaviconUrl(value: string): string | undefined {
  const host = getCommunityUrlHost(value).replace(/^www\./, '');
  if (!host) return undefined;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

function isBlockedDetailLink(value: string): boolean {
  return isBlockedCommunityDetailLink(value);
}

function normalizeNonNegativeCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function getCommentElementId(commentId?: string): string {
  const id = String(commentId || '').trim();
  return id ? `comment-${id}` : '';
}

function getHashCommentId(): string {
  if (typeof window === 'undefined') return '';
  let raw = window.location.hash || '';
  try {
    raw = decodeURIComponent(raw);
  } catch {
    raw = '';
  }
  raw = raw.replace(/^#/, '').trim();
  const matched = raw.match(/^comment-([a-zA-Z0-9_-]+)$/);
  return matched?.[1] || '';
}

export default function CommunityPostDetailView({
  post,
  initialComments = [],
}: CommunityPostDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, token, isAuthenticated } = useAuth();

  const [comments, setComments] = useState<CommunityCommentThread[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyPageMap, setReplyPageMap] = useState<Record<string, number>>({});
  const [replyLoadingMap, setReplyLoadingMap] = useState<Record<string, boolean>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSyncingLike, setIsSyncingLike] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [isSyncingDislike, setIsSyncingDislike] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(Math.max(0, Number(post.dislikesCount || 0)));
  const [bookmarked, setBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [detailImageErrors, setDetailImageErrors] = useState<Record<string, boolean>>({});
  const [activePreviewImages, setActivePreviewImages] = useState<string[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const [isPreviewImageError, setIsPreviewImageError] = useState(false);
  const previewDragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({});
  const [pendingCommentLikeIds, setPendingCommentLikeIds] = useState<Record<string, boolean>>({});
  const [appPromptDialogOpen, setAppPromptDialogOpen] = useState(false);
  const [canModerateTopic, setCanModerateTopic] = useState(false);
  const [moderatingCommentId, setModeratingCommentId] = useState('');
  const [moderationTopicId, setModerationTopicId] = useState('');
  const [activeTocId, setActiveTocId] = useState('');
  const [hashCommentId, setHashCommentId] = useState('');
  const articleRef = useRef<HTMLElement | null>(null);
  const requestedCommentContextIdsRef = useRef<Set<string>>(new Set());
  const authorProfileHref = getCommunityAuthorProfileHref(post);
  const postId = String(post.id || '').trim();

  const postTopicIds = useMemo(
    () =>
      Array.from(
        new Set(
          (post.topicIds || [])
            .map((id) => String(id || '').trim())
            .filter(Boolean),
        ),
      ),
    [post.topicIds],
  );

  useEffect(() => {
    setViewCount(normalizeNonNegativeCount(post.viewsCount));
  }, [post.viewsCount]);

  useEffect(() => {
    setLikeCount(normalizeNonNegativeCount(post.likesCount));
    setDislikeCount(normalizeNonNegativeCount(post.dislikesCount));
  }, [post.dislikesCount, post.id, post.likesCount]);

  useEffect(() => {
    if (!postId) return;
    setBookmarked(readStoredIds(BOOKMARK_STORAGE_KEY).includes(postId));
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const source = resolveCommunityPostViewSource(referrer);

    void recordCommunityPostView({
      postId: post.id,
      referrer,
      source,
    }).then((data) => {
      if (cancelled || !data) return;
      if (data.view_count !== undefined) {
        setViewCount(normalizeNonNegativeCount(data.view_count));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [post.id]);

  useEffect(() => {
    let cancelled = false;

    const syncTopicModerationPermission = async () => {
      if (!isAuthenticated || !token || !user?._id || postTopicIds.length === 0) {
        if (!cancelled) {
          setCanModerateTopic(false);
          setModerationTopicId('');
        }
        return;
      }

      try {
        const topics = await Promise.all(
          postTopicIds.map(async (topicId) => ({
            topicId,
            topic: await getCommunityTopicDetail(topicId),
          })),
        );
        if (cancelled) return;

        const userId = String(user._id || '').trim();
        const matched = topics.find((item) => {
          const moderatorIds = Array.isArray(item.topic?.moderator_ids)
            ? item.topic!.moderator_ids
                .map((id) => String(id || '').trim())
                .filter(Boolean)
            : [];
          return moderatorIds.includes(userId);
        });

        setCanModerateTopic(Boolean(matched));
        setModerationTopicId(String(matched?.topicId || '').trim());
      } catch {
        if (cancelled) return;
        setCanModerateTopic(false);
        setModerationTopicId('');
      }
    };

    void syncTopicModerationPermission();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, postTopicIds, token, user?._id]);

  const totalCommentCount = useMemo(
    () =>
      comments.reduce(
        (acc, thread) =>
          acc +
          1 +
          Math.max(
            Number(thread.replyTotal || 0),
            Number(thread.replies?.length || 0),
          ),
        0,
      ),
    [comments],
  );
  const commentStatusIds = useMemo(
    () =>
      Array.from(
        new Set(
          comments.flatMap((comment) => [
            String(comment.id || '').trim(),
            ...(comment.replies || [])
              .map((reply) => String(reply.id || '').trim())
              .filter(Boolean),
          ]),
        ),
      ).filter(Boolean),
    [comments],
  );

  useEffect(() => {
    const next: Record<string, number> = {};
    comments.forEach((thread) => {
      const loaded = Number(thread.replies?.length || 0);
      const pageSize = Math.max(1, Number(thread.replyPageSize || loaded || 20));
      next[thread.id] = Math.max(1, Math.ceil(loaded / pageSize));
    });
    setReplyPageMap(next);
    setReplyLoadingMap({});
  }, [comments]);

  const previewSearchContent = useMemo(
    () => stripCommunityMarkdownCodeSegments(post.content || ''),
    [post.content],
  );

  const contentImageUrls = useMemo(() => {
    const urls: string[] = [];
    const pushUnique = (value?: string) => {
      const url = (value || '').trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) return;
      if (urls.includes(url)) return;
      urls.push(url);
    };
    const markdownImageRegex = /!\[[^\]]*]\((https?:\/\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/gi;
    const htmlImageRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;

    let match: RegExpExecArray | null;
    while ((match = markdownImageRegex.exec(previewSearchContent)) !== null) {
      pushUnique(match[1]);
    }
    while ((match = htmlImageRegex.exec(previewSearchContent)) !== null) {
      pushUnique(match[1]);
    }

    return urls;
  }, [previewSearchContent]);

  const previewImages = useMemo(() => {
    const urls: string[] = [];
    const pushUnique = (value?: string) => {
      const url = (value || '').trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) return;
      if (urls.includes(url)) return;
      urls.push(url);
    };

    pushUnique(post.imageUrl);
    contentImageUrls.forEach((url) => pushUnique(url));
    return urls;
  }, [contentImageUrls, post.imageUrl]);
  const detailImages = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...(post.previewImages || []),
            ...previewImages,
          ]
            .map((url) => String(url || '').trim())
            .filter((url) => /^https?:\/\//i.test(url)),
        ),
      ).slice(0, 9),
    [post.previewImages, previewImages],
  );
  const detailTopics = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...(post.topicNames || []),
            ...(post.tags || []),
          ]
            .map((tag) => String(tag || '').trim())
            .filter(Boolean),
        ),
      ).slice(0, 8),
    [post.tags, post.topicNames],
  );
  const contentLinkUrls = useMemo(() => {
    const urls: string[] = [];
    const imageUrlSet = new Set(contentImageUrls.map(normalizeComparableImageUrl));
    const pushUnique = (value?: string) => {
      const url = String(value || '').trim().replace(/[.,;!?，。；！？]+$/g, '');
      if (!/^https?:\/\//i.test(url)) return;
      if (isBlockedDetailLink(url)) return;
      if (imageUrlSet.has(normalizeComparableImageUrl(url))) return;
      if (urls.includes(url)) return;
      urls.push(url);
    };
    const urlRegex = /\bhttps?:\/\/[^\s<>"')\]]+/gi;
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(previewSearchContent)) !== null) {
      pushUnique(match[0]);
      if (urls.length >= 8) break;
    }
    return urls;
  }, [contentImageUrls, previewSearchContent]);
  const renderedContent = useMemo(
    () =>
      buildRenderedMarkdownDocument(post.content, {
        preset: 'detail',
        blockedLinkHosts: COMMUNITY_DETAIL_BLOCKED_LINK_HOSTS,
        injectHeadingAnchors: true,
        renderFirstHeadingMatchingTextAsPlainBlock: post.title || post.summary,
      }),
    [post.content, post.summary, post.title],
  );
  const linkPreviews = useMemo(() => {
    const byUrl = new Map<string, NonNullable<CommunityPost['linkPreviews']>[number]>();
    (post.linkPreviews || []).forEach((preview) => {
      const url = String(preview.url || '').trim();
      if (!/^https?:\/\//i.test(url)) return;
      if (isBlockedDetailLink(url)) return;
      byUrl.set(url, { ...preview, url, icon: preview.icon || buildFaviconUrl(url) });
    });
    contentLinkUrls.forEach((url) => {
      if (byUrl.has(url)) return;
      const host = getCommunityUrlHost(url).replace(/^www\./, '');
      byUrl.set(url, {
        url,
        title: host || '外部链接',
        description: url,
        icon: buildFaviconUrl(url),
        site_name: host,
      });
    });
    return [...byUrl.values()].slice(0, 4);
  }, [contentLinkUrls, post.linkPreviews]);
  const tocItems = useMemo(() => {
    const normalizedPostTitle = normalizeHeadingText(post.title || post.summary || '');
    const filtered = renderedContent.headings.filter((item, index) => {
      if (!item.text) return false;
      if (index === 0 && normalizedPostTitle && normalizeHeadingText(item.text) === normalizedPostTitle) {
        return false;
      }
      return true;
    });
    const narrowed = filtered.some((item) => item.level >= 2 && item.level <= 4)
      ? filtered.filter((item) => item.level >= 2 && item.level <= 4)
      : filtered;
    return narrowed.length >= 2 ? narrowed : [];
  }, [post.summary, post.title, renderedContent.headings]);
  const tocBaseLevel = useMemo(() => {
    if (tocItems.length === 0) return 2;
    return tocItems.reduce((min, item) => Math.min(min, item.level), tocItems[0].level);
  }, [tocItems]);

  const reloadComments = async () => {
    const latest = await getCommunityCommentThreads(post.id, 30);
    setComments(latest);
    setExpandedReplies({});
  };

  const mergeCommentThread = (nextThread: CommunityCommentThread) => {
    setComments((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === nextThread.id);
      if (existingIndex < 0) return [nextThread, ...prev];

      return prev.map((item, index) => {
        if (index !== existingIndex) return item;
        const mergedMap = new Map<string, CommunityCommentThread['replies'][number]>();
        item.replies.forEach((reply) => mergedMap.set(reply.id, reply));
        nextThread.replies.forEach((reply) => mergedMap.set(reply.id, reply));
        const mergedReplies = Array.from(mergedMap.values());
        return {
          ...item,
          ...nextThread,
          replies: mergedReplies,
          replyTotal: Math.max(item.replyTotal, nextThread.replyTotal, mergedReplies.length),
          replyHasMore: item.replyHasMore || nextThread.replyHasMore,
          replyPageSize: Math.max(item.replyPageSize, nextThread.replyPageSize),
        };
      });
    });
  };

  const recordDetailLinkClick = (url: string) => {
    const targetUrl = String(url || '').trim();
    if (!/^https?:\/\//i.test(targetUrl)) return;
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    void recordCommunityPostLinkClick({
      postId: post.id,
      url: targetUrl,
      referrer,
    });
  };

  const handleLinkPreviewClick = (url: string) => {
    recordDetailLinkClick(url);
  };

  const refreshCommentsSafely = async (): Promise<boolean> => {
    try {
      await reloadComments();
      return true;
    } catch {
      return false;
    }
  };

  const handleModeratorApiError = (message: string) => {
    const msg = String(message || '').trim();
    if (
      /permission|unauthorized|forbidden|no moderation permission|401|403/i.test(
        msg,
      )
    ) {
      setCanModerateTopic(false);
      setModerationTopicId('');
    }
  };

  useEffect(() => {
    setCommentLikeCounts((prev) => {
      const next: Record<string, number> = {};
      comments.forEach((comment) => {
        const commentId = String(comment.id || '').trim();
        if (commentId) {
          next[commentId] = pendingCommentLikeIds[commentId]
            ? normalizeNonNegativeCount(prev[commentId] ?? comment.likeCount)
            : normalizeNonNegativeCount(comment.likeCount);
        }
        (comment.replies || []).forEach((reply) => {
          const replyId = String(reply.id || '').trim();
          if (!replyId) return;
          next[replyId] = pendingCommentLikeIds[replyId]
            ? normalizeNonNegativeCount(prev[replyId] ?? reply.likeCount)
            : normalizeNonNegativeCount(reply.likeCount);
        });
      });
      return next;
    });
  }, [comments, pendingCommentLikeIds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    requestedCommentContextIdsRef.current.clear();
    const syncHashCommentId = () => setHashCommentId(getHashCommentId());
    syncHashCommentId();
    window.addEventListener('hashchange', syncHashCommentId);
    return () => window.removeEventListener('hashchange', syncHashCommentId);
  }, [post.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetCommentId = hashCommentId;
    if (!targetCommentId) return;

    let cancelled = false;
    const targetElementId = getCommentElementId(targetCommentId);
    const scrollToTarget = () => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(targetElementId);
        if (target) {
          target.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      });
    };
    const loadedRoot = comments.find((comment) => comment.id === targetCommentId);
    const loadedReplyRoot = comments.find((comment) =>
      comment.replies.some((reply) => reply.id === targetCommentId),
    );

    if (loadedRoot) {
      scrollToTarget();
      return;
    }
    if (loadedReplyRoot) {
      if (!expandedReplies[loadedReplyRoot.id]) {
        setExpandedReplies((prev) => ({ ...prev, [loadedReplyRoot.id]: true }));
      }
      scrollToTarget();
      return;
    }
    if (requestedCommentContextIdsRef.current.has(targetCommentId)) return;

    requestedCommentContextIdsRef.current.add(targetCommentId);
    void getCommunityCommentContext(post.id, targetCommentId)
      .then((thread) => {
        if (cancelled || !thread) return;
        mergeCommentThread(thread);
        setExpandedReplies((prev) => ({ ...prev, [thread.id]: true }));
      });

    return () => {
      cancelled = true;
    };
  }, [comments, expandedReplies, hashCommentId, post.id]);

  useEffect(() => {
    let cancelled = false;

    const syncLikeStates = async () => {
      if (!isAuthenticated || !token) {
        if (!cancelled) {
          setIsLiked(false);
          setIsDisliked(false);
          setLikedCommentIds({});
        }
        return;
      }

      try {
        const [postLiked, postDisliked, likedCommentMap] = await Promise.all([
          getCommunityPostLikeStatus({ token, postId: post.id }),
          trackedApiFetch(`/content/${encodeURIComponent(post.id)}/dislike-status`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          })
            .then((res) => res.json().catch(() => null).then((json) => ({ res, json })))
            .then(({ res, json }) => (res.ok && json?.code === 0 ? Boolean(json?.data?.disliked) : null))
            .catch(() => null),
          getCommunityCommentLikeStatuses({ token, commentIds: commentStatusIds }),
        ]);
        if (cancelled) return;

        if (postLiked !== null) {
          setIsLiked(postLiked);
        }
        if (postDisliked !== null) {
          setIsDisliked(postDisliked);
        }
        setLikedCommentIds(likedCommentMap);
      } catch {
        if (cancelled) return;
        setLikedCommentIds({});
      }
    };

    void syncLikeStates();
    return () => {
      cancelled = true;
    };
  }, [commentStatusIds, isAuthenticated, post.id, token]);

  const handleLike = async () => {
    if (isSyncingLike) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再点赞。',
        variant: 'destructive',
      });
      return;
    }

    const nextLiked = !isLiked;
    const prevLiked = isLiked;
    const prevDisliked = isDisliked;
    const prevCount = likeCount;
    const prevDislikeCount = dislikeCount;

    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (nextLiked && isDisliked) {
      setIsDisliked(false);
      setDislikeCount((prev) => Math.max(0, prev - 1));
    }
    setIsSyncingLike(true);

    try {
      const res = await trackedApiFetch(`/content/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0 || !json?.data) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }
      setIsLiked(Boolean(json.data.liked));
      setLikeCount(Number(json.data.like_count ?? 0));
      if (json.data.disliked !== undefined) {
        setIsDisliked(Boolean(json.data.disliked));
      }
      if (json.data.dislike_count !== undefined) {
        setDislikeCount(normalizeNonNegativeCount(json.data.dislike_count));
      }
    } catch {
      setIsLiked(prevLiked);
      setIsDisliked(prevDisliked);
      setLikeCount(prevCount);
      setDislikeCount(prevDislikeCount);
      toast({
        title: '点赞失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingLike(false);
    }
  };

  const handleDislike = async () => {
    if (isSyncingDislike) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再操作。',
        variant: 'destructive',
      });
      return;
    }

    const nextDisliked = !isDisliked;
    const prevLiked = isLiked;
    const prevDisliked = isDisliked;
    const prevLikeCount = likeCount;
    const prevDislikeCount = dislikeCount;

    setIsDisliked(nextDisliked);
    setDislikeCount((prev) => (nextDisliked ? prev + 1 : Math.max(0, prev - 1)));
    if (nextDisliked && isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    }
    setIsSyncingDislike(true);

    try {
      const res = await trackedApiFetch(`/content/${post.id}/dislike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0 || !json?.data) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }
      setIsDisliked(Boolean(json.data.disliked));
      setDislikeCount(normalizeNonNegativeCount(json.data.dislike_count));
      if (json.data.liked !== undefined) {
        setIsLiked(Boolean(json.data.liked));
      }
      if (json.data.like_count !== undefined) {
        setLikeCount(normalizeNonNegativeCount(json.data.like_count));
      }
    } catch {
      setIsLiked(prevLiked);
      setIsDisliked(prevDisliked);
      setLikeCount(prevLikeCount);
      setDislikeCount(prevDislikeCount);
      toast({
        title: '操作失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingDislike(false);
    }
  };

  const handleToggleBookmark = () => {
    if (!postId) return;
    const ids = new Set(readStoredIds(BOOKMARK_STORAGE_KEY));
    const nextBookmarked = !ids.has(postId);
    if (nextBookmarked) ids.add(postId);
    else ids.delete(postId);
    writeStoredIds(BOOKMARK_STORAGE_KEY, Array.from(ids));
    setBookmarked(nextBookmarked);
    toast({ title: nextBookmarked ? '收藏成功' : '已取消收藏' });
  };

  const handleCommentSubmit = async () => {
    const content = newComment.trim();
    if (!content || isSubmittingComment) return;

    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再评论或回复。',
        variant: 'destructive',
      });
      return;
    }

    const optimistic = {
      id: `tmp-${Date.now()}`,
      user: {
        name: user?.name || user?.username || 'Current User',
        avatarUrl: user?.avatar || '/favicon.ico',
        dataAiHint: 'user avatar',
      },
      timestamp: '刚刚',
      text: content,
      likeCount: 0,
      replies: [] as CommunityCommentThread['replies'],
      replyTotal: 0,
      replyHasMore: false,
      replyPageSize: 20,
    };

    setComments((prev) => {
      if (!replyTarget?.id) return [optimistic, ...prev];
      return prev.map((thread) => {
        if (thread.id !== replyTarget.id) return thread;
        return {
          ...thread,
          replies: [...thread.replies, { ...optimistic, text: `回复 @${replyTarget.name}：${content}` }],
          replyTotal: Math.max(
            Number(thread.replyTotal || 0) + 1,
            thread.replies.length + 1,
          ),
        };
      });
    });

    setIsSubmittingComment(true);
    try {
      const res = await trackedApiFetch(`/content/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          ...(replyTarget?.id ? { parent_id: replyTarget.id } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) throw new Error(json?.message || `HTTP ${res.status}`);

      setNewComment('');
      setReplyTarget(null);
      const refreshed = await refreshCommentsSafely();
      toast({
        title: '评论成功',
        description: refreshed ? '已提交。' : '已提交，评论列表稍后刷新。',
      });
    } catch {
      await refreshCommentsSafely();
      toast({
        title: '提交失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLoadMoreReplies = async (commentId: string) => {
    const thread = comments.find((item) => item.id === commentId);
    if (!thread || !thread.replyHasMore || replyLoadingMap[commentId]) return;

    const nextPage = Math.max(1, Number(replyPageMap[commentId] || 1)) + 1;
    const requestPageSize = Math.max(1, Number(thread.replyPageSize || 20));

    setReplyLoadingMap((prev) => ({ ...prev, [commentId]: true }));
    try {
      const result = await getCommunityCommentReplies(
        post.id,
        commentId,
        nextPage,
        requestPageSize,
        'latest',
      );

      setComments((prev) =>
        prev.map((item) => {
          if (item.id !== commentId) return item;
          const mergedMap = new Map<string, CommunityCommentThread['replies'][number]>();
          item.replies.forEach((reply) => {
            mergedMap.set(reply.id, reply);
          });
          result.list.forEach((reply) => {
            mergedMap.set(reply.id, reply);
          });
          const mergedReplies = Array.from(mergedMap.values());
          const total = Math.max(Number(result.total || 0), mergedReplies.length);
          return {
            ...item,
            replies: mergedReplies,
            replyTotal: total,
            replyHasMore: mergedReplies.length < total,
            replyPageSize: Number(result.pageSize || requestPageSize),
          };
        }),
      );
      setReplyPageMap((prev) => ({ ...prev, [commentId]: Number(result.page || nextPage) }));
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    } catch {
      toast({
        title: '加载失败',
        description: '更多回复加载失败，请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setReplyLoadingMap((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const openPreviewImage = (url: string) => {
    const normalizePreviewUrl = (input: string) => {
      const raw = (input || '').trim();
      if (!raw) return '';
      try {
        const parsed = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        if (parsed.pathname === '/_next/image') {
          const original = parsed.searchParams.get('url');
          if (original) return decodeURIComponent(original);
        }
        return parsed.toString();
      } catch {
        return raw;
      }
    };

    const normalizedUrl = normalizePreviewUrl(url);
    if (!normalizedUrl) return;

    const baseList = previewImages.length > 0 ? previewImages : [normalizedUrl];
    const nextList = baseList.includes(normalizedUrl)
      ? baseList
      : [normalizedUrl, ...baseList.filter((item) => item !== normalizedUrl)];
    const index = nextList.findIndex((item) => item === normalizedUrl);

    setActivePreviewImages(nextList);
    setSelectedPreviewIndex(index >= 0 ? index : 0);
    setPreviewZoom(1);
    setPreviewPosition({ x: 0, y: 0 });
    setIsPreviewDragging(false);
    setIsPreviewImageError(false);
  };

  const closePreviewImage = () => {
    setSelectedPreviewIndex(null);
    setActivePreviewImages([]);
    setPreviewZoom(1);
    setPreviewPosition({ x: 0, y: 0 });
    setIsPreviewDragging(false);
    setIsPreviewImageError(false);
  };

  const handlePrevPreviewImage = () => {
    if (activePreviewImages.length <= 1) return;
    setSelectedPreviewIndex((prev) => {
      if (prev === null) return 0;
      return (prev - 1 + activePreviewImages.length) % activePreviewImages.length;
    });
    setPreviewZoom(1);
    setPreviewPosition({ x: 0, y: 0 });
    setIsPreviewImageError(false);
  };

  const handleNextPreviewImage = () => {
    if (activePreviewImages.length <= 1) return;
    setSelectedPreviewIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % activePreviewImages.length;
    });
    setPreviewZoom(1);
    setPreviewPosition({ x: 0, y: 0 });
    setIsPreviewImageError(false);
  };

  const handlePreviewZoom = (next: number) => {
    const clamped = Math.max(0.5, Math.min(next, 3));
    setPreviewZoom(clamped);
    if (clamped <= 1) {
      setPreviewPosition({ x: 0, y: 0 });
    }
  };

  const handlePreviewImagePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (previewZoom <= 1) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    previewDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: previewPosition.x,
      originY: previewPosition.y,
    };
    setIsPreviewDragging(true);
  };

  const handleCommentLike = async (commentId: string) => {
    if (pendingCommentLikeIds[commentId]) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再点赞评论。',
        variant: 'destructive',
      });
      return;
    }

    const wasLiked = Boolean(likedCommentIds[commentId]);
    const previousCount = commentLikeCounts[commentId] ?? 0;
    const nextLiked = !wasLiked;

    setLikedCommentIds((prev) => ({ ...prev, [commentId]: nextLiked }));
    setCommentLikeCounts((prev) => ({
      ...prev,
      [commentId]: nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1),
    }));
    setPendingCommentLikeIds((prev) => ({ ...prev, [commentId]: true }));

    try {
      const res = await trackedApiFetch(`/content/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }

      const serverLiked = Boolean(json?.data?.liked ?? nextLiked);
      const parsedCount = Number(json?.data?.like_count);
      const serverCount = Number.isFinite(parsedCount)
        ? parsedCount
        : nextLiked
          ? previousCount + 1
          : Math.max(0, previousCount - 1);

      setLikedCommentIds((prev) => ({ ...prev, [commentId]: serverLiked }));
      setCommentLikeCounts((prev) => ({ ...prev, [commentId]: serverCount }));
    } catch {
      setLikedCommentIds((prev) => ({ ...prev, [commentId]: wasLiked }));
      setCommentLikeCounts((prev) => ({ ...prev, [commentId]: previousCount }));
      toast({
        title: '点赞失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setPendingCommentLikeIds((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleModeratorSetCommentStatus = async (
    commentId: string,
    status: 0 | 1,
  ) => {
    const targetCommentId = String(commentId || '').trim();
    if (!targetCommentId || !moderationTopicId || !token || !canModerateTopic) {
      return;
    }

    const actionText = status === 0 ? '下线' : '上线';
    const confirmed = window.confirm(`确认${actionText}该评论吗？`);
    if (!confirmed) return;

    setModeratingCommentId(targetCommentId);
    const result = await moderatorSetTopicCommentStatus({
      token,
      topicId: moderationTopicId,
      commentId: targetCommentId,
      status,
    });
    setModeratingCommentId('');

    if (!result.ok) {
      handleModeratorApiError(result.message);
      toast({
        title: `${actionText}失败`,
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    const refreshed = await refreshCommentsSafely();
    toast({
      title: `${actionText}成功`,
      description: refreshed
        ? result.message
        : `${result.message}，评论列表将在下次刷新后同步。`,
    });
  };

  const handleModeratorDeleteComment = async (commentId: string) => {
    const targetCommentId = String(commentId || '').trim();
    if (!targetCommentId || !moderationTopicId || !token || !canModerateTopic) {
      return;
    }

    const confirmed = window.confirm('确认删除该评论吗？删除后将不可见。');
    if (!confirmed) return;

    setModeratingCommentId(targetCommentId);
    const result = await moderatorDeleteTopicComment({
      token,
      topicId: moderationTopicId,
      commentId: targetCommentId,
    });
    setModeratingCommentId('');

    if (!result.ok) {
      handleModeratorApiError(result.message);
      toast({
        title: '删除失败',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    const refreshed = await refreshCommentsSafely();
    toast({
      title: '删除成功',
      description: refreshed
        ? result.message
        : `${result.message}，评论列表将在下次刷新后同步。`,
    });
  };

  const handleSharePost = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `/community/post/${post.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      toast({ title: '复制链接成功', description: '已复制帖子链接，可直接分享。' });
    } catch {
      toast({ title: '复制失败', description: '请稍后重试。', variant: 'destructive' });
    }
  };

  const handleMarkdownPointerIntent = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    const imageEl = target?.closest('img') as HTMLImageElement | null;
    if (!imageEl?.src) return;
    imageEl.dataset.acboxAction = 'community_post_image_preview';
    imageEl.dataset.acboxLabel = post.id;
  };

  const handleMarkdownContainerClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    const imageEl = target?.closest('img') as HTMLImageElement | null;
    if (imageEl?.src) {
      event.preventDefault();
      imageEl.dataset.acboxAction = 'community_post_image_preview';
      imageEl.dataset.acboxLabel = post.id;
      openPreviewImage(imageEl.src);
      return;
    }

    const appLinkEl = target?.closest('[data-app-link], [data-acbox-url]') as HTMLElement | null;
    if (!appLinkEl) {
      const linkEl = target?.closest('a[href]') as HTMLAnchorElement | null;
      const href = String(linkEl?.getAttribute('href') || linkEl?.href || '').trim();
      if (/^https?:\/\//i.test(href)) {
        recordDetailLinkClick(href);
      }
      return;
    }
    event.preventDefault();
    setAppPromptDialogOpen(true);
  };

  const relatedApp = post.relatedApp;
  const relatedAppHref = relatedApp?.pkg ? `/app/${relatedApp.pkg}` : undefined;
  const relatedAppPrimaryTag = relatedApp?.regionTag || relatedApp?.tags?.[0] || (relatedApp?.pkg ? '国际服' : '');
  const handleTocJump = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveTocId(headingId);
  };
  const handleBackToCommunity = () => {
    const postId = String(post.id || '').trim();
    if (postId && hasValidCommunityReturnIntent(postId) && requestCommunityReturnRestore(postId) && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace('/community');
  };

  useEffect(() => {
    if (selectedPreviewIndex === null) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPreviewIndex]);

  useEffect(() => {
    if (!isPreviewDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = previewDragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      event.preventDefault();
      setPreviewPosition({
        x: dragState.originX + (event.clientX - dragState.startX),
        y: dragState.originY + (event.clientY - dragState.startY),
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const dragState = previewDragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      previewDragStateRef.current = null;
      setIsPreviewDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isPreviewDragging]);

  useEffect(() => {
    if (selectedPreviewIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePreviewImage();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevPreviewImage();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextPreviewImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPreviewIndex, activePreviewImages.length]);

  useEffect(() => {
    if (tocItems.length === 0) {
      setActiveTocId('');
      return;
    }

    const articleElement = articleRef.current;
    if (!articleElement) {
      setActiveTocId('');
      return;
    }

    const updateActiveHeading = () => {
      let nextId = tocItems[0]?.id || '';
      tocItems.forEach((item) => {
        const element = articleElement.querySelector<HTMLElement>(`#${item.id}`);
        if (!element) return;
        if (element.getBoundingClientRect().top <= 180) {
          nextId = item.id;
        }
      });
      setActiveTocId((current) => (current === nextId ? current : nextId));
    };

    const headingElements = tocItems
      .map((item) => articleElement.querySelector<HTMLElement>(`#${item.id}`))
      .filter((element): element is HTMLElement => Boolean(element));

    if (headingElements.length === 0) {
      setActiveTocId('');
      return;
    }

    updateActiveHeading();

    const observer = new IntersectionObserver(
      () => {
        window.requestAnimationFrame(updateActiveHeading);
      },
      {
        rootMargin: '-120px 0px -65% 0px',
        threshold: [0, 0.1, 0.5, 1],
      },
    );

    headingElements.forEach((element) => observer.observe(element));
    window.addEventListener('resize', updateActiveHeading);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateActiveHeading);
    };
  }, [tocItems]);

  const renderCommentsCard = (options: { includeAnchor?: boolean } = {}) => (
    <Card id={options.includeAnchor ? 'comments' : undefined} className="scroll-mt-24 overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {options.includeAnchor ? (
            <h2 className="flex items-center text-base font-semibold">
              <MessageSquare size={18} className="mr-2 text-primary" />
              评论区
            </h2>
          ) : (
            <div className="flex items-center text-base font-semibold">
              <MessageSquare size={18} className="mr-2 text-primary" />
              评论区
            </div>
          )}
          <span className="shrink-0 text-xs text-muted-foreground">{formatCount(totalCommentCount)} 条互动</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b bg-background px-4 py-4">
          <div className="flex items-start gap-3">
            <Avatar className="mt-0.5 h-9 w-9">
              <AvatarImage src={user?.avatar || '/favicon.ico'} alt="当前用户" />
              <AvatarFallback>{(user?.name || user?.username || 'ME').slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor={options.includeAnchor ? 'comment-input' : 'comment-input-side'} className="sr-only">
                {replyTarget ? `回复 @${replyTarget.name}` : '写下你的评论'}
              </label>
              <Textarea
                id={options.includeAnchor ? 'comment-input' : 'comment-input-side'}
                aria-label={replyTarget ? `回复 @${replyTarget.name}` : '写下你的评论'}
                placeholder={replyTarget ? `回复 @${replyTarget.name}...` : '写下你的评论...'}
                rows={3}
                className="resize-none rounded-lg border-border/70 bg-muted/25 text-sm leading-6 focus-visible:ring-primary/50"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {replyTarget ? (
                  <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                    回复 @{replyTarget.name}
                    <button
                      type="button"
                      data-acbox-action="community_post_reply_cancel"
                      data-acbox-label={replyTarget.name}
                      className="ml-2 text-primary/75 hover:text-primary"
                      onClick={() => setReplyTarget(null)}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">支持评论与楼中楼回复</span>
                )}
                <Button
                  type="button"
                  data-acbox-action="community_post_comment_submit"
                  data-acbox-label={replyTarget ? 'reply' : 'comment'}
                  onClick={handleCommentSubmit}
                  className="h-8 px-3 btn-interactive"
                  size="sm"
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  <Send size={15} className="mr-1.5" /> 发送
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {comments.map((comment) => {
            const visibleReplies = expandedReplies[comment.id]
              ? comment.replies
              : comment.replies.slice(0, 2);
            return (
              <div
                key={comment.id}
                id={options.includeAnchor ? getCommentElementId(comment.id) : undefined}
                className="scroll-mt-24 px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  {comment.user.profileHref ? (
                    <Link
                      href={comment.user.profileHref}
                      aria-label={`查看 ${comment.user.name} 的主页`}
                      className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                        <AvatarFallback>{comment.user.name.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                    </Link>
                  ) : (
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                      <AvatarFallback>{comment.user.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {comment.user.profileHref ? (
                        <Link
                          href={comment.user.profileHref}
                          className="text-sm font-semibold text-foreground hover:text-primary"
                        >
                          {comment.user.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">{comment.user.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-line break-words text-[14px] leading-6 text-foreground/90">{comment.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        data-acbox-action="community_post_comment_like"
                        data-acbox-label={comment.id}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                        disabled={pendingCommentLikeIds[comment.id]}
                        onClick={() => handleCommentLike(comment.id)}
                      >
                        <ThumbsUp size={14} className={`mr-1 ${likedCommentIds[comment.id] ? 'fill-primary text-primary' : ''}`} />
                        {formatCount(commentLikeCounts[comment.id] ?? comment.likeCount ?? 0)}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        data-acbox-action="community_post_comment_reply"
                        data-acbox-label={comment.id}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => setReplyTarget({ id: comment.id, name: comment.user.name })}
                      >
                        回复
                      </Button>
                      {canModerateTopic ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-acbox-action="community_post_comment_offline"
                            data-acbox-label={comment.id}
                            className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700"
                            disabled={moderatingCommentId === comment.id}
                            onClick={() => void handleModeratorSetCommentStatus(comment.id, 0)}
                          >
                            下线
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-acbox-action="community_post_comment_delete"
                            data-acbox-label={comment.id}
                            className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                            disabled={moderatingCommentId === comment.id}
                            onClick={() => void handleModeratorDeleteComment(comment.id)}
                          >
                            删除
                          </Button>
                        </>
                      ) : null}
                    </div>

                    {(comment.replies?.length > 0 || comment.replyHasMore) && (
                      <div className="mt-3 space-y-3 rounded-lg bg-muted/30 px-3 py-3">
                        {visibleReplies.map((reply) => (
                          <div
                            key={reply.id}
                            id={options.includeAnchor ? getCommentElementId(reply.id) : undefined}
                            className="flex scroll-mt-24 items-start gap-2"
                          >
                            {reply.user.profileHref ? (
                              <Link
                                href={reply.user.profileHref}
                                aria-label={`查看 ${reply.user.name} 的主页`}
                                className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={reply.user.avatarUrl} alt={reply.user.name} />
                                  <AvatarFallback>{reply.user.name.slice(0, 1)}</AvatarFallback>
                                </Avatar>
                              </Link>
                            ) : (
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage src={reply.user.avatarUrl} alt={reply.user.name} />
                                <AvatarFallback>{reply.user.name.slice(0, 1)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                {reply.user.profileHref ? (
                                  <Link
                                    href={reply.user.profileHref}
                                    className="text-xs font-semibold text-foreground hover:text-primary"
                                  >
                                    {reply.user.name}
                                  </Link>
                                ) : (
                                  <span className="text-xs font-semibold text-foreground">{reply.user.name}</span>
                                )}
                                <span className="text-[11px] text-muted-foreground">{reply.timestamp}</span>
                              </div>
                              <p className="mt-1 whitespace-pre-line break-words text-xs leading-5 text-foreground/90">{reply.text}</p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  data-acbox-action="community_post_comment_like"
                                  data-acbox-label={reply.id}
                                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-primary"
                                  disabled={pendingCommentLikeIds[reply.id]}
                                  onClick={() => handleCommentLike(reply.id)}
                                >
                                  <ThumbsUp
                                    size={12}
                                    className={`mr-1 ${likedCommentIds[reply.id] ? 'fill-primary text-primary' : ''}`}
                                  />
                                  {formatCount(commentLikeCounts[reply.id] ?? reply.likeCount ?? 0)}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  data-acbox-action="community_post_comment_reply"
                                  data-acbox-label={reply.id}
                                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-primary"
                                  onClick={() => setReplyTarget({ id: comment.id, name: reply.user.name })}
                                >
                                  回复
                                </Button>
                                {canModerateTopic ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      data-acbox-action="community_post_comment_offline"
                                      data-acbox-label={reply.id}
                                      className="h-6 px-1.5 text-[11px] text-amber-600 hover:text-amber-700"
                                      disabled={moderatingCommentId === reply.id}
                                      onClick={() => void handleModeratorSetCommentStatus(reply.id, 0)}
                                    >
                                      下线
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      data-acbox-action="community_post_comment_delete"
                                      data-acbox-label={reply.id}
                                      className="h-6 px-1.5 text-[11px] text-red-600 hover:text-red-700"
                                      disabled={moderatingCommentId === reply.id}
                                      onClick={() => void handleModeratorDeleteComment(reply.id)}
                                    >
                                      删除
                                    </Button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-wrap gap-3 pl-9">
                          {comment.replies.length > 2 && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              data-acbox-action="community_post_reply_expand"
                              data-acbox-label={comment.id}
                              className="h-auto p-0 text-xs"
                              onClick={() =>
                                setExpandedReplies((prev) => ({
                                  ...prev,
                                  [comment.id]: !prev[comment.id],
                                }))
                              }
                            >
                              {expandedReplies[comment.id]
                                ? '收起回复'
                                : `展开 ${comment.replies.length - 2} 条回复`}
                            </Button>
                          )}
                          {comment.replyHasMore && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              data-acbox-action="community_post_reply_load_more"
                              data-acbox-label={comment.id}
                              className="h-auto p-0 text-xs"
                              disabled={replyLoadingMap[comment.id]}
                              onClick={() => void handleLoadMoreReplies(comment.id)}
                            >
                              {replyLoadingMap[comment.id]
                                ? '加载中...'
                                : `查看更多回复 (${Math.max(comment.replyTotal - comment.replies.length, 0)})`}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {comments.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无评论</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
  const commentsCard = renderCommentsCard({ includeAnchor: true });

  const currentPreviewUrl =
    selectedPreviewIndex !== null ? activePreviewImages[selectedPreviewIndex] || '' : '';
  const previewOverlay =
    selectedPreviewIndex !== null && currentPreviewUrl ? (
      <div className="fixed inset-0 z-[10000] bg-black/90">
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePreviewImage();
            }
          }}
        >
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="缩小图片"
              data-acbox-action="community_post_preview_zoom_out"
              data-acbox-label={post.id}
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={() => handlePreviewZoom(previewZoom - 0.2)}
            >
              <ZoomOut size={18} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="重置图片缩放"
              data-acbox-action="community_post_preview_reset"
              data-acbox-label={post.id}
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={() => {
                setPreviewPosition({ x: 0, y: 0 });
                setPreviewZoom(1);
              }}
            >
              <RotateCcw size={18} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="放大图片"
              data-acbox-action="community_post_preview_zoom_in"
              data-acbox-label={post.id}
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={() => handlePreviewZoom(previewZoom + 0.2)}
            >
              <ZoomIn size={18} />
            </Button>
            <Button asChild type="button" variant="ghost" size="sm" className="bg-black/50 text-white hover:bg-black/70">
              <a
                href={currentPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                data-acbox-action="community_post_preview_download"
                data-acbox-label={post.id}
              >
                下载
              </a>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="关闭图片预览"
              data-acbox-action="community_post_preview_close"
              data-acbox-label={post.id}
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={closePreviewImage}
            >
              <X size={18} />
            </Button>
          </div>
          {activePreviewImages.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="上一张图片"
                data-acbox-action="community_post_preview_prev"
                data-acbox-label={post.id}
                className="absolute left-4 top-1/2 z-20 -translate-y-1/2 bg-black/45 text-white hover:bg-black/65"
                onClick={handlePrevPreviewImage}
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="下一张图片"
                data-acbox-action="community_post_preview_next"
                data-acbox-label={post.id}
                className="absolute right-4 top-1/2 z-20 -translate-y-1/2 bg-black/45 text-white hover:bg-black/65"
                onClick={handleNextPreviewImage}
              >
                <ChevronRight size={20} />
              </Button>
            </>
          )}
          <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
            {selectedPreviewIndex + 1} / {activePreviewImages.length || 1}
          </div>

          <img
            src={currentPreviewUrl}
            alt={post.title || '帖子图片'}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onWheel={(event) => {
              event.preventDefault();
              handlePreviewZoom(previewZoom + (event.deltaY > 0 ? -0.1 : 0.1));
            }}
            onPointerDown={handlePreviewImagePointerDown}
            className="max-h-[92vh] max-w-[92vw] select-none object-contain"
            style={{
              transform: `translate(${previewPosition.x}px, ${previewPosition.y}px) scale(${previewZoom})`,
              transformOrigin: 'center center',
              touchAction: previewZoom > 1 ? 'none' : 'manipulation',
              cursor: previewZoom > 1 ? (isPreviewDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
            onError={() => setIsPreviewImageError(true)}
          />
          {isPreviewImageError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="rounded-md bg-black/55 px-3 py-2 text-sm text-white">
                图片加载失败，请切换下一张或重试
              </div>
            </div>
          )}
        </div>
      </div>
    ) : null;

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 py-8 fade-in">
      <Button
        variant="outline"
        size="sm"
        data-acbox-action="community_post_back"
        data-acbox-label={post.id}
        onClick={handleBackToCommunity}
        className="mb-2 h-8 px-3 py-1 self-start btn-interactive"
      >
        <ArrowLeft size={16} className="mr-2" />
        返回社区
      </Button>

      <div className="xl:grid xl:grid-cols-[320px_minmax(0,1fr)_360px] xl:gap-6">
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            {relatedApp ? (
              <Card className="overflow-hidden border border-white/20 shadow-xl">
                {relatedApp.icon && (
                  <div className="absolute inset-0">
                    <Image
                      src={relatedApp.icon}
                      alt={relatedApp.name}
                      fill
                      priority
                      sizes="320px"
                      className="scale-125 object-cover blur-2xl"
                    />
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-xl" />
                  </div>
                )}
                <CardContent className="relative z-10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/30 bg-white/10">
                      {relatedApp.icon ? (
                        <Image
                          src={relatedApp.icon}
                          alt={relatedApp.name}
                          fill
                          priority
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-base font-semibold text-white">{relatedApp.name}</p>
                      {relatedAppPrimaryTag && (
                        <Badge className="mt-1 border-white/30 bg-white/20 text-[11px] text-white">{relatedAppPrimaryTag}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/90">
                    {relatedApp.summary || '查看关联游戏详情与资源信息。'}
                  </p>
                  {relatedAppHref && (
                    <Button asChild size="sm" className="mt-3 w-full bg-white/20 text-white hover:bg-white/30">
                      <Link
                        href={relatedAppHref}
                        data-acbox-action="community_post_related_game_detail"
                        data-acbox-label={relatedApp?.pkg || post.id}
                      >
                        查看游戏详情
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {tocItems.length > 0 ? (
              <Card className="border-border/70 shadow-lg">
                <CardHeader className="px-4 pb-2 pt-4">
                  <div className="text-sm font-semibold">文章目录</div>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-18rem)] space-y-1 overflow-y-auto px-2 pb-3">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      data-acbox-action="community_post_toc_jump"
                      data-acbox-label={item.id}
                      className={cn(
                        'block w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                        activeTocId === item.id
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                      )}
                      style={{ paddingLeft: `${12 + Math.max(0, item.level - tocBaseLevel) * 16}px` }}
                      onClick={() => handleTocJump(item.id)}
                    >
                      <span className="line-clamp-2">{item.text}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b p-4">
              <div className="flex items-start gap-3">
                {authorProfileHref ? (
                  <Link
                    href={authorProfileHref}
                    aria-label={`查看 ${post.user.name} 的主页`}
                    className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                      <AvatarFallback>{post.user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  </Link>
                ) : (
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                    <AvatarFallback>{post.user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm leading-5">
                    {authorProfileHref ? (
                      <Link href={authorProfileHref} className="font-semibold text-foreground hover:text-primary">
                        {post.user.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">{post.user.name}</span>
                    )}
                    {post.authorUsername ? (
                      <span className="text-muted-foreground">@{post.authorUsername}</span>
                    ) : null}
                    {post.user.level ? (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        Lv.{post.user.level}
                      </span>
                    ) : null}
                    {post.isTop ? <Badge className="h-5 px-1.5 text-[10px]">置顶</Badge> : null}
                    {post.isRecommended ? <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">推荐</Badge> : null}
                    {canModerateTopic ? <Badge variant="outline" className="h-5 px-1.5 text-[10px]">版主模式</Badge> : null}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{post.timestamp}</span>
                    {post.source ? <span>{post.source}</span> : null}
                    {post.user.location ? <span>{post.user.location}</span> : null}
                    <span className="inline-flex items-center">
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      {viewCount !== null ? formatCount(viewCount) : '...'}
                    </span>
                    {post.heatScore ? <span>热度 {formatCount(post.heatScore)}</span> : null}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              {post.title ? (
                <h1 className="break-words text-[17px] font-semibold leading-7 text-foreground md:text-lg">{post.title}</h1>
              ) : null}

              {detailTopics.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {detailTopics.map((topic) => (
                    <Link
                      key={`${post.id}-detail-topic-${topic}`}
                      href={`/community?topicName=${encodeURIComponent(topic)}`}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/15"
                    >
                      #{topic}
                    </Link>
                  ))}
                </div>
              ) : null}

              <h2 className="sr-only">帖子正文与玩家讨论内容</h2>
              <article
                ref={articleRef}
                className="max-w-none break-words text-[15px] leading-7 text-foreground/90 [&_img]:hidden"
                dangerouslySetInnerHTML={{ __html: renderedContent.html }}
                onPointerDownCapture={handleMarkdownPointerIntent}
                onClick={handleMarkdownContainerClick}
              />

              {detailImages.length > 0 ? (
                <div
                  className={cn(
                    'grid gap-1.5 overflow-hidden',
                    detailImages.length === 1
                      ? 'grid-cols-1'
                      : detailImages.length === 2
                        ? 'max-w-[640px] grid-cols-2'
                        : 'max-w-[640px] grid-cols-3',
                  )}
                >
                  {detailImages.map((image, imageIndex) => (
                    <button
                      key={`${post.id}-detail-image-${imageIndex}-${image}`}
                      type="button"
                      data-acbox-action="community_post_image_preview"
                      data-acbox-label={post.id}
                      className={cn(
                        'relative overflow-hidden rounded-md bg-muted text-muted-foreground',
                        getDetailImageCellClass(detailImages.length, imageIndex),
                      )}
                      onClick={() => openPreviewImage(image)}
                    >
                      {!detailImageErrors[image] ? (
                        <Image
                          src={image}
                          alt={post.title || '帖子图片'}
                          fill
                          priority={imageIndex === 0}
                          sizes={detailImages.length === 1 ? '(max-width: 768px) 92vw, 640px' : '220px'}
                          className="object-cover transition-transform duration-200 hover:scale-[1.02]"
                          data-ai-hint={post.imageAiHint || 'community post image detail'}
                          onError={() => setDetailImageErrors((prev) => ({ ...prev, [image]: true }))}
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center px-3 text-xs">
                          图片加载失败
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : null}

              {linkPreviews.length > 0 ? (
                <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                    链接汇总
                  </div>
                  <div className="space-y-2">
                    {linkPreviews.map((preview) => (
                      <a
                        key={`${post.id}-link-preview-${preview.url}`}
                        href={preview.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow ugc"
                        data-acbox-action="community_post_link_preview_click"
                        data-acbox-label={preview.url}
                        className="flex min-w-0 gap-3 rounded-md bg-background/80 p-2.5 transition-colors hover:bg-background"
                        onClick={() => handleLinkPreviewClick(preview.url)}
                      >
                        {preview.image ? (
                          <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={preview.image}
                              alt={preview.title || '链接预览'}
                              fill
                              className="object-cover"
                            />
                          </span>
                        ) : preview.icon ? (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60">
                            <Image
                              src={preview.icon}
                              alt={preview.title || preview.site_name || '链接图标'}
                              width={28}
                              height={28}
                              className="h-7 w-7 object-contain"
                            />
                          </span>
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-sm font-medium text-foreground">
                            {preview.title || preview.site_name || preview.url}
                          </span>
                          <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {preview.description || preview.url}
                          </span>
                          {preview.site_name ? (
                            <span className="mt-1 block truncate text-[11px] text-muted-foreground/80">
                              {preview.site_name}
                            </span>
                          ) : null}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {relatedApp ? (
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {relatedApp.icon ? (
                        <Image src={relatedApp.icon} alt={relatedApp.name} fill sizes="48px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">{relatedApp.name}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {relatedApp.summary || relatedApp.pkg || '关联游戏'}
                      </p>
                    </div>
                    {relatedAppHref ? (
                      <Button asChild size="sm" variant="outline" className="h-8 shrink-0 px-3 text-xs">
                        <Link
                          href={relatedAppHref}
                          data-acbox-action="community_post_related_game_detail"
                          data-acbox-label={relatedApp?.pkg || post.id}
                        >
                          查看
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardContent>

            <CardFooter className="flex flex-wrap items-center gap-1.5 border-t px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                data-acbox-action="community_post_like"
                data-acbox-label={post.id}
                className={cn('h-8 px-2 text-muted-foreground hover:text-primary', isLiked && 'text-primary')}
                disabled={isSyncingLike}
                onClick={handleLike}
              >
                <ThumbsUp size={17} className={`mr-1.5 ${isLiked ? 'fill-primary text-primary' : ''}`} />
                {formatCount(likeCount)}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-acbox-action="community_post_dislike"
                data-acbox-label={post.id}
                className={cn('h-8 px-2 text-muted-foreground hover:text-primary', isDisliked && 'text-primary')}
                disabled={isSyncingDislike}
                onClick={handleDislike}
              >
                <ThumbsDown size={17} className={`mr-1.5 ${isDisliked ? 'fill-primary text-primary' : ''}`} />
                {formatCount(dislikeCount)}
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
                <a
                  href="#comments"
                  data-acbox-action="community_post_comment_anchor"
                  data-acbox-label={post.id}
                >
                  <MessageSquare size={17} className="mr-1.5" /> {formatCount(totalCommentCount)}
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-acbox-action="community_post_bookmark"
                data-acbox-label={post.id}
                className={cn('h-8 px-2 text-muted-foreground hover:text-primary', bookmarked && 'text-primary')}
                onClick={handleToggleBookmark}
              >
                <Bookmark size={17} className={`mr-1.5 ${bookmarked ? 'fill-primary text-primary' : ''}`} />
                收藏
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-acbox-action="community_post_share"
                data-acbox-label={post.id}
                className="ml-auto h-8 px-2 text-muted-foreground hover:text-primary"
                onClick={handleSharePost}
              >
                <Share2 size={17} className="mr-1.5" /> 分享
              </Button>
            </CardFooter>
          </Card>

          <div className="xl:hidden">{commentsCard}</div>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            {renderCommentsCard()}
          </div>
        </aside>
      </div>

      {previewOverlay && typeof document !== 'undefined' ? createPortal(previewOverlay, document.body) : null}

      <AppDownloadGuideDialog
        open={appPromptDialogOpen}
        onOpenChange={setAppPromptDialogOpen}
      />
    </div>
  );
}

