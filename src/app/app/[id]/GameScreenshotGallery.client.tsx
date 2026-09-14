'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useMemo, useRef, useState, type SyntheticEvent } from 'react';

import { getPreviewImageUrl } from '@/lib/image-preview';
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
  // 只把被非字母数字分隔的「宽x高」当作尺寸：Google Play 的图片 ID 是随机串，
  // 里面偶尔会出现 22x27 这类巧合，误判会让卡片宽高比在图片加载完成前后跳一下。
  const match = input.match(/(?:^|[^0-9a-zA-Z])([0-9]{2,5})[xX]([0-9]{2,5})(?![0-9a-zA-Z])/);
  if (!match) return 'unknown';
  return getAspectKind(Number(match[1]) / Number(match[2]));
}

// 卡片尺寸表：统一行高 + 由原始比例推导宽度（与 Google Play 截图胶片条一致）。
// 混排横竖图时若各卡按自身比例各给一套宽高，行高会被最高的一张撑开，矮卡上方就出现大片空白。
const SCREENSHOT_CARD_SIZES = {
  portrait: { card: 'h-[160px] aspect-[9/16] lg:h-[240px]', mobile: 90, desktop: 135, preview: 320 },
  square: { card: 'h-[160px] aspect-square lg:h-[240px]', mobile: 160, desktop: 240, preview: 480 },
  landscape: { card: 'h-[160px] aspect-[16/9] lg:h-[240px]', mobile: 284, desktop: 427, preview: 860 },
} as const;

function getCardSize(kind: ScreenshotAspectKind) {
  return kind === 'portrait' || kind === 'square' ? SCREENSHOT_CARD_SIZES[kind] : SCREENSHOT_CARD_SIZES.landscape;
}

function cardClassName(kind: ScreenshotAspectKind): string {
  return getCardSize(kind).card;
}

function imageSizes(kind: ScreenshotAspectKind): string {
  const size = getCardSize(kind);
  return '(min-width: 1024px) ' + size.desktop + 'px, ' + size.mobile + 'px';
}

// 预览图按展示宽度的 2 倍取（覆盖 DPR2 屏幕），不足一档的按档位向上取。
function previewImageWidth(kind: ScreenshotAspectKind): number {
  return getCardSize(kind).preview;
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
      <div className="flex snap-x items-center gap-3 overflow-x-auto py-1.5 lg:gap-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
        {normalizedScreenshots.map((url, index) => {
          const aspect = measuredAspects[url] || inferredAspects[url] || 'landscape';
          const previewUrl = getPreviewImageUrl(url, previewImageWidth(aspect));
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
                'group relative shrink-0 snap-center overflow-hidden rounded-2xl bg-muted shadow-sm transition-colors duration-300 lg:rounded-2xl lg:bg-white/60 dark:bg-card/60',
                cardClassName(aspect),
              )}
              onClick={() => setPreviewIndex(index)}
            >
              {/* 等比缩放到卡内（contain），不用 cover 填满：卡片比例是按「档位」取整的，图与档位
                  不完全一致时 cover 会裁掉内容——9:19.5 的全面屏截图塞进 9/16 约裁 18%，4:3 截图塞进
                  16/9 约裁 25%；截图是「要看清内容」的素材，宁可留白也不裁。 */}
              <Image
                src={previewUrl}
                alt={`${gameName} 截图 ${index + 1}`}
                fill
                sizes={imageSizes(aspect)}
                className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
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
