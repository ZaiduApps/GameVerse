import { cache } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';

import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { trackedApiFetch } from '@/lib/api';
import { BREADCRUMB_ROOT } from '@/lib/breadcrumbs';
import { getPreviewImageUrl } from '@/lib/image-preview';
import { getPublicSiteConfig } from '@/lib/site-config';
import {
  UPDATES_LIMIT,
  UPDATES_REVALIDATE_SECONDS,
  UPDATES_WINDOW_DAYS,
  buildUpdateCard,
  buildUpdatesJsonLd,
  buildUpdatesMetadata,
  normalizeUpdatedGamesPayload,
  type UpdateCardView,
} from '@/lib/updates-page';

/**
 * 近 7 天更新榜（#181 T181-2）。
 *
 * 数据只来自 `GET /game/updated`；接口失败或返回空列表都按「近 7 天暂无更新」
 * 渲染 200 空态（noindex, follow），不抛 500、不给占位条目。
 * 固定 30 条，不做无限滚动。
 */

// Next 要求 route segment config 必须字面量；常量只给 fetch 的 next.revalidate 复用。
// 60s：部署期预渲染的空榜最多挂 1 分钟就自愈，与 UPDATES_REVALIDATE_SECONDS 保持一致。
export const revalidate = 60;

const UPDATES_API_TIMEOUT_MS = 8000;
const FALLBACK_GAME_IMAGE = '/favicon.ico';

const loadUpdateCards = cache(async (): Promise<UpdateCardView[]> => {
  try {
    const response = await trackedApiFetch(
      `/game/updated?days=${UPDATES_WINDOW_DAYS}&limit=${UPDATES_LIMIT}`,
      {
        cache: 'force-cache',
        next: { revalidate: UPDATES_REVALIDATE_SECONDS },
        timeoutMs: UPDATES_API_TIMEOUT_MS,
        logKey: 'updates-page',
      },
    );
    if (!response.ok) {
      console.error('[updates-page] updated games responded with error', {
        status: response.status,
      });
      return [];
    }
    return normalizeUpdatedGamesPayload(await response.json())
      .map((item) => buildUpdateCard(item))
      .filter((card): card is UpdateCardView => Boolean(card));
  } catch (error) {
    console.error('[updates-page] updated games request failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
});

async function loadPageContext() {
  const [config, cards] = await Promise.all([getPublicSiteConfig(300), loadUpdateCards()]);
  return {
    cards,
    siteName: String(config?.basic?.site_name || 'APKScc').trim() || 'APKScc',
    shareImage: String(config?.basic?.share_image || '').trim(),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { cards, siteName, shareImage } = await loadPageContext();
  return buildUpdatesMetadata({ hasItems: cards.length > 0, siteName, shareImage });
}

function UpdateCard({ card }: { card: UpdateCardView }) {
  const icon = getPreviewImageUrl(card.icon, 128);

  return (
    <li className="relative flex min-h-[128px] gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors [@media(hover:hover)]:hover:border-primary/40">
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
        <Image
          src={icon || FALLBACK_GAME_IMAGE}
          alt={`${card.name} 图标`}
          width={64}
          height={64}
          className="h-full w-full object-cover"
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">
            <Link
              href={card.href}
              prefetch={false}
              className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {card.name}
            </Link>
          </h2>
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
        <dl className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {card.trustItems.map((item) => (
            <div key={item.key} className="flex items-baseline gap-1 text-[11px]">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="font-semibold text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
        {card.updateNote ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground" title={card.updateNote}>
            {card.updateNote}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function EmptyUpdatesState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-16 text-center">
      <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground/70" aria-hidden="true" />
      <p className="mt-4 text-base font-semibold text-foreground">近 7 天暂无更新</p>
      <p className="mt-2 text-sm text-muted-foreground">
        可以先看看
        <Link href="/rankings" prefetch={false} className="mx-1 font-semibold text-primary hover:underline">
          排行榜
        </Link>
        或
        <Link href="/app" prefetch={false} className="mx-1 font-semibold text-primary hover:underline">
          全部游戏
        </Link>
        。
      </p>
    </div>
  );
}

export default async function UpdatesPage() {
  const { cards, siteName } = await loadPageContext();
  const jsonLd = buildUpdatesJsonLd({ cards, siteName });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.collectionPage) }}
      />
      {jsonLd.itemList ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.itemList) }}
        />
      ) : null}

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-16 lg:py-8 2xl:px-20">
        <Breadcrumbs items={[BREADCRUMB_ROOT, { name: '近 7 天更新榜' }]} />

        <header className="mb-5 mt-3 lg:mb-8 lg:mt-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">近 7 天更新榜</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            汇总最近 {UPDATES_WINDOW_DAYS} 天有新版本的游戏，最多 {UPDATES_LIMIT} 款；版本、包大小、更新日期与来源均来自真实资源记录。
          </p>
        </header>

        {cards.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="近 7 天更新游戏列表">
            {cards.map((card) => (
              <UpdateCard key={card.id || card.pkg || card.href} card={card} />
            ))}
          </ul>
        ) : (
          <EmptyUpdatesState />
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          本页数据每分钟刷新一次；完整游戏库请前往
          <Link href="/app" prefetch={false} className="ml-1 font-semibold text-primary hover:underline">
            全部游戏
          </Link>
          。
        </p>
      </div>
    </>
  );
}
