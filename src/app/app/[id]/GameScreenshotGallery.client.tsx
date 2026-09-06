'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useMemo, useRef, useState, type SyntheticEvent } from 'react';

import { cn } from '@/lib/utils';

const GameScreenshotLightbox = dynamic(() => import('./GameScreenshotLightbox.client'), {
  ssr: false,
});

type ScreenshotAspectKind = 'portrait' | 'landscape' | 'square' | 'unknown';

interface GameScreenshotGalleryProps {
  gameName: string;
  screenshots: string[];
}

function normalizePreviewUrl(input: string): string {
  const raw = String(input || '').trim();
  if (!raw) return '';
  const queryIndex = raw.indexOf('?');
  if (queryIndex < 0 || !raw.slice(0, queryIndex).endsWith('/_next/image')) return raw;
  try {
    const original = new URLSearchParams(raw.slice(queryIndex + 1)).get('url');
    return original ? decodeURIComponent(original) : raw;
  } catch {
    return raw;
  }
}

function getAspectKind(ratio?: number | null): ScreenshotAspectKind {
  if (!ratio || !Number.isFinite(ratio) || ratio <= 0) return 'unknown';
  if (ratio < 0.9) return 'portrait';
  if (ratio < 1.2) return 'square';
  return 'landscape';
}

function inferAspectFromUrl(input: string): ScreenshotAspectKind {
  const match = input.match(/(\d{2,5})[xX](\d{2,5})/);
  if (!match) return 'unknown';
  return getAspectKind(Number(match[1]) / Number(match[2]));
}

function cardClassName(kind: ScreenshotAspectKind): string {
  if (kind === 'portrait') return 'w-[172px] aspect-[9/16] lg:w-[236px]';
  if (kind === 'square') return 'w-[184px] aspect-square lg:w-[280px]';
  return 'w-[280px] aspect-[16/9] lg:w-[420px]';
}

function imageSizes(kind: ScreenshotAspectKind): string {
  if (kind === 'portrait') return '(min-width: 1024px) 236px, 172px';
  if (kind === 'square') return '(min-width: 1024px) 280px, 184px';
  return '(min-width: 1024px) 420px, 280px';
}

export default function GameScreenshotGallery({
  gameName,
  screenshots,
}: GameScreenshotGalleryProps) {
  const normalizedScreenshots = useMemo(
    () => screenshots.map(normalizePreviewUrl).filter(Boolean),
    [screenshots],
  );
  const inferredAspects = useMemo(
    () => Object.fromEntries(normalizedScreenshots.map((url) => [url, inferAspectFromUrl(url)])),
    [normalizedScreenshots],
  );
  const [measuredAspects, setMeasuredAspects] = useState<Record<string, ScreenshotAspectKind>>({});
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleImageLoad = (url: string, event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const kind = getAspectKind(image.naturalWidth / image.naturalHeight);
    if (kind === 'unknown') return;
    setMeasuredAspects((current) => current[url] === kind ? current : { ...current, [url]: kind });
  };

  const closePreview = () => {
    const trigger = previewIndex === null ? null : triggerRefs.current[previewIndex];
    setPreviewIndex(null);
    window.requestAnimationFrame(() => trigger?.focus());
  };

  if (normalizedScreenshots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#abadae]/30 bg-white/60 p-6 text-sm text-[#595c5d] dark:bg-card/60 dark:text-muted-foreground">
        暂无可展示的游戏截图。
      </div>
    );
  }

  return (
    <>
      <div className="scrollbar-hide flex snap-x items-end gap-4 overflow-x-auto pb-2 lg:pb-6">
        {normalizedScreenshots.map((url, index) => {
          const aspect = measuredAspects[url] || inferredAspects[url] || 'landscape';
          return (
            <button
              ref={(element) => {
                triggerRefs.current[index] = element;
              }}
              type="button"
              key={`${url}-${index}`}
              aria-label={`查看${gameName}截图 ${index + 1}`}
              data-acbox-action="game_detail_screenshot_open"
              data-acbox-label={`${gameName} 截图 ${index + 1}`}
              className={cn(
                'group relative shrink-0 snap-center overflow-hidden rounded-2xl bg-[#dadddf] shadow-[0_18px_36px_rgba(15,23,32,0.08)] transition-transform duration-300 lg:rounded-[1.5rem] lg:bg-white/60 dark:bg-card/60',
                '[@media(hover:hover)]:hover:-translate-y-1',
                cardClassName(aspect),
              )}
              onClick={() => setPreviewIndex(index)}
            >
              <Image
                src={url}
                alt={`${gameName} 截图 ${index + 1}`}
                fill
                sizes={imageSizes(aspect)}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                onLoad={(event) => handleImageLoad(url, event)}
              />
            </button>
          );
        })}
      </div>
      {previewIndex !== null ? (
        <GameScreenshotLightbox
          key={`preview-${previewIndex}`}
          gameName={gameName}
          screenshots={normalizedScreenshots}
          initialIndex={previewIndex}
          onClose={closePreview}
        />
      ) : null}
    </>
  );
}
