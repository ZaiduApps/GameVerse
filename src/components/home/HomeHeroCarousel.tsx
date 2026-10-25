'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import SearchOverlay from '@/components/layout/SearchOverlay';
import type { ApiBanner } from '@/types';

const FALLBACK_BANNER_IMAGE = '/favicon.ico';
const AUTOPLAY_MS = 4500;
// 首屏图按视口取 interface 的 /media/variants 变体（302 到 CDN webp）。
const VARIANT_WIDTHS = [480, 720, 1080] as const;

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function hasProtocol(value: string): boolean {
  return /^[a-z][a-z\d+\-.]*:/i.test(value);
}

function normalizeGotoType(value: string | undefined): 'game' | 'url' | 'article' | 'news' | 'unknown' {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'game' || normalized === 'url' || normalized === 'article' || normalized === 'news') {
    return normalized;
  }
  return 'unknown';
}

function toInternalPath(value: string): string {
  const cleaned = String(value || '').trim();
  if (!cleaned) return '/';
  if (cleaned.startsWith('/')) return cleaned;
  return `/${cleaned.replace(/^\/+/, '')}`;
}

function toNewsHref(value: string): string {
  const cleaned = String(value || '').trim();
  if (!cleaned) return '/community';
  if (isExternalUrl(cleaned)) return cleaned;
  const normalized = cleaned.replace(/^\/+/, '');
  if (/^community\/post\//i.test(normalized)) return `/${normalized}`;
  if (/^news(\/|$|\?)/i.test(normalized) || /^articles?(\/|$|\?)/i.test(normalized)) {
    const tail = normalized.split('/').filter(Boolean).pop();
    return tail ? `/community/post/${tail}` : '/community';
  }
  if (cleaned.startsWith('/')) {
    const tail = normalized.split('/').filter(Boolean).pop();
    return tail ? `/community/post/${tail}` : '/community';
  }
  return `/community/post/${normalized}`;
}

function toGameHref(banner: ApiBanner, rawLink: string): string {
  const gamePkg = String(banner.game?.pkg || '').trim();
  const gameId = String(banner.game?._id || '').trim();
  if (gamePkg || gameId) return `/app/${gamePkg || gameId}`;
  const cleaned = String(rawLink || '').trim();
  if (!cleaned) return '/app';
  if (isExternalUrl(cleaned)) return cleaned;
  const normalized = cleaned.replace(/^\/+/, '');
  if (/^app\//i.test(normalized)) return `/${normalized}`;
  return `/app/${normalized}`;
}

function getBannerHref(banner: ApiBanner): string {
  const rawLink = String(banner.url_link || '').trim();
  const gotoType = normalizeGotoType((banner as { goto_type?: string }).goto_type);

  if (gotoType === 'game') {
    return toGameHref(banner, rawLink);
  }

  if ((gotoType === 'article' || gotoType === 'news') && rawLink) {
    return toNewsHref(rawLink);
  }

  if (rawLink) {
    if (hasProtocol(rawLink)) return rawLink;
    return toInternalPath(rawLink);
  }
  if (banner.game?.pkg || banner.game?._id) {
    return toGameHref(banner, rawLink);
  }
  return '#';
}

function getBannerImage(banner?: ApiBanner): string {
  if (!banner) return FALLBACK_BANNER_IMAGE;
  return banner.url_image || banner.game?.header_image || banner.game?.icon || FALLBACK_BANNER_IMAGE;
}

/**
 * 变体端点只接受 http(s) 绝对地址；站内相对图（含兜底 favicon）不参与变体，
 * 继续走原图，避免把相对路径当成第三方面板图源送出去。
 */
function toVariantSource(value: string): string | null {
  const raw = String(value || '').trim();
  if (!raw || raw === FALLBACK_BANNER_IMAGE) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  return null;
}

function buildVariantSrcSet(value: string): string | undefined {
  const source = toVariantSource(value);
  if (!source) return undefined;
  const encoded = encodeURIComponent(source);
  return VARIANT_WIDTHS.map((width) => `/api/media/variants?url=${encoded}&w=${width} ${width}w`).join(', ');
}

function getWrappedIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return (index % length + length) % length;
}

function ActionLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (hasProtocol(href) || href.startsWith('//') || href.startsWith('#')) {
    const openInNewTab = isExternalUrl(href);
    return (
      <a
        href={href}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={className}
        data-no-drag="true"
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} data-no-drag="true">
      {children}
    </Link>
  );
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return prefersReducedMotion;
}

interface HomeHeroCarouselProps {
  bannerItems: ApiBanner[];
  compact?: boolean;
  className?: string;
}

export default function HomeHeroCarousel({ bannerItems, compact = false, className = '' }: HomeHeroCarouselProps) {
  const safeItems = useMemo(
    () => (Array.isArray(bannerItems) ? bannerItems.filter((item): item is ApiBanner => Boolean(item && item._id)) : []),
    [bannerItems],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [heroVariantFailed, setHeroVariantFailed] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapAnimating, setIsSnapAnimating] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  // 指针按下时的起点；水平意图确认前不进入拖拽态，纵向手势交还页面滚动。
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaXRef = useRef(0);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const snapTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // 触屏点击会合成 mouseenter 且没有对应的 mouseleave，据此把手势暂停与真悬停区分开。
  const lastPointerTypeRef = useRef<string | null>(null);

  function clearTransitionTimers() {
    if (snapTimerRef.current) {
      window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }

  function goToNext() {
    if (safeItems.length <= 1) return;
    setActiveIndex((prev) => getWrappedIndex(prev + 1, safeItems.length));
  }

  function goToPrev() {
    if (safeItems.length <= 1) return;
    setActiveIndex((prev) => getWrappedIndex(prev - 1, safeItems.length));
  }

  const isAutoplaySuspended =
    isPaused || isHovered || isFocusWithin || isDocumentHidden || prefersReducedMotion;

  useEffect(() => {
    if (safeItems.length <= 1 || isAutoplaySuspended) return;
    const timer = window.setInterval(() => {
      goToNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [isAutoplaySuspended, safeItems.length]);

  useEffect(() => {
    const update = () => setIsDocumentHidden(document.visibilityState === 'hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
    };
  }, []);

  useEffect(() => {
    if (activeIndex >= safeItems.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, safeItems.length]);

  // 回到首屏时重新尝试变体（上一次失败可能只是端点临时不可用）。
  useEffect(() => {
    setHeroVariantFailed(false);
  }, [activeIndex]);

  const current = safeItems[activeIndex];
  const heroImageSrc = getBannerImage(current);
  const isHeroFirstSlide = activeIndex === 0;
  const heroVariantSrcSet = isHeroFirstSlide && !heroVariantFailed ? buildVariantSrcSet(heroImageSrc) : undefined;
  const title = current?.name || '次元世界，尽在 ACBOX';
  const description = current?.description || '发现优质二次元游戏，获取一线资讯和社区攻略。';
  const primaryHref = current ? getBannerHref(current) : '/app';
  const containerWidth = Math.max(1, containerRef.current?.clientWidth || 1);
  const dragRatio = Math.max(-1, Math.min(1, dragOffset / containerWidth));
  const dragDirection = dragOffset < 0 ? 1 : dragOffset > 0 ? -1 : 0;
  const previewItem =
    dragDirection === 0 ? null : safeItems[getWrappedIndex(activeIndex + dragDirection, safeItems.length)];
  const transitionStyle =
    isDragging || prefersReducedMotion
      ? 'none'
      : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease';
  const mainScale = 1 - Math.min(0.075, Math.abs(dragRatio) * 0.075);
  const mainRotate = -dragRatio * 14;
  const mainTransform = `translate3d(${dragOffset}px,0,0) rotateY(${mainRotate}deg) scale(${mainScale})`;
  const previewBaseX = dragDirection > 0 ? containerWidth : -containerWidth;
  const previewX = previewBaseX + dragOffset;
  const previewRotate = dragDirection > 0 ? -16 + Math.abs(dragRatio) * 16 : 16 - Math.abs(dragRatio) * 16;
  const previewScale = 0.9 + Math.min(0.1, Math.abs(dragRatio) * 0.1);
  const previewTransform = `translate3d(${previewX}px,0,0) rotateY(${previewRotate}deg) scale(${previewScale})`;
  const previewOpacity = Math.min(1, Math.abs(dragRatio) * 1.15);

  function clearPointerState() {
    pointerStartRef.current = null;
    dragStartXRef.current = null;
    dragDeltaXRef.current = 0;
    pointerIdRef.current = null;
    draggingRef.current = false;
  }

  /** pointercancel / 放弃拖拽：完全复位，不切换，不留半拖状态。 */
  function resetDragState() {
    clearTransitionTimers();
    clearPointerState();
    setIsDragging(false);
    setIsSnapAnimating(false);
    setDragOffset(0);
    setIsPaused(false);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    lastPointerTypeRef.current = event.pointerType;
    if (safeItems.length <= 1) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input,textarea,select,[data-no-drag="true"]')) return;
    // 不 preventDefault、不 setPointerCapture：先只记起点，等水平意图确认再接管，
    // 否则浏览器会把纵向手势判成取消（pointercancel）导致页面滚不动。
    pointerStartRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    pointerIdRef.current = event.pointerId;
    draggedRef.current = false;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    lastPointerTypeRef.current = event.pointerType;
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;

    if (!draggingRef.current) {
      const start = pointerStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const movedHorizontally = Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy);
      if (!movedHorizontally) {
        // 明显纵向或停滞：放弃拖拽，把手势交还页面滚动。
        if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
          clearPointerState();
        }
        return;
      }
      clearTransitionTimers();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
      dragStartXRef.current = event.clientX;
      dragDeltaXRef.current = 0;
      draggingRef.current = true;
      draggedRef.current = true;
      setIsDragging(true);
      setIsSnapAnimating(false);
      setDragOffset(0);
      setIsPaused(true);
    }

    if (dragStartXRef.current === null) return;
    event.preventDefault();
    const rawDeltaX = event.clientX - dragStartXRef.current;
    const limit = containerWidth * 0.96;
    const deltaX = Math.max(-limit, Math.min(limit, rawDeltaX));
    dragDeltaXRef.current = deltaX;
    setDragOffset(deltaX);
  }

  function releaseCapture(event: React.PointerEvent<HTMLElement>) {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLElement>) {
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;
    const wasDragging = draggingRef.current;
    releaseCapture(event);
    if (!wasDragging) {
      clearPointerState();
      return;
    }
    resetDragState();
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLElement>) {
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;
    releaseCapture(event);
    const wasDragging = draggingRef.current;
    const deltaX = dragDeltaXRef.current;
    clearPointerState();
    if (!wasDragging) return;

    const width = Math.max(1, containerRef.current?.clientWidth || 1);
    const threshold = Math.max(56, width * 0.12);
    const shouldSwitch = Math.abs(deltaX) > threshold;
    const direction = deltaX < 0 ? 1 : -1;

    setIsDragging(false);
    setIsSnapAnimating(true);
    if (shouldSwitch && safeItems.length > 1) {
      const outgoingOffset = direction > 0 ? -width : width;
      setDragOffset(outgoingOffset);
      snapTimerRef.current = window.setTimeout(() => {
        setIsDragging(true);
        setActiveIndex((prev) => getWrappedIndex(prev + direction, safeItems.length));
        setDragOffset(0);
        window.requestAnimationFrame(() => {
          setIsDragging(false);
          setIsSnapAnimating(false);
        });
      }, 280);
    } else {
      setDragOffset(0);
      settleTimerRef.current = window.setTimeout(() => {
        setIsSnapAnimating(false);
      }, 280);
    }

    setIsPaused(false);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  }

  function handleClickCapture(event: React.MouseEvent<HTMLElement>) {
    if (!draggedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <>
      <section
        className={`relative touch-pan-y overflow-hidden rounded-2xl border border-border bg-[#dadddf] shadow-sm ${
          safeItems.length > 1 ? 'cursor-grab select-none active:cursor-grabbing' : ''
        } ${className}`}
        onMouseEnter={() => {
          // 触屏点击会合成 mouseenter 且没有 mouseleave；真悬停才暂停。
          if (lastPointerTypeRef.current !== 'touch') setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setIsFocusWithin(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsFocusWithin(false);
          }
        }}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
      >
        <div
          ref={containerRef}
          className={`relative w-full overflow-hidden [perspective:1400px] ${
            compact
              ? 'aspect-[16/11] min-h-[210px] sm:aspect-[16/9] lg:aspect-auto lg:h-full'
              : 'aspect-[21/9] min-h-[260px] sm:min-h-[340px]'
          }`}
        >
          {previewItem && (
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute inset-0 will-change-transform"
                style={{
                  transform: previewTransform,
                  opacity: previewOpacity,
                  transition: transitionStyle,
                  transformOrigin: dragDirection > 0 ? 'left center' : 'right center',
                  backfaceVisibility: 'hidden',
                }}
              >
                <Image
                  src={getBannerImage(previewItem)}
                  alt={previewItem.name || '预览图'}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/70 via-black/30 to-transparent sm:h-[54%] sm:from-black/55 sm:via-black/22" />
              </div>
            </div>
          )}

          <div
            className="absolute inset-0 will-change-transform"
            style={{
              transform: mainTransform,
              transition: transitionStyle,
              transformOrigin: dragOffset < 0 ? 'right center' : 'left center',
              backfaceVisibility: 'hidden',
              zIndex: isSnapAnimating ? 25 : 20,
            }}
          >
            {isHeroFirstSlide ? (
              // 首屏用原生 img：next/image 在 `images.unoptimized: true` 下会把自定义
              // srcSet/sizes 覆盖成 undefined（见 get-img-props 的 generateImgAttrs），
              // 只有原生 img 才能带上 /media/variants 的 480/720/1080 三档。
              <img
                src={heroImageSrc}
                srcSet={heroVariantSrcSet}
                sizes={heroVariantSrcSet ? '(max-width: 768px) 100vw, 1200px' : undefined}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                onError={(event) => {
                  if (!heroVariantSrcSet) return;
                  // 变体端点不可用时浏览器不会自动回退到 src，这里手动退回原图。
                  const img = event.currentTarget;
                  img.removeAttribute('srcset');
                  img.removeAttribute('sizes');
                  img.src = heroImageSrc;
                  setHeroVariantFailed(true);
                }}
              />
            ) : (
              <Image
                src={heroImageSrc}
                alt={title}
                fill
                priority={false}
                fetchPriority="auto"
                loading="lazy"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[92%] bg-gradient-to-t from-black/95 via-black/70 to-transparent sm:h-[62%] sm:from-black/85 sm:via-black/40" />

            {!compact && (
              <div className="absolute right-6 top-6 z-20 hidden w-[280px] rounded-2xl border border-white/30 bg-black/35 p-4 text-white backdrop-blur-md lg:block">
                <p className="text-xs font-semibold tracking-normal text-white/85">快速搜索</p>
                <button
                  type="button"
                  aria-label="打开快速搜索"
                  onClick={() => setSearchOverlayOpen(true)}
                  className="mt-3 flex h-10 w-full items-center justify-start gap-2 rounded-xl border border-white/35 bg-white/15 px-3 text-sm text-white/95 transition-colors hover:bg-white/22"
                >
                  <Search className="h-4 w-4 text-white/85" />
                  搜索游戏、应用、资讯...
                </button>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(current?.game?.tags || []).slice(0, 3).map((tag, index) => (
                    <button
                      type="button"
                      key={`${tag}-${index}`}
                      aria-label={`搜索 ${tag}`}
                      onClick={() => setSearchOverlayOpen(true)}
                      className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/92 transition-colors hover:bg-white/25"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={compact ? 'absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6' : 'absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10'}>
              <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-3">
                <span className="rounded-full bg-[#fdc003] px-3 py-1 text-[11px] font-semibold tracking-normal text-[#553e00]">
                  Featured
                </span>
                {current?.game?.tags?.[0] && (
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    {current.game.tags[0]}
                  </span>
                )}
              </div>
              <h2
                className={
                  compact
                    ? 'line-clamp-2 max-w-2xl text-base font-semibold tracking-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.6)] sm:text-xl lg:text-2xl'
                    : 'max-w-3xl text-xl font-semibold tracking-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.6)] sm:text-3xl lg:text-4xl'
                }
              >
                {title}
              </h2>
              <p
                className={
                  compact
                    ? 'mt-2 max-w-xl line-clamp-2 text-xs text-white/90 [text-shadow:0_2px_8px_rgba(0,0,0,0.65)] sm:text-sm'
                    : 'mt-3 max-w-2xl text-sm text-white/90 [text-shadow:0_2px_8px_rgba(0,0,0,0.65)] sm:text-base'
                }
              >
                {description}
              </p>
              <div className={compact ? 'mt-3 flex flex-wrap gap-2' : 'mt-5 flex flex-wrap gap-3'}>
                <ActionLink
                  href={primaryHref}
                  className={compact
                    ? 'inline-flex items-center gap-2 rounded-full bg-[#b71211] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90'
                    : 'inline-flex items-center gap-2 rounded-full bg-[#b71211] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90'}
                >
                  立即体验
                  <ArrowRight className="h-4 w-4" />
                </ActionLink>
                <Link
                  href="/app"
                  prefetch={false}
                  data-no-drag="true"
                  className={compact
                    ? 'inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20'
                    : 'inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20'}
                >
                  浏览游戏库
                </Link>
              </div>
            </div>
          </div>
        </div>
        {safeItems.length > 1 && (
          <div
            data-no-drag="true"
            className="absolute right-1 top-2 flex flex-wrap items-center justify-end rounded-full sm:bottom-5 sm:right-5 sm:top-auto sm:bg-black/35 sm:backdrop-blur"
          >
            {safeItems.slice(0, 10).map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={item._id}
                  type="button"
                  aria-label={`切换到第 ${index + 1} 张`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => {
                    clearTransitionTimers();
                    setIsDragging(false);
                    setIsSnapAnimating(false);
                    setDragOffset(0);
                    setActiveIndex(index);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                >
                  <span
                    aria-hidden="true"
                    className={
                      isActive
                        ? 'block h-2 w-6 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition-all'
                        : 'block h-2 w-2 rounded-full bg-white/60 shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition-all'
                    }
                  />
                </button>
              );
            })}
          </div>
        )}
      </section>
      <SearchOverlay isOpen={searchOverlayOpen} setIsOpen={setSearchOverlayOpen} />
    </>
  );
}
