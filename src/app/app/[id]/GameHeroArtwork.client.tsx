'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface GameHeroArtworkProps {
  gameName: string;
  heroImage: string;
  icon: string;
}

export default function GameHeroArtwork({ gameName, heroImage, icon }: GameHeroArtworkProps) {
  const initialImage = heroImage || icon;
  const [currentImage, setCurrentImage] = useState(initialImage);
  const isIconFallback = Boolean(icon) && currentImage === icon && heroImage !== icon;

  useEffect(() => {
    setCurrentImage(heroImage || icon);
  }, [heroImage, icon]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e6e8ea] dark:bg-[#121924]">
      {currentImage ? (
        <Image
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
          onError={() => {
            if (currentImage !== icon && icon) {
              setCurrentImage(icon);
              return;
            }
            setCurrentImage('');
          }}
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
