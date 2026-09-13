'use client';

import Image from 'next/image';
import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getResponsiveImageAttributes } from '@/lib/image-preview';
import { cn } from '@/lib/utils';

interface GameHeroArtworkProps {
  gameName: string;
  heroImage: string;
  icon: string;
}

const HERO_IMAGE_SIZES = [
  '(max-width: 639px) calc(100vw - 2rem)',
  '(max-width: 1023px) calc(100vw - 3rem)',
  '(max-width: 1439px) calc(100vw - 8rem)',
  '1280px',
].join(', ');

export default function GameHeroArtwork({ gameName, heroImage, icon }: GameHeroArtworkProps) {
  const initialImage = heroImage || icon;
  const [currentImage, setCurrentImage] = useState(initialImage);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasCheckedHydratedImage = useRef(false);
  const isIconFallback = Boolean(icon) && currentImage === icon && heroImage !== icon;
  const responsiveImage = getResponsiveImageAttributes(currentImage);
  // 首图分两层渲染：底层把同一张图放大铺满并高斯模糊，保证画幅 100% 不留空档；
  // 上层按原始比例居中显示清晰图，四周自然过渡到虚化层。
  // 首图源分辨率常低于画幅（例如 512×250 铺 1106×384），整图裁切放大必然发虚，所以清晰层用 contain。
  // 两层共用同一份 src/srcSet/sizes，浏览器只会下载一次。
  const artworkLayers = isIconFallback
    ? [{ id: 'fallback', decorative: false, className: 'scale-110 object-cover object-center blur-[10px] saturate-75' }]
    : [
        { id: 'backdrop', decorative: true, className: 'scale-110 object-cover object-center blur-xl lg:blur-2xl' },
        { id: 'sharp', decorative: false, className: 'object-contain object-center' },
      ];
  const refLayerId = isIconFallback ? 'fallback' : 'sharp';

  const handleImageError = useCallback((failedImage: string) => {
    setCurrentImage((renderedImage) => {
      if (renderedImage !== failedImage) return renderedImage;
      if (failedImage !== icon && icon) return icon;
      return '';
    });
  }, [icon]);

  useEffect(() => {
    setCurrentImage(heroImage || icon);
  }, [heroImage, icon]);

  useEffect(() => {
    if (hasCheckedHydratedImage.current) return;
    hasCheckedHydratedImage.current = true;

    const image = imageRef.current;
    // SSR 首图可能在 React 接管前已经失败，水合后补检并进入同一回退流程。
    if (currentImage && image?.complete && image.naturalWidth === 0) {
      handleImageError(currentImage);
    }
  }, [currentImage, handleImageError]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e6e8ea] dark:bg-[#121924]">
      {responsiveImage.srcSet ? (
        <Head>
          <link
            rel="preload"
            as="image"
            imageSrcSet={responsiveImage.srcSet}
            imageSizes={HERO_IMAGE_SIZES}
            fetchPriority="high"
          />
        </Head>
      ) : null}
      {artworkLayers.map((layer) =>
        responsiveImage.srcSet ? (
          <img
            key={layer.id}
            ref={layer.id === refLayerId ? imageRef : undefined}
            src={responsiveImage.src}
            srcSet={responsiveImage.srcSet}
            sizes={HERO_IMAGE_SIZES}
            alt={layer.decorative ? '' : `${gameName} 封面图`}
            aria-hidden={layer.decorative || undefined}
            loading="eager"
            decoding="async"
            fetchPriority={layer.decorative ? undefined : 'high'}
            className={cn('absolute inset-0 h-full w-full transition-all duration-500', layer.className)}
            onError={layer.decorative ? undefined : () => handleImageError(currentImage)}
          />
        ) : currentImage ? (
          <Image
            key={layer.id}
            ref={layer.id === refLayerId ? imageRef : undefined}
            src={currentImage}
            alt={layer.decorative ? '' : `${gameName} 封面图`}
            aria-hidden={layer.decorative || undefined}
            fill
            priority={!layer.decorative}
            fetchPriority={layer.decorative ? undefined : 'high'}
            sizes="100vw"
            className={cn('transition-all duration-500', layer.className)}
            onError={layer.decorative ? undefined : () => handleImageError(currentImage)}
          />
        ) : null,
      )}
      {isIconFallback ? (
        <div className="absolute inset-0 bg-white/14 backdrop-blur-md dark:bg-black/20" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#f5f6f7] via-transparent to-black/20 dark:hidden lg:from-black/55 lg:via-black/15 lg:to-black/15" />
      <div className="absolute inset-0 hidden bg-gradient-to-t from-[#080d14]/90 via-[#080d14]/38 to-black/15 dark:block" />
    </div>
  );
}
