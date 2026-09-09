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
        <>
          <Head>
            <link
              rel="preload"
              as="image"
              imageSrcSet={responsiveImage.srcSet}
              imageSizes={HERO_IMAGE_SIZES}
              fetchPriority="high"
            />
          </Head>
          <img
            ref={imageRef}
            src={responsiveImage.src}
            srcSet={responsiveImage.srcSet}
            sizes={HERO_IMAGE_SIZES}
            alt={`${gameName} 封面图`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className={cn(
              'absolute inset-0 h-full w-full object-cover object-center transition-all duration-500',
              isIconFallback && 'scale-110 blur-[10px] saturate-75',
            )}
            onError={() => handleImageError(currentImage)}
          />
        </>
      ) : currentImage ? (
        <Image
          ref={imageRef}
          src={currentImage}
          alt={`${gameName} 封面图`}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className={cn(
            'object-cover object-center transition-all duration-500',
            isIconFallback && 'scale-110 blur-[10px] saturate-75',
          )}
          onError={() => handleImageError(currentImage)}
        />
      ) : null}
      {isIconFallback ? (
        <div className="absolute inset-0 bg-white/14 backdrop-blur-md dark:bg-black/20" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#f5f6f7] via-transparent to-black/20 dark:hidden lg:from-black/55 lg:via-black/15 lg:to-black/15" />
      <div className="absolute inset-0 hidden bg-gradient-to-t from-[#080d14]/90 via-[#080d14]/38 to-black/15 dark:block" />
    </div>
  );
}
