'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import SearchOverlay from '@/components/layout/SearchOverlay';
import type { ApiBanner } from '@/types';

const FALLBACK_BANNER_IMAGE = 'https://placehold.co/1200x560/png';
const AUTOPLAY_MS = 4500;

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
  if (!cleaned) return '/news';
  if (isExternalUrl(cleaned)) return cleaned;
  const normalized = cleaned.replace(/^\/+/, '');
  if (/^news(\/|$|\?)/i.test(normalized)) return `/${normalized}`;
  if (/^articles?(\/|$|\?)/i.test(normalized)) return `/${normalized.replace(/^articles?/i, 'news')}`;
  if (cleaned.startsWith('/')) {
    const tail = normalized.split('/').filter(Boolean).pop();
    return tail ? `/news/${tail}` : '/news';
  }
  return `/news/${normalized}`;
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
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapAnimating, setIsSnapAnimating] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaXRef = useRef(0);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const snapTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoverPausedRef = useRef(false);

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

  useEffect(() => {
    if (safeItems.length <= 1 || isPaused) return;
    const timer = window.setInterval(() => {
      goToNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, safeItems.length]);

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

  const current = safeItems[activeIndex];
  const title = current?.name || '次元世界，尽在 ACBOX';
  const description = current?.description || '发现优质二次元游戏，获取一线资讯和社区攻略。';
  const primaryHref = current ? getBannerHref(current) : '/app';
  const containerWidth = Math.max(1, containerRef.current?.clientWidth || 1);
  const dragRatio = Math.max(-1, Math.min(1, dragOffset / containerWidth));
  const dragDirection = dragOffset < 0 ? 1 : dragOffset > 0 ? -1 : 0;
  const previewItem =
    dragDirection === 0 ? null : safeItems[getWrappedIndex(activeIndex + dragDirection, safeItems.length)];
  const transitionStyle = isDragging
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

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (safeItems.length <= 1) return;
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input,textarea,select,[data-no-drag="true"]')) return;
    event.preventDefault();
    clearTransitionTimers();
    pointerIdRef.current = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    dragStartXRef.current = event.clientX;
    dragDeltaXRef.current = 0;
    draggingRef.current = true;
    draggedRef.current = false;
    setIsDragging(true);
    setIsSnapAnimating(false);
    setDragOffset(0);
    setIsPaused(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;
    if (!draggingRef.current || dragStartXRef.current === null) return;
    event.preventDefault();
    const rawDeltaX = event.clientX - dragStartXRef.current;
    const limit = containerWidth * 0.96;
    const deltaX = Math.max(-limit, Math.min(limit, rawDeltaX));
    dragDeltaXRef.current = deltaX;
    setDragOffset(deltaX);
    if (Math.abs(deltaX) > 8) {
      draggedRef.current = true;
    }
  }

  function handlePointerEnd(event?: React.PointerEvent<HTMLElement>) {
    if (event && pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;
    if (!draggingRef.current) return;
    const width = Math.max(1, containerRef.current?.clientWidth || 1);
    const threshold = Math.max(56, width * 0.12);
    const shouldSwitch = Math.abs(dragDeltaXRef.current) > threshold;
    const direction = dragDeltaXRef.current < 0 ? 1 : -1;

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

    draggingRef.current = false;
    pointerIdRef.current = null;
    dragStartXRef.current = null;
    dragDeltaXRef.current = 0;
    if (event) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {}
    }
    if (!hoverPausedRef.current) {
      setIsPaused(false);
    }
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
        className={`relative overflow-hidden rounded-[24px] border border-[#e0e3e4] bg-[#dadddf] shadow-[0_18px_40px_rgba(12,15,16,0.2)] ${
          safeItems.length > 1 ? 'cursor-grab select-none active:cursor-grabbing' : ''
        } ${className}`}
        onMouseEnter={() => {
          hoverPausedRef.current = true;
          setIsPaused(true);
        }}
        onMouseLeave={() => {
          hoverPausedRef.current = false;
          setIsPaused(false);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={handleClickCapture}
      >
        <div
          ref={containerRef}
          className={`relative overflow-hidden [perspective:1400px] ${
            compact ? 'h-[260px] sm:h-[300px] lg:h-full' : 'aspect-[21/9] min-h-[260px] sm:min-h-[340px]'
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
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[54%] bg-gradient-to-t from-black/55 via-black/22 to-transparent" />
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
            <Image
              src={getBannerImage(current)}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/38 to-transparent" />

            {!compact && (
              <div className="absolute right-6 top-6 z-20 hidden w-[280px] rounded-2xl border border-white/30 bg-black/35 p-4 text-white backdrop-blur-md lg:block">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/85">快速搜索</p>
                <button
                  type="button"
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
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#fdc003] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#553e00]">
                  Featured
                </span>
                {current?.game?.tags?.[0] && (
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    {current.game.tags[0]}
                  </span>
                )}
              </div>
              <h2 className={compact ? 'max-w-2xl text-base font-black tracking-tight text-white sm:text-xl lg:text-2xl' : 'max-w-3xl text-xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl'}>{title}</h2>
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
                    ? 'inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#b71211] to-[#ff7767] px-4 py-2 text-xs font-bold text-white transition-transform hover:scale-[1.03]'
                    : 'inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#b71211] to-[#ff7767] px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.03]'}
                >
                  立即体验
                  <ArrowRight className="h-4 w-4" />
                </ActionLink>
                <Link
                  href="/app"
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
          <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-black/35 px-3 py-2 backdrop-blur">
            {safeItems.slice(0, 6).map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={item._id}
                  type="button"
                  aria-label={`切换到第 ${index + 1} 张`}
                  onClick={() => {
                    clearTransitionTimers();
                    setIsDragging(false);
                    setIsSnapAnimating(false);
                    setDragOffset(0);
                    setActiveIndex(index);
                  }}
                  className={isActive ? 'h-2 w-7 rounded-full bg-white' : 'h-2 w-2 rounded-full bg-white/45'}
                />
              );
            })}
          </div>
        )}
      </section>
      <SearchOverlay isOpen={searchOverlayOpen} setIsOpen={setSearchOverlayOpen} />
    </>
  );
}
