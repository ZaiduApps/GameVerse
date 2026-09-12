import Image from 'next/image';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { BadgeCheck, ChevronRight, CreditCard, Download, ExternalLink, MessageSquare, Play, Rocket, ShieldCheck, Sparkles } from 'lucide-react';

import GameAnnouncements from '@/components/game-announcements';
import GameFaqSection from '@/components/game-detail/GameFaqSection';
import { normalizeGameFaqItems } from '@/lib/game-faq';
import { isWebGameType } from '@/lib/game-resource-type';
import { getPreviewImageUrl } from '@/lib/image-preview';
import { cn } from '@/lib/utils';
import type { ApiRecommendedGame, CardConfigItem, GamePageSnapshot } from '@/types';
import DeferredGameReviewPanel from './DeferredGameReviewPanel.client';
import GameCommunitySection, { GameCommunitySkeleton } from './GameCommunitySection';
import GameDetailActions from './GameDetailActions.client';
import GameDetailBreadcrumb from './GameDetailBreadcrumb';
import GameDetailMobileTabs from './GameDetailMobileTabs.client';
import GameHeroArtwork from './GameHeroArtwork.client';
import GameScreenshotGallery from './GameScreenshotGallery.client';
import { BOX_DOWNLOAD_CARD, CERTIFICATION_CARD, GUIDE_SECTION_HINT, HERO_PV_PILL } from './game-detail-mock-copy';
import {
  buildHeroMetrics,
  buildHeroPurchaseNote,
  buildLatestUpdate,
  buildRelatedPosts,
  buildResourceLinks,
  buildSimilarGames,
  buildSpecTiles,
  buildTrustBadges,
  type RelatedPostView,
} from './game-detail-stitch-mapper';
import {
  TAG_STYLE_PALETTES,
  buildGameFactItems,
  buildInstallSteps,
  buildRiskNotes,
  buildTagFilterHref,
  cleanText,
  formatCompactCount,
  formatDescriptionHtml,
  getGameTags,
  getPrimaryCategory,
  isPreregGameLike,
  resolveSupportItems,
  toPlainTextWithBreaks,
  type RelatedNewsItem,
} from './game-detail-presenter';

interface GameDetailViewProps {
  gameData: GamePageSnapshot;
  recommendedGames: ApiRecommendedGame[];
  relatedNews: RelatedNewsItem[];
}

// 详情页所有内容区块共用的卡片外壳：移动端紧凑（p-4 / text-sm），PC 端按视觉稿放大（p-6 / text-lg）。
function DetailSection({
  id,
  title,
  subtitle,
  action,
  className,
  children,
}: {
  id?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-[#abadae]/20 bg-white p-4 shadow-sm lg:p-6 dark:border-border/45 dark:bg-card/80',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3 lg:mb-5 lg:items-center">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#2c2f30] lg:gap-2 lg:text-lg dark:text-foreground">
            <span className="h-3.5 w-1 shrink-0 rounded-full bg-primary lg:h-4 lg:w-1.5" aria-hidden="true" />
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-[#757778] lg:text-xs dark:text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-1.5">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

// 更新日志的单条内容：把“小标题：正文”的结构拆出来加粗，和视觉稿的排版一致。
function LatestBullet({ text }: { text: string }) {
  const match = text.match(/^([^：:]{2,20})[：:]\s*(.+)$/);
  if (!match) return <>{text}</>;
  return (
    <>
      <strong>{match[1]}：</strong>
      {match[2]}
    </>
  );
}

function InstallationGuide({ installSteps, riskNotes }: { installSteps: string[]; riskNotes: string[] }) {
  return (
    <div className="mb-3 grid gap-2.5 lg:mb-4 lg:grid-cols-2 lg:gap-4">
      <div className="rounded-xl border border-[#abadae]/15 bg-[#eff1f2]/60 p-3 lg:p-4">
        <h3 className="text-xs font-bold text-[#2c2f30] lg:text-sm dark:text-foreground">安装说明</h3>
        <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#595c5d] lg:text-sm dark:text-muted-foreground">
          {installSteps.map((item, index) => (
            <li key={item} className="flex gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-xl border border-[#abadae]/15 bg-[#eff1f2]/60 p-3 lg:p-4">
        <h3 className="text-xs font-bold text-[#2c2f30] lg:text-sm dark:text-foreground">下载与使用风险提示</h3>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#595c5d] lg:text-sm dark:text-muted-foreground">
          {riskNotes.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tone-red" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function HeroBadges({ badges }: { badges: { label: string; className: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map((badge, index) => (
        <span
          key={badge.label}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium lg:text-xs',
            badge.className,
          )}
        >
          {index === 0 ? <span className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-pulse" aria-hidden="true" /> : null}
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function RelatedNewsSection({ items }: { items: RelatedPostView[] }) {
  if (items.length === 0) return null;
  return (
    <DetailSection
      title="相关帖子"
      action={
        <Link
          href="/community"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors [@media(hover:hover)]:hover:underline"
        >
          查看更多
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="grid gap-2 lg:grid-cols-2 lg:gap-3">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-start justify-between gap-3 rounded-xl border border-[#abadae]/15 p-3 transition-colors [@media(hover:hover)]:hover:border-primary/40 [@media(hover:hover)]:hover:bg-primary/[0.04] lg:p-4"
          >
            <span className="line-clamp-2 text-xs font-semibold leading-snug text-[#2c2f30] lg:text-sm dark:text-foreground">{item.title}</span>
            <span className="shrink-0 text-[10px] text-[#757778] lg:text-xs dark:text-muted-foreground">{item.date}</span>
          </Link>
        ))}
      </div>
    </DetailSection>
  );
}

function ResourceLinksCard({ items }: { items: ReturnType<typeof buildResourceLinks> }) {
  return (
    <DetailSection title="官方资源与外链服务">
      <div className="space-y-2.5 lg:space-y-3">
        {items.map((item) => {
          const Icon = item.icon === 'card' ? CreditCard : item.icon === 'rocket' ? Rocket : MessageSquare;
          const isExternal = /^https?:\/\//i.test(item.href);
          const body = (
            <>
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border lg:h-9 lg:w-9', item.tone)}>
                <Icon className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-[#2c2f30] dark:text-foreground">{item.title}</span>
                <span className="block truncate text-[11px] text-[#757778] dark:text-muted-foreground">{item.description}</span>
              </span>
            </>
          );
          const rowClass =
            'flex items-center justify-between gap-3 rounded-xl border border-[#abadae]/15 p-2.5 transition-colors lg:p-3';
          if (!item.href) {
            return (
              <div key={item.key} className={rowClass}>
                <span className="flex min-w-0 items-center gap-3">{body}</span>
              </div>
            );
          }
          return (
            <a
              key={item.key}
              href={item.href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className={cn(rowClass, '[@media(hover:hover)]:hover:border-primary/40 [@media(hover:hover)]:hover:bg-primary/[0.04]')}
            >
              <span className="flex min-w-0 items-center gap-3">{body}</span>
              <ExternalLink className="h-4 w-4 shrink-0 text-[#abadae]" aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </DetailSection>
  );
}

function CertificationCard() {
  return (
    <section className="rounded-2xl border border-tone-green/25 bg-gradient-to-br from-tone-green/[0.07] to-white p-4 shadow-sm lg:p-5 dark:to-card">
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tone-green text-white">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm font-bold text-[#2c2f30] dark:text-foreground">{CERTIFICATION_CARD.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#595c5d] dark:text-muted-foreground">{CERTIFICATION_CARD.description}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-tone-green/20 pt-3 text-center text-[11px] font-medium text-tone-green">
        {CERTIFICATION_CARD.chips.map((chip) => (
          <div key={chip} className="rounded-lg bg-tone-green/10 py-1.5">
            ✓ {chip}
          </div>
        ))}
      </div>
    </section>
  );
}

function BoxDownloadCard() {
  return (
    <section className="rounded-2xl border border-[#abadae]/20 bg-white p-4 shadow-sm lg:p-6 dark:border-border/45 dark:bg-card/80">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm font-bold text-[#2c2f30] dark:text-foreground">
        <span>{BOX_DOWNLOAD_CARD.title}</span>
        <span className="text-xs font-normal text-[#757778] dark:text-muted-foreground">{BOX_DOWNLOAD_CARD.status}</span>
      </div>
      <Link
        href="/download"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition-colors [@media(hover:hover)]:hover:bg-primary/90"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
        立即下载 AC 盒子 App
      </Link>
      <p className="mt-3 text-xs leading-relaxed text-[#757778] dark:text-muted-foreground">{BOX_DOWNLOAD_CARD.helper}</p>
    </section>
  );
}

function SimilarGamesCard({ items }: { items: ReturnType<typeof buildSimilarGames> }) {
  if (items.length === 0) return null;
  return (
    <DetailSection
      title="相似推荐"
      action={
        <Link href="/app" className="text-xs text-[#757778] transition-colors [@media(hover:hover)]:hover:text-primary dark:text-muted-foreground">
          查看更多
        </Link>
      }
    >
      <div className="space-y-3 lg:space-y-4">
        {items.map((item) => {
          const body = (
            <>
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#abadae]/15 bg-[#eff1f2]">
                {item.icon ? (
                  <Image src={getPreviewImageUrl(item.icon, 112)} alt={item.name + ' 图标'} fill sizes="48px" className="object-cover" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-[#2c2f30] dark:text-foreground">{item.name}</span>
                <span className="mt-0.5 block truncate text-[11px] text-[#757778] dark:text-muted-foreground">{item.meta}</span>
              </span>
            </>
          );
          if (!item.href) {
            return (
              <div key={item.key} className="flex items-center gap-3">
                {body}
              </div>
            );
          }
          return (
            <Link key={item.key} href={item.href} className="group flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">{body}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eff1f2] text-[#595c5d] transition-colors [@media(hover:hover)]:group-hover:bg-primary [@media(hover:hover)]:group-hover:text-white dark:bg-muted/60 dark:text-muted-foreground">
                <Download className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </DetailSection>
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
  const recommendationList = recommendedGames
    .filter((item, index, list) => {
      const pkg = String(item.pkg || '').trim().toLowerCase();
      if (!pkg || pkg === String(game.pkg || '').trim().toLowerCase() || item._id === game._id) return false;
      return list.findIndex((candidate) => String(candidate.pkg || '').trim().toLowerCase() === pkg) === index;
    })
    .slice(0, 5);
  const detailAnnouncements = gameData.Announcements ?? gameData.announcements;
  const hasDetailAnnouncements = Array.isArray(detailAnnouncements)
    ? detailAnnouncements.length > 0
    : Boolean(detailAnnouncements && Object.values(detailAnnouncements).some((group) => Array.isArray(group) && group.length > 0));
  const showPreregReminder = isPreregGameLike(game) && !isWebGame;

  // 视觉稿视图模型：真实数据优先，缺失字段由 game-detail-stitch-mapper 统一回落。
  const trustBadges = buildTrustBadges(tags);
  const purchaseNote = buildHeroPurchaseNote();
  const heroMetrics = buildHeroMetrics({ game, primaryCategory, isWebGame, reviewSummary: gameData.reviewSummary });
  const specTiles = buildSpecTiles(facts);
  const latestUpdate = buildLatestUpdate(game, latestContent);
  const resourceLinks = buildResourceLinks(supportItems);
  const similarGames = buildSimilarGames(recommendationList);
  const relatedPosts = buildRelatedPosts(relatedNews);
  const ratingCount = Math.max(0, Number(gameData.reviewSummary?.ratingCount || 0));
  const reviewCountLabel = ratingCount > 0 ? formatCompactCount(ratingCount) : undefined;
  const heroDescription = cleanText(game.description || game.summary);
  const actionGame = { _id: game._id, pkg: game.pkg, name: game.name, version: game.version, type: game.type, file_size: game.file_size };
  // 移动端三宫格只取综合评分 / 下载热度 / 适龄与平台，与稿件一致。
  const mobileMetrics = [heroMetrics[0], heroMetrics[2], heroMetrics[3]].filter(Boolean);

  return (
    <div className="game-detail-stitch relative min-h-screen overflow-x-clip bg-[#f5f6f7] text-[#2c2f30] dark:bg-[#080d14] dark:text-[#f3f6fb]">
      {hasDetailAnnouncements ? (
        <div className="relative z-20 px-4 pt-20 sm:px-6 lg:px-16 lg:pt-6 2xl:px-20">
          <div className="mx-auto max-w-7xl">
            <GameAnnouncements announcements={detailAnnouncements as any} position="game_detail" />
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto hidden max-w-7xl px-4 sm:px-6 lg:block lg:px-16 lg:pb-1 lg:pt-4 2xl:px-20">
        <GameDetailBreadcrumb
          gameId={game.pkg || game._id || ''}
          gameName={game.name}
          category={primaryCategory}
          categoryHref={buildTagFilterHref(primaryCategory)}
        />
      </div>

            {/* Hero：单一响应式 DOM。移动端全宽沉浸封面 + 悬浮信息卡；PC 端限制画幅并在信息卡右侧叠放操作区。 */}
      <section data-stitch="hero" className="relative">
        <div className="lg:mx-auto lg:max-w-7xl lg:px-16 2xl:px-20">
          <div
            data-stitch="banner"
            className="relative h-72 w-full overflow-hidden bg-[#e6e8ea] sm:h-80 lg:h-96 lg:rounded-3xl lg:border lg:border-[#abadae]/20 lg:shadow-sm dark:bg-[#121924]"
          >
            <GameHeroArtwork gameName={game.name} heroImage={heroImage} icon={game.icon} />
            <span className="absolute bottom-16 right-4 z-10 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm lg:hidden">
              <Play className="h-3 w-3 fill-current" aria-hidden="true" />
              {HERO_PV_PILL}
            </span>
          </div>

          {/* 信息卡：移动端上浮压住封面 48px，PC 端退回常规栅格并与封面留出间距 */}
          <div data-stitch="info-card" className="relative -mt-12 px-4 lg:mt-6 lg:px-0">
            <div className="rounded-2xl border border-[#abadae]/20 bg-white p-4 shadow-sm lg:rounded-3xl lg:p-8 dark:border-border/45 dark:bg-card/80">
              <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                <div className="flex items-center gap-3.5 lg:gap-6">
                  <div className="relative shrink-0">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[#abadae]/20 bg-[#eff1f2] shadow-sm lg:h-24 lg:w-24">
                      {game.icon ? (
                        <Image
                          src={getPreviewImageUrl(game.icon, 320)}
                          alt={game.name + ' 图标'}
                          fill
                          sizes="(min-width: 1024px) 96px, 80px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <span
                      className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-tone-green text-white dark:border-card"
                      title="已通过官方安全校验"
                    >
                      <BadgeCheck className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <HeroBadges badges={trustBadges} />
                    <h1 className="text-lg font-bold leading-snug tracking-tight text-[#2c2f30] sm:text-xl lg:text-2xl dark:text-foreground">{game.name}</h1>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#595c5d] dark:text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-[#2c2f30] dark:text-foreground">
                        {game.developer || '开发者未提供'}
                        <BadgeCheck className="h-3.5 w-3.5 text-tone-blue" aria-hidden="true" />
                      </span>
                      <span className="text-[#abadae]">•</span>
                      <span className="text-[#757778] dark:text-muted-foreground">{purchaseNote}</span>
                    </div>
                    {heroDescription ? (
                      // line-clamp-2 与 lg:block 作用在同一元素上时，变体生成的 display:block 会覆盖 -webkit-box 导致截断失效，
                      // 因此外层只负责响应式显隐，内层单独负责行数截断。
                      <div className="hidden lg:block">
                        <p className="line-clamp-2 max-w-2xl text-xs leading-relaxed text-[#595c5d] lg:text-sm dark:text-muted-foreground">
                          {heroDescription}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
                <GameDetailActions
                  game={actionGame}
                  resources={resources}
                  downloadNotices={downloadNotices}
                  showPreregReminder={showPreregReminder}
                />
              </div>

              {/* 指标条：移动端 3 格（隐藏「游戏分类」），PC 端 4 格 */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#abadae]/15 pt-3.5 lg:mt-8 lg:grid-cols-4 lg:gap-4 lg:pt-5">
                {heroMetrics.map((metric, index) => (
                  <div
                    key={metric.label}
                    className={cn(
                      'flex flex-col items-center justify-center px-1 lg:px-3',
                      index > 0 && 'border-l border-[#abadae]/15',
                      index === 1 && 'hidden lg:flex',
                    )}
                  >
                    <span className="hidden text-[10px] font-medium tracking-wider text-[#757778] lg:block dark:text-muted-foreground">{metric.label}</span>
                    <span
                      className={cn(
                        'text-sm font-bold text-[#2c2f30] lg:mt-0.5 lg:font-semibold dark:text-foreground',
                        index === 0 && 'text-tone-amber lg:text-[#2c2f30] lg:dark:text-foreground',
                      )}
                    >
                      {metric.value}
                    </span>
                    <span className="mt-0.5 text-[11px] text-[#757778] lg:text-[10px] dark:text-muted-foreground">{metric.hint}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <GameDetailMobileTabs reviewCountLabel={reviewCountLabel} />

      {/* 主体：左列内容 8 / 右列侧栏 4（lg 及以上），移动端单列堆叠 */}
      <div data-stitch="main" className={cn('relative z-10 mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-16 lg:pb-16 2xl:px-20', hasDetailAnnouncements ? 'pt-5 lg:pt-8' : 'pt-3 lg:pt-8')}>
        <div data-stitch="main-grid" className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] lg:items-start lg:gap-8">
          <div data-stitch="main-column" className="space-y-3.5 lg:space-y-8">
            <DetailSection
              id="game-detail-section-overview"
              title="游戏精选截图与实机展示"
              subtitle="点击截图可放大查看高清原始画质"
            >
              <GameScreenshotGallery gameName={game.name} screenshots={displayScreenshots} />
            </DetailSection>

            <DetailSection title="版本与技术参数规格">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4">
                {specTiles.map((tile) => (
                  <div key={tile.label} className="min-w-0 rounded-xl border border-[#abadae]/15 bg-[#eff1f2]/70 p-2.5 lg:p-3.5">
                    <div className="text-[11px] text-[#757778] lg:text-xs dark:text-muted-foreground">{tile.label}</div>
                    <div
                      className={cn(
                        'mt-0.5 flex items-center gap-1.5 text-xs text-[#2c2f30] lg:text-sm dark:text-foreground',
                        tile.mono ? 'font-mono text-[11px] font-bold lg:text-xs' : 'font-semibold',
                      )}
                    >
                      <span
                        className={cn('truncate', tile.emphasize && 'font-bold text-primary', tile.verified && 'text-tone-green')}
                        title={tile.mono ? tile.value : undefined}
                      >
                        {tile.value}
                      </span>
                      {tile.badge ? (
                        <span className="shrink-0 rounded bg-tone-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-tone-green">{tile.badge}</span>
                      ) : null}
                      {tile.verified ? <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>

            <DetailSection
              title="最新更新 (What's New)"
              action={<span className="text-[11px] text-[#757778] lg:text-xs dark:text-muted-foreground">{latestUpdate.versionLabel}</span>}
            >
              <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3 lg:p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-primary lg:text-sm">
                  <Sparkles className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" aria-hidden="true" />
                  <span>{latestUpdate.headline}</span>
                </div>
                {latestUpdate.bullets.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-[#595c5d] lg:mt-3 lg:text-sm dark:text-muted-foreground">
                    {latestUpdate.bullets.map((bullet, index) => (
                      <li key={index}>
                        <LatestBullet text={bullet} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </DetailSection>

            <DetailSection title="游戏深度介绍 (About this Game)">
              {tags.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-1.5 lg:mb-4">
                  {tags.map((tag, index) => (
                    <Link
                      key={tag}
                      href={buildTagFilterHref(tag)}
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors [@media(hover:hover)]:hover:bg-muted/60 lg:px-3 lg:text-xs',
                        TAG_STYLE_PALETTES[index % TAG_STYLE_PALETTES.length],
                      )}
                    >
                      # {tag}
                    </Link>
                  ))}
                </div>
              ) : null}

              {hasLongDescription ? (
                <input id="game-description-toggle" type="checkbox" aria-label="展开或收起完整游戏介绍" className="peer sr-only" />
              ) : null}
              <div
                id="game-description-content"
                className={cn(
                  'relative text-xs leading-relaxed text-[#595c5d] lg:text-sm dark:text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0',
                  hasLongDescription && 'max-h-72 overflow-hidden transition-[max-height] duration-500 peer-checked:max-h-[9999px]',
                )}
                dangerouslySetInnerHTML={{ __html: fullDescriptionHtml }}
              />
              {hasLongDescription ? (
                <label
                  htmlFor="game-description-toggle"
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 border-t border-[#abadae]/15 pt-3 text-xs font-semibold text-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-checked:[&_.description-closed]:hidden peer-checked:[&_.description-open]:inline lg:mt-4 lg:w-fit lg:justify-start lg:rounded-lg lg:border-0 lg:bg-primary/[0.08] lg:px-3 lg:py-1.5 lg:pt-1.5 [@media(hover:hover)]:lg:hover:bg-primary/[0.12]"
                >
                  <span className="description-closed">展开完整介绍</span>
                  <span className="description-open hidden">收起介绍</span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </label>
              ) : null}

              {highlights.length > 0 ? (
                <div className="mt-4 border-t border-[#abadae]/15 pt-3 lg:mt-5 lg:pt-4">
                  <p className="mb-2 text-xs font-bold text-[#2c2f30] lg:text-sm dark:text-foreground">游戏特色</p>
                  <ul className="grid gap-1.5 text-xs leading-6 text-[#595c5d] sm:grid-cols-2 lg:text-sm dark:text-muted-foreground">
                    {highlights.map((highlight, index) => (
                      <li key={index} className="list-inside list-disc">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </DetailSection>

            <GameFaqSection
              id="game-detail-section-guides"
              title="攻略指南与常见问题"
              hint={GUIDE_SECTION_HINT}
              action={
                <Link
                  href={'/community/topics?q=' + encodeURIComponent(game.name)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors [@media(hover:hover)]:hover:underline"
                >
                  社区攻略讨论
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
              items={faqItems}
              intro={isWebGame ? undefined : <InstallationGuide installSteps={buildInstallSteps(game)} riskNotes={buildRiskNotes(game)} />}
            />

            <div id="game-detail-section-community">
              <Suspense fallback={<GameCommunitySkeleton />}>
                <GameCommunitySection game={{ _id: game._id, pkg: game.pkg, name: game.name }} />
              </Suspense>
            </div>

            <RelatedNewsSection items={relatedPosts} />
          </div>

          <aside data-stitch="side-column" className="space-y-3.5 lg:space-y-6">
            <ResourceLinksCard items={resourceLinks} />
            <CertificationCard />
            <BoxDownloadCard />
            <SimilarGamesCard items={similarGames} />
            <div id="game-detail-section-reviews">
              <Suspense fallback={<div className="min-h-[31rem] animate-pulse rounded-2xl bg-white/70 dark:bg-card/70" />}>
                <DeferredGameReviewPanel
                  game={{ _id: game._id, pkg: game.pkg, name: game.name, star: game.star }}
                  summary={gameData.reviewSummary}
                />
              </Suspense>
            </div>
          </aside>
        </div>
      </div>

    </div>
  );
}
