import Image from 'next/image';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { ArrowRight, BadgeCheck, CalendarClock, ChevronRight, CreditCard, Download, ExternalLink, MessageSquare, RefreshCw, Rocket, ShieldCheck, Sparkles } from 'lucide-react';

import GameAnnouncements from '@/components/game-announcements';
import GameFaqSection from '@/components/game-detail/GameFaqSection';
import InstallTroubleshootingDialog from '@/components/install-troubleshooting-dialog';
import { buildResourceChecksumItems } from '@/lib/game-resource-signature';
import { buildGameVariantRows, type GameVariantRow } from '@/lib/game-detail-variants';
import { buildGameTopicHref, topicSlugFromPkg } from '@/lib/community-entry';
import { normalizeGameFaqItems } from '@/lib/game-faq';
import { resolveGameName } from '@/lib/game-display-name';
import { isWebGameType } from '@/lib/game-resource-type';
import { resolveGameSourceInfo } from '@/lib/game-source-link';
import { resolveDisplayVersion } from '@/lib/game-version';
import { prependAliasToDescription, resolveChineseAlias } from '@/lib/seo';
import { getPreviewImageUrl } from '@/lib/image-preview';
import { cn } from '@/lib/utils';
import type { ApiRecommendedGame, CardConfigItem, GamePageSnapshot } from '@/types';
import DeferredGameReviewPanel from './DeferredGameReviewPanel.client';
import GameCommunitySection, { GameCommunitySkeleton } from './GameCommunitySection';
import DetailSection from './GameDetailSection';
import GameDetailActions from './GameDetailActions.client';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import GameDetailMobileTabs from './GameDetailMobileTabs.client';
import GameTopicEntryLink from './GameTopicEntryLink.client';
import GameHeroArtwork from './GameHeroArtwork.client';
import GameHeroVideo from './GameHeroVideo.client';
import GameScreenshotGallery from './GameScreenshotGallery.client';
import GameResourceChecksums from './GameResourceChecksums.client';
import DownloadErrorNotice from './DownloadErrorNotice.client';
import { BOX_DOWNLOAD_CARD, GUIDE_SECTION_HINT } from './game-detail-mock-copy';
import { applyLiveVersionHighlights } from './game-detail-highlights';
import { resolveHeroVideo } from './game-detail-video';
import {
  buildHeroMetrics,
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
  resolveSupportItems,
  toPlainTextWithBreaks,
  type RelatedNewsItem,
} from './game-detail-presenter';

interface GameDetailViewProps {
  gameData: GamePageSnapshot;
  recommendedGames: ApiRecommendedGame[];
  relatedNews: RelatedNewsItem[];
  /** 上游故障降级时展示的快照时间；正常渲染传 null。 */
  snapshotSavedAt?: string | null;
}

function formatSnapshotTime(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '最近一次成功抓取';
  const text = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${text}（北京时间）`;
}

// 降级提示：必须首屏可见、不能被折叠，用 role="status" 让读屏也能读到。
function DegradedDataNotice({ savedAt }: { savedAt: string }) {
  return (
    <div
      role="status"
      className="relative z-30 border-b border-tone-amber/40 bg-tone-amber/10 px-4 py-2.5"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-2 lg:items-center lg:px-16 2xl:px-20">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-tone-amber lg:mt-0" aria-hidden="true" />
        <p className="text-xs font-medium leading-relaxed text-tone-amber lg:text-sm">
          数据更新中：详情接口暂时不可用，当前展示 {formatSnapshotTime(savedAt)} 的缓存快照，恢复后会自动刷新。
        </p>
      </div>
    </div>
  );
}
/**
 * 预约中（status=0）游戏的预约说明块，只在首屏主信息卡内渲染。
 * 这是纯展示组件：订阅动作复用页面既有的「更新提醒」按钮，不新增提醒逻辑。
 * 预约入口暂未开放，本站不引导用户跳转 Google Play，只保留不可点击的站内状态标签。
 */
function PreregisterPanel() {
  return (
    <section
      aria-label="预约信息"
      className="mb-4 rounded-xl border border-tone-amber/30 bg-tone-amber/[0.07] p-4 lg:mb-5 lg:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-tone-amber/30 bg-tone-amber/10 text-tone-amber">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground lg:text-base">预约中 · 尚未上线</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground lg:text-sm">
            该游戏已在 Google Play 开放预注册，上线后本站会第一时间提供安装包。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* 站内状态标签：不可点击，不能恢复成外链或按钮；可访问名称取自可见文案。 */}
            <span className="inline-flex h-9 items-center rounded-xl border border-border/60 bg-muted/60 px-3.5 text-xs font-semibold text-muted-foreground lg:text-sm">
              预约入口暂未开放
            </span>
            <p className="text-xs text-muted-foreground">点「更新提醒」订阅上线通知</p>
          </div>
        </div>
      </div>
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
      <div className="rounded-xl border border-border/60 bg-muted/60 p-3 lg:p-4">
        <h3 className="text-xs font-bold text-foreground lg:text-sm">安装说明</h3>
        <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground lg:text-sm">
          {installSteps.map((item, index) => (
            <li key={item} className="flex gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-xl border border-border/60 bg-muted/60 p-3 lg:p-4">
        <h3 className="text-xs font-bold text-foreground lg:text-sm">下载与使用风险提示</h3>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground lg:text-sm">
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
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
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
            className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3 transition-colors [@media(hover:hover)]:hover:border-primary/40 [@media(hover:hover)]:hover:bg-primary/[0.04] lg:p-4"
          >
            <span className="line-clamp-2 text-xs font-semibold leading-snug text-foreground lg:text-sm">{item.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{item.date}</span>
          </Link>
        ))}
      </div>
    </DetailSection>
  );
}

function ResourceLinksCard({ items }: { items: ReturnType<typeof buildResourceLinks> }) {
  // 没有真实 cardConfig 条目时整块不渲染：过去会退回三条广告文案撑版式。
  if (items.length === 0) return null;
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
                <span className="block truncate text-xs font-bold text-foreground">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
            </>
          );
          const rowClass =
            'flex items-center justify-between gap-3 rounded-xl border border-border/60 p-2.5 transition-colors lg:p-3';
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
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </DetailSection>
  );
}

// 版本 / 渠道变体表：只渲染接口真实返回的渠道（行由 buildGameVariantRows 过滤），
// 版本 / 包大小缺失时留空单元格，不写「未知」。整块服务端渲染，行内链接可被抓取。
// 「资源滞后」标记只认接口下发的 version_relation：旧接口没有该字段时整列不加标记，
// 前端不自行比较版本——商店版本的可靠基线只在后端。
function GameVariantTable({ rows }: { rows: GameVariantRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[420px] text-left text-xs lg:text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/60 text-xs text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium lg:px-4">渠道</th>
            <th scope="col" className="px-3 py-2 font-medium lg:px-4">版本</th>
            <th scope="col" className="px-3 py-2 font-medium lg:px-4">包大小</th>
            <th scope="col" className="px-3 py-2 font-medium lg:px-4">下载</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border/40 last:border-b-0">
              <td className="px-3 py-2.5 font-semibold text-foreground lg:px-4">
                <Link
                  href={row.href}
                  className="transition-colors [@media(hover:hover)]:hover:text-primary"
                >
                  {row.channelName}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground lg:px-4">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span>{row.version || '—'}</span>
                  {row.versionRelation === 'stale' ? (
                    <span
                      className="shrink-0 rounded-full bg-tone-amber/10 px-2 py-0.5 text-xs font-medium text-tone-amber"
                      title="该渠道资源版本落后于商店版本，下载到的仍是旧包"
                    >
                      资源滞后
                    </span>
                  ) : null}
                </span>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground lg:px-4">{row.sizeLabel || '—'}</td>
              <td className="px-3 py-2.5 lg:px-4">
                <Link
                  href={row.href}
                  className="inline-flex items-center gap-1 font-semibold text-primary [@media(hover:hover)]:hover:underline"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  下载
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 侧栏资源校验信息：只展示接口真实存在的字段，缺项不渲染。
// 这里不再做「官方纯净认证」之类的结论性表述——仓库里没有对应的扫描或校验集成。
// 侧栏只保留「渠道覆盖」这一条：包名与当前版本在「版本与技术参数规格」里已有，重复展示是噪音。
function CertificationCard({
  checksumCount,
  resourceCount,
}: {
  checksumCount: number;
  resourceCount: number;
}) {
  const chips: { key: string; label: string; value: string }[] = [];
  if (checksumCount > 0 && resourceCount > 0) {
    chips.push({ key: 'checksum', label: 'SHA-256', value: `${checksumCount}/${resourceCount}` });
  }

  return (
    <section className="rounded-xl border border-tone-green/25 bg-card p-4 lg:p-5">
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tone-green text-white">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm font-bold text-foreground">资源校验信息</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            SHA-256 校验值来自资源记录，可与下载文件比对；未提供校验值的渠道不显示该标记。
          </p>
        </div>
      </div>
      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-tone-green/20 pt-3">
          {chips.map((chip) => (
            <span
              key={chip.key}
              title={chip.value}
              className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-lg bg-tone-green/10 px-2 py-1 text-xs font-medium text-tone-green"
            >
              <span className="shrink-0">{chip.label}</span>
              <span className="truncate font-semibold">{chip.value}</span>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BoxDownloadCard() {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-4 lg:p-6">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm font-bold text-foreground">
        <span>{BOX_DOWNLOAD_CARD.title}</span>
        <span className="text-xs font-normal text-muted-foreground">{BOX_DOWNLOAD_CARD.status}</span>
      </div>
      <Link
        href="/download/app"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors [@media(hover:hover)]:hover:bg-primary/90"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
        立即下载 AC 盒子 App
      </Link>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {/* 三选一分流入口就挂在原来那句「无法安装？」的位置（待决策 #132）。 */}
        <InstallTroubleshootingDialog />
        <span className="ml-1">{BOX_DOWNLOAD_CARD.helper}</span>
      </p>
    </section>
  );
}

function SimilarGamesCard({ items }: { items: ReturnType<typeof buildSimilarGames> }) {
  if (items.length === 0) return null;
  return (
    <DetailSection
      title="相似推荐"
      action={
        <Link href="/app" className="text-xs text-muted-foreground transition-colors [@media(hover:hover)]:hover:text-primary">
          查看更多
        </Link>
      }
    >
      <div className="space-y-3 lg:space-y-4">
        {items.map((item) => (
          <Link key={item.key} href={item.href} className="group flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-3">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
                {item.icon ? (
                  <Image src={getPreviewImageUrl(item.icon, 112)} alt={item.name + ' 图标'} fill sizes="48px" className="object-cover" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-foreground">{item.name}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.meta}</span>
              </span>
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors [@media(hover:hover)]:group-hover:bg-primary [@media(hover:hover)]:group-hover:text-white">
              <Download className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </DetailSection>
  );
}

export default function GameDetailView({ gameData, recommendedGames, relatedNews, snapshotSavedAt }: GameDetailViewProps) {
  const game = gameData.app;
  const displayName = resolveGameName(game);
  // 固定游戏话题：社区入口直达话题页，不再落到 /community/topics?q= 搜索页（提案 2026-11-08 B 档）。
  // 包名生成不出 slug 时回落到搜索页，保证链接始终可用。
  const communityTopicSlug = topicSlugFromPkg(game.pkg);
  const communitySearchHref = '/community/topics?q=' + encodeURIComponent(displayName);
  const guideCommunityHref =
    buildGameTopicHref(game.pkg, { from: 'detail_guide' }) || communitySearchHref;
  const storedAliases = (
    game.seo as (typeof game.seo & { aliases?: string[] | null }) | undefined
  )?.aliases;
  // 两代别名来源：seo.aliases（后台写入）与 metadata.chs|cht（采集到的多语言名）。
  // 线上很多游戏前者为空、中文名只躺在后者里，副标题要一起兜底才看得见。
  const chineseAlias = resolveChineseAlias(
    [
      ...(Array.isArray(storedAliases) ? storedAliases : []),
      game.metadata?.chs,
      game.metadata?.cht,
    ],
    displayName,
  );
  const resources = Array.isArray(gameData.resources) ? gameData.resources : [];
  const isWebGame = isWebGameType(game.type);
  // 资源校验值只取接口真实返回的 signature；没有就整块显示「暂无校验值」。
  const checksumItems = buildResourceChecksumItems(resources);
  // 首屏不再渲染信任条（2026-11-17 去重）：版本 / 包大小 / 更新时间 / 来源 / SHA-256
  // 五项在「版本与技术参数规格」「资源校验值」里都已展示，首屏重复一遍只增加噪音。
  // 渠道变体表：无有效渠道数据时整块不渲染。
  const variantRows = buildGameVariantRows(resources, game.pkg || game._id);
  // 商店版本：VARY 占位符与空值按缺失处理，避免副标题出现「商店版本 VARY」。
  const shopVersion = resolveDisplayVersion(game.version);
  const tags = getGameTags(game);
  const primaryCategory = getPrimaryCategory(game, tags);
  const cardConfig = (gameData.cardConfig || {}) as Record<string, CardConfigItem[] | undefined>;
  const supportItems = resolveSupportItems(cardConfig);
  const downloadNotices = Array.isArray(cardConfig.download_notice) ? cardConfig.download_notice : [];
  const faqItems = normalizeGameFaqItems(gameData.faq);
  const screenshots = (Array.isArray(game.detail_images) ? game.detail_images : []).filter(Boolean);
  const displayScreenshots = screenshots.length > 0 ? screenshots : [game.header_image, game.icon].filter(Boolean);
  const heroImage = game.header_image || displayScreenshots[0] || game.icon || '';
  // 没有可播放的源就不渲染 PV 入口，避免出现点开必失败的按钮。
  const heroVideo = resolveHeroVideo(game);
  const facts = buildGameFactItems(game, { category: primaryCategory, resourceCount: resources.length, isWebGame });
  // highlights 里可能存着写死的「当前版本 vX」；渲染时用实时版本覆盖，避免页面挂旧版本号。
  const highlights = applyLiveVersionHighlights(game.seo?.highlights, game.version).slice(0, 8);
  const latestContent = cleanText(game.latest_content);
  const fullDescriptionHtml = formatDescriptionHtml(game.description || game.summary) || '暂无介绍';
  const hasLongDescription = toPlainTextWithBreaks(game.description || game.summary).length > 260;
  const recommendationList = recommendedGames
    .filter((item, index, list) => {
      const pkg = String(item.pkg || '').trim().toLowerCase();
      if (!pkg || pkg === String(game.pkg || '').trim().toLowerCase() || item._id === game._id) return false;
      return list.findIndex((candidate) => String(candidate.pkg || '').trim().toLowerCase() === pkg) === index;
    })
    .slice(0, 10);
  const detailAnnouncements = gameData.Announcements ?? gameData.announcements;
  const hasDetailAnnouncements = Array.isArray(detailAnnouncements)
    ? detailAnnouncements.length > 0
    : Boolean(detailAnnouncements && Object.values(detailAnnouncements).some((group) => Array.isArray(group) && group.length > 0));
  // 预约中与已上架游戏都允许订阅更新提醒（接口 T181-3 已放开 status=1）；
  // 页游没有可安装的包，不展示。关注接口需要 _id，缺失时不渲染，避免点了必失败。
  const showUpdateReminder = !isWebGame && Boolean(game._id);
  // GitHub Release 分发的开源版单独标注来源与仓库；其它渠道不渲染这一行。
  const gameSource = resolveGameSourceInfo(game);

  // 视觉稿视图模型：只由接口真实数据生成，缺失项整项不渲染。
  const trustBadges = buildTrustBadges(tags);
  const heroMetrics = buildHeroMetrics({ game, primaryCategory, isWebGame, reviewSummary: gameData.reviewSummary });
  const specTiles = buildSpecTiles(facts);
  const latestUpdate = buildLatestUpdate(game, latestContent);
  // #219：没有真实 latest_content 时 buildLatestUpdate 返回空 headline + 空 bullets，区块整块不渲染——
  // 只留一行版本号/日期是空壳，且这两项在「版本与技术参数规格」里已经展示过。
  const hasLatestUpdateContent = Boolean(latestUpdate.headline || latestUpdate.bullets.length > 0);
  const resourceLinks = buildResourceLinks(supportItems);
  const similarGames = buildSimilarGames(recommendationList);
  const relatedPosts = buildRelatedPosts(relatedNews);
  const ratingCount = Math.max(0, Number(gameData.reviewSummary?.ratingCount || 0));
  const reviewCountLabel = ratingCount > 0 ? formatCompactCount(ratingCount) : undefined;
  const heroDescription = prependAliasToDescription(
    cleanText(game.description || game.summary),
    chineseAlias,
    displayName,
  );
  const actionGame = {
    _id: game._id,
    pkg: game.pkg,
    name: resolveGameName(game),
    version: game.version,
    type: game.type,
    file_size: game.file_size,
    source_type: game.source_type,
    metadata: game.metadata,
  };
  // 移动端三宫格展示评分 / 下载热度 / 平台，与稿件一致；分类格只在 PC 展示。
  // 按 key 取格而不是固定下标：过滤后数组长度可变，下标会取到相邻的格。
  // 第一格在移动端不画左侧分隔线（它左边没有可见格）。
  const firstMobileMetricKey = heroMetrics.find((metric) => metric.key !== 'category')?.key;
  // 桌面与移动端共用同一份面包屑；JSON-LD 只由桌面那份输出一次。
  const breadcrumbItems = [
    { name: '首页', href: '/' },
    { name: '游戏库', href: '/app' },
    { name: primaryCategory, href: buildTagFilterHref(primaryCategory) },
    { name: resolveGameName(game), href: `/app/${encodeURIComponent(game.pkg || game._id || '')}` },
  ];

  return (
    <div className="game-detail-stitch relative min-h-screen overflow-x-clip bg-muted text-foreground dark:bg-background">
      {snapshotSavedAt ? <DegradedDataNotice savedAt={snapshotSavedAt} /> : null}

      {/* 下载失败回跳（?download_error=1）的提示：客户端读参数，不改变详情页的 ISR 行为。 */}
      <Suspense fallback={null}>
        <DownloadErrorNotice
          gameName={resolveGameName(game)}
          pageUrl={`/app/${encodeURIComponent(game.pkg || game._id || '')}`}
        />
      </Suspense>

      {hasDetailAnnouncements ? (
        <div className="relative z-20 px-4 pt-20 sm:px-6 lg:px-16 lg:pt-6 2xl:px-20">
          <div className="mx-auto max-w-7xl">
            <GameAnnouncements announcements={detailAnnouncements as any} position="game_detail" />
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto hidden max-w-7xl px-4 sm:px-6 lg:block lg:px-16 lg:pb-5 lg:pt-6 2xl:px-20">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

            {/* Hero：单一响应式 DOM。移动端全宽沉浸封面 + 悬浮信息卡；PC 端限制画幅并在信息卡右侧叠放操作区。 */}
      <section data-stitch="hero" className="relative">
        <div className="lg:mx-auto lg:max-w-7xl lg:px-16 2xl:px-20">
          <div
            data-stitch="banner"
            className="relative h-72 w-full overflow-hidden bg-muted sm:h-80 lg:h-96 lg:rounded-2xl lg:border lg:border-border/60"
          >
            <GameHeroArtwork gameName={resolveGameName(game)} heroImage={heroImage} icon={game.icon} />
            {heroVideo ? (
              <GameHeroVideo
                gameName={resolveGameName(game)}
                source={heroVideo.source}
                poster={heroVideo.poster}
                className="absolute bottom-16 right-4 z-10 lg:bottom-4"
              />
            ) : null}
          </div>

          {/* 信息卡：移动端上浮压住封面 48px，PC 端退回常规栅格并与封面留出间距 */}
          <div data-stitch="info-card" className="relative -mt-12 px-4 lg:mt-6 lg:px-0">
            <div className="rounded-2xl border border-border/60 bg-card p-4 lg:p-8">
              {/* 移动端面包屑：放在信息卡内首行；桌面那份已输出 JSON-LD，这里只画可见导航。 */}
              <div className="mb-2 lg:hidden">
                <Breadcrumbs items={breadcrumbItems} withJsonLd={false} />
              </div>
              {/* 预约态信息放在主信息卡最上方，保证首屏可见；已上架（status=1）不渲染。 */}
              {game.status === 0 ? <PreregisterPanel /> : null}
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center lg:gap-8">
                <div className="flex items-center gap-3.5 lg:gap-6">
                  <div className="relative shrink-0">
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border/60 bg-muted lg:h-24 lg:w-24 lg:rounded-2xl">
                      {game.icon ? (
                        // 信息卡图标移动端 -mt-12 紧贴封面、桌面端也在首屏，是第 2 个 LCP 候选，放行 eager。
                        <Image
                          src={getPreviewImageUrl(game.icon, 320)}
                          alt={resolveGameName(game) + ' 图标'}
                          fill
                          priority
                          fetchPriority="high"
                          sizes="(min-width: 1024px) 96px, 64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    {checksumItems.length > 0 ? (
                      <span
                        className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-tone-green text-white"
                        title="已提供 SHA-256 校验值"
                      >
                        <BadgeCheck className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-1.5 lg:space-y-2">
                    {trustBadges.length > 0 ? <HeroBadges badges={trustBadges} /> : null}
                    <h1 className="text-xl font-bold leading-snug tracking-tight text-foreground lg:text-2xl">{resolveGameName(game)}</h1>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-foreground">
                        {game.developer || '开发者未提供'}
                        <BadgeCheck className="h-3.5 w-3.5 text-tone-blue" aria-hidden="true" />
                      </span>
                    </div>
                    {gameSource ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center rounded-md bg-tone-blue/10 px-2 py-0.5 font-medium text-tone-blue">
                          {gameSource.label}
                        </span>
                        {gameSource.repoUrl ? (
                          <a
                            className="inline-flex items-center gap-0.5 underline decoration-dotted underline-offset-2"
                            href={gameSource.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            GitHub 仓库
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ) : null}
                        <span>遵循 {gameSource.license} 许可</span>
                      </div>
                    ) : null}
                    {heroDescription ? (
                      // line-clamp-2 与 lg:block 作用在同一元素上时，变体生成的 display:block 会覆盖 -webkit-box 导致截断失效，
                      // 因此外层只负责响应式显隐，内层单独负责行数截断。
                      <div className="hidden lg:block">
                        <p className="line-clamp-2 max-w-2xl text-xs leading-relaxed text-muted-foreground lg:text-sm">
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
                  showUpdateReminder={showUpdateReminder}
                />
              </div>

              {/* 指标条：每格都由真实字段支撑，缺失的格不渲染；「游戏分类」只在 PC 展示。
                  用 flex 而非固定列栅格——格数随数据在 2~4 之间变化，固定列会留下空槽。 */}
              {heroMetrics.length > 0 ? (
                <div className="mt-4 flex items-stretch border-t border-border/40 pt-3.5 lg:mt-8 lg:gap-4 lg:pt-5">
                  {heroMetrics.map((metric, index) => (
                    <div
                      key={metric.key}
                      className={cn(
                        'flex min-w-0 flex-1 flex-col items-center justify-center px-1 lg:px-3',
                        // 分隔线只在「左边还有可见格」时画：移动端跳过隐藏的分类格与它后面的首格。
                        index > 0 &&
                          (metric.key === firstMobileMetricKey ? 'lg:border-l lg:border-border/40' : 'border-l border-border/40'),
                        metric.key === 'category' && 'hidden lg:flex',
                      )}
                    >
                      {/* 移动端没有空间放标签，只有当 hint 也缺失时才把标签顶上来，避免只显示一个孤零零的值。 */}
                      <span
                        className={cn(
                          'text-xs font-medium tracking-wider text-muted-foreground',
                          metric.hint ? 'hidden lg:block' : 'block',
                        )}
                      >
                        {metric.label}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-bold text-foreground lg:mt-0.5 lg:font-semibold',
                          metric.key === 'rating' && 'text-tone-amber lg:text-foreground',
                        )}
                      >
                        {metric.value}
                      </span>
                      {metric.hint ? <span className="mt-0.5 text-xs text-muted-foreground">{metric.hint}</span> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <GameDetailMobileTabs
        reviewCountLabel={reviewCountLabel}
        communityHref={buildGameTopicHref(game.pkg, { from: 'detail_tab' }) || undefined}
        pkg={game.pkg || undefined}
        topicSlug={communityTopicSlug || undefined}
      />

      {/* 主体：左列内容 8 / 右列侧栏 4（lg 及以上），移动端单列堆叠 */}
      <div data-stitch="main" className={cn('relative z-10 mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-16 lg:pb-16 2xl:px-20', hasDetailAnnouncements ? 'pt-5 lg:pt-8' : 'pt-3 lg:pt-8')}>
        <div data-stitch="main-grid" className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] lg:items-start lg:gap-8">
          <div data-stitch="main-column" className="space-y-3.5 lg:space-y-8">
            <DetailSection
              id="game-detail-section-overview"
              title="游戏精选截图与实机展示"
              subtitle="点击截图可放大查看高清原始画质"
            >
              <GameScreenshotGallery
                gameName={resolveGameName(game)}
                screenshots={displayScreenshots}
                icon={game.icon}
              />
            </DetailSection>

            <DetailSection id="game-detail-specs" title="版本与技术参数规格">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4">
                {specTiles.map((tile) => (
                  <div key={tile.label} className="min-w-0 rounded-xl border border-border/60 bg-muted/70 p-2.5 lg:p-3.5">
                    <div className="text-xs text-muted-foreground">{tile.label}</div>
                    <div
                      className={cn(
                        'mt-0.5 flex items-center gap-1.5 text-xs text-foreground lg:text-sm',
                        tile.mono ? 'font-mono text-xs font-bold lg:text-xs' : 'font-semibold',
                      )}
                    >
                      <span
                        className={cn('truncate', tile.emphasize && 'font-bold text-primary', tile.verified && 'text-tone-green')}
                        title={tile.mono ? tile.value : undefined}
                      >
                        {tile.value}
                      </span>
                      {tile.badge ? (
                        <span className="shrink-0 rounded bg-tone-green/10 px-1.5 py-0.5 text-xs font-semibold text-tone-green">{tile.badge}</span>
                      ) : null}
                      {tile.verified ? <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>

            {variantRows.length > 0 ? (
              <DetailSection
                id="game-detail-variants"
                title="版本与渠道变体"
                subtitle={
                  shopVersion
                    ? `同一游戏在各渠道的真实版本与包大小（商店版本 ${shopVersion}）`
                    : '同一游戏在各渠道的真实版本与包大小'
                }
              >
                <GameVariantTable rows={variantRows} />
              </DetailSection>
            ) : null}

            <DetailSection
              id="game-detail-checksums"
              title="资源校验值（SHA-256）"
              subtitle="核对下载文件是否与资源提供方一致"
            >
              <GameResourceChecksums items={checksumItems} />
            </DetailSection>

            {hasLatestUpdateContent ? (
              <DetailSection
                title="最新更新 (What's New)"
                action={
                  <div className="flex items-center gap-3">
                    {latestUpdate.versionLabel ? (
                      <span className="text-xs text-muted-foreground">{latestUpdate.versionLabel}</span>
                    ) : null}
                    <Link
                      href="/updates"
                      prefetch={false}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline lg:text-xs"
                    >
                      查看近 7 天更新榜
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                }
              >
                <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3 lg:p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary lg:text-sm">
                    <Sparkles className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" aria-hidden="true" />
                    <span>{latestUpdate.headline}</span>
                  </div>
                  {latestUpdate.bullets.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground lg:mt-3 lg:text-sm">
                      {latestUpdate.bullets.map((bullet, index) => (
                        <li key={index}>
                          <LatestBullet text={bullet} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </DetailSection>
            ) : null}

            <DetailSection title="游戏深度介绍 (About this Game)">
              {tags.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-1.5 lg:mb-4">
                  {tags.map((tag, index) => (
                    <Link
                      key={tag}
                      href={buildTagFilterHref(tag)}
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors [@media(hover:hover)]:hover:bg-muted/60 lg:px-3 lg:text-xs',
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
                  'relative text-xs leading-relaxed text-muted-foreground lg:text-sm [&_p]:mb-3 [&_p:last-child]:mb-0',
                  hasLongDescription && 'max-h-72 overflow-hidden transition-[max-height] duration-500 peer-checked:max-h-[9999px]',
                )}
                dangerouslySetInnerHTML={{ __html: fullDescriptionHtml }}
              />
              {hasLongDescription ? (
                <label
                  htmlFor="game-description-toggle"
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 border-t border-border/40 pt-3 text-xs font-semibold text-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-checked:[&_.description-closed]:hidden peer-checked:[&_.description-open]:inline lg:mt-4 lg:w-fit lg:justify-start lg:rounded-lg lg:border-0 lg:bg-primary/[0.08] lg:px-3 lg:py-1.5 lg:pt-1.5 [@media(hover:hover)]:lg:hover:bg-primary/[0.12]"
                >
                  <span className="description-closed">展开完整介绍</span>
                  <span className="description-open hidden">收起介绍</span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </label>
              ) : null}

              {highlights.length > 0 ? (
                <div className="mt-4 border-t border-border/40 pt-3 lg:mt-5 lg:pt-4">
                  <p className="mb-2 text-xs font-bold text-foreground lg:text-sm">游戏特色</p>
                  <ul className="grid gap-1.5 text-xs leading-6 text-muted-foreground sm:grid-cols-2 lg:text-sm">
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
                <GameTopicEntryLink
                  href={guideCommunityHref}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors [@media(hover:hover)]:hover:underline"
                  tracking={
                    communityTopicSlug
                      ? {
                          entryAction: 'detail_topic_cta',
                          from: 'detail_guide',
                          pkg: game.pkg,
                          topicSlug: communityTopicSlug,
                        }
                      : null
                  }
                >
                  社区攻略讨论
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </GameTopicEntryLink>
              }
              items={faqItems}
              intro={isWebGame ? undefined : <InstallationGuide installSteps={buildInstallSteps(game)} riskNotes={buildRiskNotes(game)} />}
            />

            <div id="game-detail-section-community">
              <Suspense fallback={<GameCommunitySkeleton />}>
                <GameCommunitySection game={{ _id: game._id, pkg: game.pkg, name: resolveGameName(game) }} />
              </Suspense>
            </div>

            <RelatedNewsSection items={relatedPosts} />
          </div>

          <aside data-stitch="side-column" className="space-y-3.5 lg:space-y-6">
            <ResourceLinksCard items={resourceLinks} />
            <CertificationCard
              checksumCount={checksumItems.length}
              resourceCount={resources.length}
            />
            <BoxDownloadCard />
            <SimilarGamesCard items={similarGames} />
            <div id="game-detail-section-reviews">
              <Suspense fallback={<div className="min-h-[31rem] animate-pulse rounded-xl bg-card/70" />}>
                <DeferredGameReviewPanel
                  game={{ _id: game._id, pkg: game.pkg, name: resolveGameName(game), star: game.star }}
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
