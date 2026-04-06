'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import SearchOverlay from '@/components/layout/SearchOverlay';

export default function HomeQuickSearchCard() {
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  return (
    <>
      <section className="rounded-[22px] border border-[#e0e3e4] bg-white p-5 shadow-[0_14px_28px_rgba(12,15,16,0.08)]">
        <h3 className="flex items-center gap-2 text-lg font-black text-[#2c2f30]">
          <Search className="h-4 w-4 text-[#005e9f]" />
          快速探索
        </h3>
        <p className="mt-1 text-xs text-[#595c5d]">输入关键词，直达你感兴趣的内容</p>
        <button
          type="button"
          onClick={() => setSearchOverlayOpen(true)}
          className="mt-4 flex w-full items-center gap-2 rounded-full bg-[#eff1f2] px-4 py-2.5 text-left"
        >
          <Search className="h-4 w-4 shrink-0 text-[#757778]" />
          <span className="w-full bg-transparent text-sm text-[#2c2f30]">搜索你感兴趣的二次元世界...</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchOverlayOpen(true)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#005e9f] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#004a7e]"
        >
          探索游戏库
        </button>
      </section>

      <SearchOverlay isOpen={searchOverlayOpen} setIsOpen={setSearchOverlayOpen} />
    </>
  );
}

