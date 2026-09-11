import Image from 'next/image';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { ChevronRight, Download, ExternalLink, Link as LinkIcon, Star, Users } from 'lucide-react';

import GameAnnouncements from '@/components/game-announcements';
import GameFaqSection from '@/components/game-detail/GameFaqSection';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { normalizeGameFaqItems } from '@/lib/game-faq';
import { isWebGameType } from '@/lib/game-resource-type';
import { getPreviewImageUrl } from '@/lib/image-preview';
import { cn } from '@/lib/utils';
import type { ApiRecommendedGame, CardConfigItem, GamePageSnapshot } from '@/types';
import DeferredGameReviewPanel from './DeferredGameReviewPanel.client';
import GameDetailActions from './GameDetailActions.client';
import GameCommunitySection, { GameCommunitySkeleton } from './GameCommunitySection';
import GameHeroArtwork from './GameHeroArtwork.client';
import GameScreenshotGallery from './GameScreenshotGallery.client';
import {
  TAG_STYLE_PALETTES,
  buildGameFactItems,
  buildInstallSteps,
  buildRiskNotes,
  buildTagFilterHref,
  cleanText,
  formatDescriptionHtml,
  getGameTags,
  getPrimaryCategory,
  isPreregGameLike,
  normalizeScore,
  resolveSupportItems,
  toPlainTextWithBreaks,
  type GameFactItem,
  type RelatedNewsItem,
} from './game-detail-presenter';

interface GameDetailViewProps {
  gameData: GamePageSnapshot;
  recommendedGames: ApiRecommendedGame[];
  relatedNews: RelatedNewsItem[];
}

function SectionTitle({ children, color }: { children: ReactNode; color: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold lg:mb-6 lg:gap-3 lg:font-bold">
      <span className={cn('h-6 w-1.5 rounded-full lg:h-8 lg:w-2', color)} aria-hidden="true" />
      {children}
    </h2>
  );
}

function GameFactSummary({ items, isWebGame }: { items: GameFactItem[]; isWebGame: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-10 lg:mb-12">
      <SectionTitle color="bg-tone-blue">{isWebGame ? '基本信息' : '版本与资源信息'}</SectionTitle>
      <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-[#abadae]/10 bg-white/80 p-5 shadow-sm dark:border-border/45 dark:bg-card/75 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs font-bold text-[#757778] dark:text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-[#0f1720] dark:text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function GameSeoContent({ highlights, latestContent }: { highlights: string[]; latestContent: string }) {
  if (highlights.length === 0 && !latestContent) return null;
  return (
    <section className="mb-10 lg:mb-12">
      {highlights.length > 0 ? (
        <>
          <SectionTitle color="bg-tone-green">游戏特色</SectionTitle>
          <ul className="grid grid-cols-1 gap-2 rounded-2xl border border-[#abadae]/10 bg-white/80 p-5 text-sm leading-6 dark:border-border/45 dark:bg-card/75 sm:grid-cols-2">
            {highlights.map((highlight, index) => <li key={`${highlight}-${index}`} className="list-inside list-disc">{highlight}</li>)}
          </ul>
        </>
      ) : null}
      {latestContent ? (
        <div className={cn(highlights.length > 0 && 'mt-8')}>
          <SectionTitle color="bg-tone-blue">最新更新</SectionTitle>
          <p className="rounded-2xl border border-[#abadae]/10 bg-white/70 p-4 text-sm leading-6 text-[#595c5d] dark:border-border/45 dark:bg-card/60 dark:text-muted-foreground">{latestContent}</p>
        </div>
      ) : null}
    </section>
  );
}

function InstallationGuide({ installSteps, riskNotes }: { installSteps: string[]; riskNotes: string[] }) {
  return (
    <div className="mb-6 grid gap-4 xl:grid-cols-2 xl:gap-6">
      <Card className="rounded-2xl border-[#abadae]/10 bg-white/80 dark:border-border/45 dark:bg-card/75">
        <CardContent className="p-5 lg:p-6">
          <h3 className="text-lg font-semibold text-[#0f1720] dark:text-foreground lg:text-xl lg:font-bold">安装说明</h3>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-[#595c5d] dark:text-muted-foreground">
            {installSteps.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tone-blue text-xs font-semibold text-white">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#abadae]/10 bg-white/80 dark:border-border/45 dark:bg-card/75">
        <CardContent className="p-5 lg:p-6">
          <h3 className="text-lg font-semibold text-[#0f1720] dark:text-foreground lg:text-xl lg:font-bold">下载与使用风险提示</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[#595c5d] dark:text-muted-foreground">
            {riskNotes.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-tone-red" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function RelatedNewsSection({ items }: { items: RelatedNewsItem[] }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <SectionTitle color="bg-tone-green">相关帖子</SectionTitle>
        <Link href="/community" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-[#005e9f] lg:mb-6 lg:gap-2 lg:text-sm lg:font-medium lg:text-[#595c5d] lg:hover:text-[#b71211]">
          查看更多帖子
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.length > 0 ? items.map((item) => (
          <Link key={item.id} href={`/community/post/${encodeURIComponent(item.id)}`} className="rounded-2xl border border-[#abadae]/10 bg-white/80 p-5 transition-colors hover:border-primary/30 hover:bg-white dark:border-border/45 dark:bg-card/75">
            <h3 className="text-base font-bold text-[#2c2f30] dark:text-foreground">{item.title}</h3>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#595c5d] dark:text-muted-foreground">{item.excerpt}</p>
            <p className="mt-4 text-xs font-semibold tracking-wide text-[#757778]">{item.date}</p>
          </Link>
        )) : (
          <Card className="rounded-2xl border-[#abadae]/10 bg-white/80 dark:border-border/45 dark:bg-card/75 md:col-span-2">
            <CardContent className="p-6 text-sm text-[#595c5d] dark:text-muted-foreground">暂时没有可展示的相关帖子，稍后可以从社区继续查看该游戏的更新与活动动态。</CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

function SupportSection({ items, isWebGame }: { items: CardConfigItem[]; isWebGame: boolean }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-[#dadddf]/20 p-5 lg:p-8">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <LinkIcon className="h-6 w-6 text-tone-red" />
        {isWebGame ? '支持与服务' : '资源与支持'}
      </h2>
      <div className="space-y-4">
        {items.length > 0 ? items.map((item) => {
          const title = cleanText(item.content?.title) || '资源链接';
          const text = cleanText(item.content?.text || item.content?.html) || '点击查看';
          const href = String(item.content?.link || '').trim();
          const isExternal = /^https?:\/\//i.test(href);
          return (
            <div key={item._id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 dark:bg-card/80">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#2c2f30] dark:text-foreground">{title}</p>
                <p className="truncate text-xs text-[#595c5d] dark:text-muted-foreground">{text}</p>
              </div>
              {href ? (
                <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#005e9f] px-4 py-1.5 text-xs font-bold text-white">
                  打开
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : <span className="text-xs text-[#757778]">无链接</span>}
            </div>
          );
        }) : <div className="rounded-2xl bg-white p-4 text-sm text-[#595c5d] dark:bg-card/80 dark:text-muted-foreground">暂无资源与支持信息。</div>}
      </div>
    </section>
  );
}

function RecommendationSection({ items }: { items: ApiRecommendedGame[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <SectionTitle color="bg-tone-amber">相似推荐</SectionTitle>
      <div className="space-y-3 lg:space-y-4">
        {items.map((item) => (
          <Link key={`${item._id}-${item.pkg}`} href={`/app/${encodeURIComponent(item.pkg)}`} className="flex items-center gap-4 rounded-2xl border border-[#abadae]/10 bg-white p-3 shadow-sm transition-colors hover:bg-[#e0e3e4]/70 dark:border-border/45 dark:bg-card/75 dark:hover:bg-card/90 lg:border-0 lg:bg-transparent lg:shadow-none">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#dadddf] shadow-md">
              {item.icon ? <Image src={getPreviewImageUrl(item.icon, 112)} alt={`${item.name} icon`} fill sizes="56px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-[#0f1720] dark:text-foreground">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#595c5d] dark:text-muted-foreground">{cleanText(item.summary) || '同类热门推荐'}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#595c5d] dark:text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function GameDetailView({ gameData, recommendedGames, relatedNews }: GameDetailViewProps) {
  const game = gameData.app;
  const resources = Array.isArray(gameData.resources) ? gameData.resources : [];
  const isWebGame = isWebGameType(game.type);
  const tags = getGameTags(game);
  const primaryCategory = getPrimaryCategory(game, tags);
  const cardConfig = (gameData.cardConfig || {}) as Record<string, CardConfigItem[] | undefined>;
  const supportItems = resolveSupportItems(cardConfig);
  const downloadNotices = Array.isArray(cardConfig.download_notice) ? cardConfig.download_notice : [];
  const faqItems = normalizeGameFaqItems(gameData.faq);
  const screenshots = (Array.isArray(game.detail_images) ? game.detail_images : []).filter(Boolean);
  const displayScreenshots = screenshots.length > 0 ? screenshots : [game.header_image, game.icon].filter(Boolean);
  const heroImage = game.header_image || displayScreenshots[0] || game.icon || '';
  const facts = buildGameFactItems(game, { category: primaryCategory, resourceCount: resources.length, isWebGame });
  const highlights = Array.isArray(game.seo?.highlights) ? game.seo.highlights.map(cleanText).filter(Boolean).slice(0, 8) : [];
  const latestContent = cleanText(game.latest_content);
  const fullDescriptionHtml = formatDescriptionHtml(game.description || game.summary) || '暂无介绍';
  const hasLongDescription = toPlainTextWithBreaks(game.description || game.summary).length > 260;
  const recommendationList = recommendedGames.filter((item, index, list) => {
    const pkg = String(item.pkg || '').trim().toLowerCase();
    if (!pkg || pkg === String(game.pkg || '').trim().toLowerCase() || item._id === game._id) return false;
    return list.findIndex((candidate) => String(candidate.pkg || '').trim().toLowerCase() === pkg) === index;
  }).slice(0, 5);
  const detailAnnouncements = gameData.Announcements ?? gameData.announcements;
  const hasDetailAnnouncements = Array.isArray(detailAnnouncements)
    ? detailAnnouncements.length > 0
    : Boolean(detailAnnouncements && Object.values(detailAnnouncements).some((group) => Array.isArray(group) && group.length > 0));
  const showPreregReminder = isPreregGameLike(game) && !isWebGame;

  return (
      <div className="game-detail-stitch relative min-h-screen overflow-x-hidden bg-[#f5f6f7] text-[#2c2f30] dark:bg-[#080d14] dark:text-[#f3f6fb]">
        {hasDetailAnnouncements ? (
          <div className="relative z-20 px-4 pt-20 sm:px-6 lg:px-16 lg:pt-6 2xl:px-20">
            <div className="mx-auto max-w-7xl"><GameAnnouncements announcements={detailAnnouncements as any} position="game_detail" /></div>
          </div>
        ) : null}

        <section className={cn('relative z-10 px-4 sm:px-6 lg:px-16 2xl:px-20', hasDetailAnnouncements ? 'pt-5' : 'pt-20 lg:pt-6')}>
          <div className="mx-auto max-w-7xl">
            <div className="relative h-[340px] overflow-hidden rounded-2xl shadow-sm lg:h-[660px] lg:rounded-none lg:shadow-none">
              <GameHeroArtwork gameName={game.name} heroImage={heroImage} icon={game.icon} />
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 lg:p-8">
                <div className="rounded-2xl border border-border/60 bg-white/95 p-5 shadow-sm backdrop-blur-md dark:bg-[#111824]/95 lg:border-white/10 lg:bg-gradient-to-r lg:from-black/65 lg:via-black/45 lg:to-black/20 lg:p-8 lg:text-white dark:lg:from-black/70 dark:lg:via-black/50 dark:lg:to-black/25">
                  <div className="flex items-end gap-4 lg:gap-8">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm lg:h-36 lg:w-36 xl:h-40 xl:w-40">
                      {game.icon ? <Image src={getPreviewImageUrl(game.icon, 320)} alt={`${game.name} icon`} fill sizes="(min-width: 1280px) 160px, (min-width: 1024px) 144px, 80px" className="object-cover" /> : null}
                    </div>
                    <div className="flex min-w-0 flex-1 items-end justify-between gap-6 lg:pb-3">
                      <div className="min-w-0">
                        <div className="mb-2 hidden flex-wrap gap-2 lg:flex">
                          {tags.slice(0, 4).map((tag, index) => (
                            <Badge key={`${tag}-${index}`} className={cn('rounded-full border-none px-4 py-1.5 text-sm font-semibold', index === 0 && 'bg-tone-amber text-white', index === 1 && 'bg-tone-blue text-white', index === 2 && 'bg-tone-red text-white', index > 2 && 'bg-tone-green text-white')}>{tag}</Badge>
                          ))}
                        </div>
                        <h1 className="line-clamp-2 text-2xl font-semibold leading-tight tracking-tight text-[#0f1720] dark:text-foreground lg:text-4xl lg:text-white xl:text-5xl">{game.name}</h1>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#595c5d] dark:text-muted-foreground lg:mt-4 lg:gap-5 lg:text-sm lg:text-white/95 ">
                          <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{game.developer || '开发者未提供'}</span>
                          <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-[#fdc003] text-[#fdc003]" />{normalizeScore(game.star)}</span>
                          {!isWebGame ? <span className="hidden items-center gap-1 sm:inline-flex"><Download className="h-4 w-4" />{game.download_count_show || '0'} 下载</span> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <GameDetailActions
          game={{
            _id: game._id,
            pkg: game.pkg,
            name: game.name,
            version: game.version,
            type: game.type,
            file_size: game.file_size,
          }}
          resources={resources}
          downloadNotices={downloadNotices}
          showPreregReminder={showPreregReminder}
        />
        <div className="relative z-10 px-4 pb-32 pt-8 sm:px-6 lg:px-16 lg:pb-20 lg:pt-10 2xl:px-20">
          <div className="mx-auto max-w-7xl">
            <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
              {[
                ['综合评分', normalizeScore(game.star)],
                ['游戏分类', primaryCategory],
                [isWebGame ? '开发者' : '下载总量', isWebGame ? game.developer || '未提供' : game.download_count_show || '0'],
                [isWebGame ? '游玩方式' : '适配系统', isWebGame ? 'AC 盒子' : game.metadata?.region || 'Android'],
              ].map(([label, value]) => (
                <Card key={label} className="rounded-2xl border-[#abadae]/10 bg-white/70 dark:border-border/45 dark:bg-card/70 lg:rounded-2xl">
                  <CardContent className="flex min-h-24 flex-col items-center justify-center gap-2 p-3 text-center lg:min-h-32 lg:p-8"><p className="text-xs text-[#595c5d] lg:text-sm">{label}</p><p className="line-clamp-2 text-sm font-semibold lg:text-xl">{value}</p></CardContent>
                </Card>
              ))}
            </section>

            <GameFactSummary items={facts} isWebGame={isWebGame} />
            <GameSeoContent highlights={highlights} latestContent={latestContent} />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] lg:gap-12">
              <div className="space-y-10 lg:space-y-12">
                <section>
                  <SectionTitle color="bg-tone-red">游戏介绍</SectionTitle>
                  {hasLongDescription ? <input id="game-description-toggle" type="checkbox" aria-label="展开或收起完整游戏介绍" className="peer sr-only" /> : null}
                  <div id="game-description-content" className={cn('relative text-sm leading-relaxed text-[#595c5d] dark:text-muted-foreground lg:text-base [&_p]:mb-3 [&_p:last-child]:mb-0', hasLongDescription && 'max-h-72 overflow-hidden transition-[max-height] duration-500 peer-checked:max-h-[9999px]')} dangerouslySetInnerHTML={{ __html: fullDescriptionHtml }} />
                  {hasLongDescription ? (
                    <label htmlFor="game-description-toggle" className="mt-4 inline-flex cursor-pointer items-center gap-1 rounded text-sm font-bold text-[#005e9f] hover:underline peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[#005e9f] peer-checked:[&_.description-closed]:hidden peer-checked:[&_.description-open]:inline">
                      <span className="description-closed">查看完整介绍</span><span className="description-open hidden">收起介绍</span><ChevronRight className="h-4 w-4" />
                    </label>
                  ) : null}
                </section>

                <section>
                  <div className="flex items-center justify-between"><SectionTitle color="bg-tone-blue">精彩截图</SectionTitle><span className="mb-4 text-xs font-bold text-[#005e9f] lg:mb-6 lg:text-sm">点击查看大图</span></div>
                  <GameScreenshotGallery gameName={game.name} screenshots={displayScreenshots} />
                </section>

                <section>
                  <SectionTitle color="bg-tone-amber">游戏标签</SectionTitle>
                  <Card className="rounded-2xl border-border/60 bg-white/85 dark:border-border/45 dark:bg-card/80">
                    <CardContent className="p-5 lg:p-6"><div className="flex flex-wrap gap-3">{tags.map((tag, index) => <Link key={`${tag}-${index}`} href={buildTagFilterHref(tag)} className={cn('inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 [@media(hover:hover)]:hover:bg-muted/60', TAG_STYLE_PALETTES[index % TAG_STYLE_PALETTES.length])}>{tag}</Link>)}</div></CardContent>
                  </Card>
                </section>

                <GameFaqSection items={faqItems} intro={isWebGame ? undefined : <InstallationGuide installSteps={buildInstallSteps(game)} riskNotes={buildRiskNotes(game)} />} />
                <RelatedNewsSection items={relatedNews} />
                <Suspense fallback={<GameCommunitySkeleton />}><GameCommunitySection game={{ _id: game._id, pkg: game.pkg, name: game.name }} /></Suspense>
              </div>

              <aside className="space-y-10">
                <SupportSection items={supportItems} isWebGame={isWebGame} />
                <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-white/70 dark:bg-card/70" />}><DeferredGameReviewPanel game={{ _id: game._id, pkg: game.pkg, name: game.name, star: game.star }} summary={gameData.reviewSummary} /></Suspense>
                <RecommendationSection items={recommendationList} />
              </aside>
            </div>
          </div>
        </div>
      </div>
  );
}
