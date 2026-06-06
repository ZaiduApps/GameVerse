import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock3, Download, Flame, Layers3, Sparkles, Star, Wrench } from 'lucide-react';

import {
  getAlbumDescription,
  getAlbumKeywords,
  getAlbumShareImage,
  getAlbumStyleLabel,
  normalizeAlbumGames,
} from '@/lib/albums';
import type { ApiAlbum, ApiGame } from '@/types';

const FALLBACK_IMAGE = '/favicon.ico';

type AlbumTopicViewProps = {
  album: ApiAlbum;
  siteName: string;
  siteShareImage?: string | null;
};

function normalizeText(value?: string | null): string {
  return String(value || '').trim();
}

function clampText(value: string, maxLength: number): string {
  const chars = Array.from(normalizeText(value));
  if (chars.length <= maxLength) return chars.join('');
  return `${chars.slice(0, maxLength).join('')}...`;
}

function getGameHref(game: ApiGame): string {
  const target = normalizeText(game?.pkg || game?._id);
  return target ? `/app/${encodeURIComponent(target)}` : '/app';
}

function formatDeviceLabel(value?: string | null): string {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  if (/android/i.test(normalized)) return 'Android';
  if (/ios|iphone|ipad/i.test(normalized)) return 'iOS';
  if (/pc|windows|win/i.test(normalized)) return 'PC';
  return normalized;
}

function formatRelativeTime(value?: string | null): string {
  const normalized = normalizeText(value);
  if (!normalized) return '近期收录';

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '近期收录';

  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} 分钟前`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} 小时前`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} 天前`;
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function formatScore(value?: number | null): string {
  const score = Number(value || 0);
  return Number.isFinite(score) && score > 0 ? score.toFixed(1) : '暂无评分';
}

function getStylePalette(style?: string | null) {
  const normalized = normalizeText(style).toLowerCase();

  if (normalized === 'box') {
    return {
      chip: 'border-[#ffd8b6]/30 bg-white/12 text-white/90',
      featurePanel: 'bg-white/12',
      primaryButton: 'bg-white text-[#7a2e00] hover:bg-[#fff4e8]',
      secondaryButton: 'border-white/20 bg-white/10 text-white hover:bg-white/16',
      headingAccent: 'text-[#ffb46b]',
      statValue: 'text-[#ffe5c6]',
    };
  }

  if (normalized === 'pre') {
    return {
      chip: 'border-[#ffd5dc]/30 bg-white/12 text-white/90',
      featurePanel: 'bg-white/12',
      primaryButton: 'bg-white text-[#7f1032] hover:bg-[#fff1f4]',
      secondaryButton: 'border-white/20 bg-white/10 text-white hover:bg-white/16',
      headingAccent: 'text-[#ffb7cb]',
      statValue: 'text-[#ffe3ea]',
    };
  }

  if (normalized === 'list') {
    return {
      chip: 'border-[#cde3ff]/30 bg-white/12 text-white/90',
      featurePanel: 'bg-white/12',
      primaryButton: 'bg-white text-[#014574] hover:bg-[#eef6ff]',
      secondaryButton: 'border-white/20 bg-white/10 text-white hover:bg-white/16',
      headingAccent: 'text-[#9ad0ff]',
      statValue: 'text-[#d9eeff]',
    };
  }

  return {
    chip: 'border-white/20 bg-white/12 text-white/90',
    featurePanel: 'bg-white/12',
    primaryButton: 'bg-white text-[#0b2743] hover:bg-[#eef7ff]',
    secondaryButton: 'border-white/20 bg-white/10 text-white hover:bg-white/16',
    headingAccent: 'text-[#b8e6ff]',
    statValue: 'text-[#e5f6ff]',
  };
}

function getStyleClassNames(style?: string | null) {
  const normalized = normalizeText(style).toLowerCase();

  if (normalized === 'box') {
    return {
      heroGradient: 'from-[#2d1200] via-[#8b3000] to-[#d96a1b]',
      sectionBadge: 'border-[#ffd5b3] bg-[#fff3e9] text-[#8b3000]',
      sectionHint: '适合优先查看站内热门作品、榜单型内容和高热度游戏。',
      sectionTitle: '专题榜单',
      cardRing: 'hover:border-[#ffb36b] hover:shadow-[0_18px_38px_rgba(167,85,14,0.18)]',
    };
  }

  if (normalized === 'pre') {
    return {
      heroGradient: 'from-[#3c1026] via-[#8f1d4b] to-[#ff7358]',
      sectionBadge: 'border-[#ffd0db] bg-[#fff1f5] text-[#9a214f]',
      sectionHint: '适合跟踪预约新游、上线前动态和近期值得蹲守的新项目。',
      sectionTitle: '预约观察清单',
      cardRing: 'hover:border-[#ff94ae] hover:shadow-[0_18px_38px_rgba(185,28,88,0.16)]',
    };
  }

  if (normalized === 'list') {
    return {
      heroGradient: 'from-[#07243d] via-[#005f9f] to-[#37a6cf]',
      sectionBadge: 'border-[#cfe8ff] bg-[#edf7ff] text-[#005f9f]',
      sectionHint: '适合快速筛选效率工具、常用应用和轻量辅助型内容。',
      sectionTitle: '工具合集',
      cardRing: 'hover:border-[#70c9ff] hover:shadow-[0_18px_38px_rgba(0,94,159,0.18)]',
    };
  }

  return {
    heroGradient: 'from-[#071522] via-[#005e9f] to-[#2d8fd3]',
    sectionBadge: 'border-[#d5eaff] bg-[#eff7ff] text-[#005e9f]',
    sectionHint: '适合快速发现近期值得下载的精选游戏与编辑推荐内容。',
    sectionTitle: '专题精选内容',
    cardRing: 'hover:border-[#7fc1ff] hover:shadow-[0_18px_38px_rgba(0,94,159,0.18)]',
  };
}

function buildAlbumAudienceText(style: string, keywords: string[]): string {
  const normalized = normalizeText(style).toLowerCase();
  if (normalized === 'box') return '适合想先看站内热度排序、热门口碑和主流玩家关注作品的用户。';
  if (normalized === 'pre') return '适合关注预约节奏、跨区新游上线窗口和早期尝鲜机会的用户。';
  if (normalized === 'list') return '适合寻找效率工具、AI 应用、轻办公和辅助型软件的用户。';
  if (keywords.length > 0) return `适合优先关注 ${keywords.slice(0, 3).join('、')} 等方向内容的用户。`;
  return '适合希望在一个页面里快速筛出值得下载作品的用户。';
}

function buildAlbumMaintenanceText(mode?: string | null): string {
  const normalized = normalizeText(mode).toLowerCase();
  if (normalized === 'auto') return '该专题会根据后台规则自动更新，适合持续追踪近阶段活跃内容。';
  return '该专题由运营手工维护，排序更偏向精选判断与专题推荐逻辑。';
}

function collectRegions(games: ApiGame[]): string[] {
  return Array.from(
    new Set(
      games
        .map((game) => normalizeText(game?.metadata?.region))
        .filter(Boolean),
    ),
  );
}

function collectDevices(games: ApiGame[]): string[] {
  return Array.from(
    new Set(
      games
        .flatMap((game) => (Array.isArray(game?.metadata?.deviceList) ? game.metadata.deviceList : []))
        .map((item) => formatDeviceLabel(item))
        .filter(Boolean),
    ),
  );
}

function collectPrimaryTags(games: ApiGame[]): string[] {
  return Array.from(
    new Set(
      games
        .flatMap((game) => (Array.isArray(game?.tags) ? game.tags.slice(0, 3) : []))
        .map((tag) => normalizeText(tag))
        .filter(Boolean),
    ),
  );
}

function buildGameMetaLine(game: ApiGame): string {
  const parts = [
    normalizeText(game?.metadata?.region),
    normalizeText(game?.download_count_show) ? `${normalizeText(game.download_count_show)} 下载` : '',
    normalizeText(game?.version) ? `v${normalizeText(game.version)}` : '',
  ].filter(Boolean);

  return parts.join(' · ') || '详情页内查看完整信息';
}

function buildGameVisual(game: ApiGame, siteShareImage?: string | null): string {
  return getAlbumShareImage(
    {
      _id: '',
      title: '',
      subtitle: '',
      games: [game],
      style: 'Grid',
    },
    siteShareImage,
  );
}

function FeatureGameCard({
  game,
  siteShareImage,
}: {
  game: ApiGame;
  siteShareImage?: string | null;
}) {
  const imageUrl = buildGameVisual(game, siteShareImage);
  const summary = clampText(normalizeText(game.summary) || normalizeText(game.tags?.[0]) || '专题精选内容', 68);

  return (
    <Link
      href={getGameHref(game)}
      data-acbox-action="album_feature_game_click"
      data-acbox-label={normalizeText(game.name) || '专题首屏推荐'}
      className="group overflow-hidden rounded-[28px] border border-white/12 bg-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur"
    >
      <div className="relative h-56 overflow-hidden">
        <Image
          src={imageUrl || FALLBACK_IMAGE}
          alt={normalizeText(game.name) || '专题精选'}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 1279px) 100vw, 360px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
      </div>
      <div className="space-y-3 p-5 text-white">
        <div className="flex items-center gap-2 text-xs font-bold text-white/75">
          <Sparkles className="h-3.5 w-3.5" />
          首屏推荐
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-black leading-tight">{normalizeText(game.name) || '专题内容'}</p>
            <p className="mt-2 text-sm leading-6 text-white/82">{summary}</p>
          </div>
          <span className="rounded-full bg-white/14 px-2.5 py-1 text-xs font-bold text-white/88">
            {formatScore(game.star)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-white/72">
          <span>{buildGameMetaLine(game)}</span>
          <span className="inline-flex items-center gap-1 font-bold text-white">
            查看详情
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SupportingGameCard({
  game,
  siteShareImage,
}: {
  game: ApiGame;
  siteShareImage?: string | null;
}) {
  const imageUrl = buildGameVisual(game, siteShareImage);

  return (
    <Link
      href={getGameHref(game)}
      data-acbox-action="album_supporting_game_click"
      data-acbox-label={normalizeText(game.name) || '专题辅助推荐'}
      className="group flex items-center gap-3 rounded-[22px] border border-white/12 bg-white/10 p-3.5 text-white transition-transform hover:-translate-y-0.5"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-white/8">
        <Image
          src={imageUrl || FALLBACK_IMAGE}
          alt={normalizeText(game.name) || '专题推荐'}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{normalizeText(game.name) || '未命名内容'}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/72">
          {clampText(normalizeText(game.summary) || normalizeText(game.tags?.[0]) || '专题推荐游戏', 44)}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-white/72 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ShowcaseCard({
  game,
  siteShareImage,
  cardRing,
}: {
  game: ApiGame;
  siteShareImage?: string | null;
  cardRing: string;
}) {
  const imageUrl = buildGameVisual(game, siteShareImage);
  const tags = (Array.isArray(game?.tags) ? game.tags : [])
    .map((tag) => normalizeText(tag))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Link
      href={getGameHref(game)}
      data-acbox-action="album_showcase_game_click"
      data-acbox-label={normalizeText(game.name) || '专题精选游戏'}
      className={`group overflow-hidden rounded-[26px] border border-[#d9e4ef] bg-white shadow-[0_12px_32px_rgba(12,15,16,0.08)] transition-all hover:-translate-y-1 ${cardRing}`}
    >
      <div className="relative h-48 overflow-hidden bg-[#e9eef4]">
        <Image
          src={imageUrl || FALLBACK_IMAGE}
          alt={normalizeText(game.name) || '专题推荐'}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          <Star className="h-3.5 w-3.5 fill-[#fdc003] text-[#fdc003]" />
          {formatScore(game.star)}
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#15202b]">{normalizeText(game.name) || '未命名游戏'}</h3>
            <p className="mt-1 text-sm font-semibold text-[#4a6074]">{buildGameMetaLine(game)}</p>
          </div>
          <span className="rounded-full bg-[#edf7ff] px-2.5 py-1 text-xs font-bold text-[#005e9f]">
            {formatRelativeTime(game.latest_at)}
          </span>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-[#425466]">
          {clampText(normalizeText(game.summary) || normalizeText(game.tags?.[0]) || '专题精选内容', 80)}
        </p>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={`${game._id}-${tag}`} className="rounded-full bg-[#f3f7fa] px-2.5 py-1 text-xs font-bold text-[#587089]">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function RankingRow({
  game,
  index,
  siteShareImage,
  cardRing,
}: {
  game: ApiGame;
  index: number;
  siteShareImage?: string | null;
  cardRing: string;
}) {
  const imageUrl = buildGameVisual(game, siteShareImage);
  const showFlame = index < 3;

  return (
    <Link
      href={getGameHref(game)}
      data-acbox-action="album_ranking_game_click"
      data-acbox-label={`${index + 1}. ${normalizeText(game.name) || '专题榜单游戏'}`}
      className={`group flex items-center gap-4 rounded-[24px] border border-[#d9e4ef] bg-white p-4 shadow-[0_12px_32px_rgba(12,15,16,0.08)] transition-all hover:-translate-y-1 ${cardRing}`}
    >
      <div className="flex w-10 flex-shrink-0 items-center justify-center text-xl font-black italic text-[#b71211]">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-[#e9eef4]">
        <Image
          src={imageUrl || FALLBACK_IMAGE}
          alt={normalizeText(game.name) || '榜单游戏'}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-black text-[#15202b]">{normalizeText(game.name) || '未命名游戏'}</h3>
          {showFlame ? <Flame className="h-4 w-4 text-[#ff7a00]" /> : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#4a6074]">
          {clampText(normalizeText(game.summary) || normalizeText(game.tags?.[0]) || '专题热门内容', 70)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5c7288]">
          <span className="rounded-full bg-[#f3f7fa] px-2.5 py-1">{buildGameMetaLine(game)}</span>
          <span className="rounded-full bg-[#fff3e9] px-2.5 py-1 text-[#8b3000]">{formatScore(game.star)}</span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#7b8da1] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function PreregCard({
  game,
  siteShareImage,
  cardRing,
}: {
  game: ApiGame;
  siteShareImage?: string | null;
  cardRing: string;
}) {
  const imageUrl = buildGameVisual(game, siteShareImage);
  const devices = Array.from(
    new Set(
      (Array.isArray(game?.metadata?.deviceList) ? game.metadata.deviceList : [])
        .map((item) => formatDeviceLabel(item))
        .filter(Boolean),
    ),
  ).slice(0, 3);

  return (
    <Link
      href={getGameHref(game)}
      data-acbox-action="album_prereg_game_click"
      data-acbox-label={normalizeText(game.name) || '预约专题游戏'}
      className={`group flex h-full flex-col justify-between gap-5 rounded-[26px] border border-[#f3d9df] bg-white p-5 shadow-[0_12px_32px_rgba(12,15,16,0.08)] transition-all hover:-translate-y-1 ${cardRing}`}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[22px] bg-[#f7ecef]">
          <Image
            src={imageUrl || FALLBACK_IMAGE}
            alt={normalizeText(game.name) || '预约新游'}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-[#15202b]">{clampText(normalizeText(game.name) || '预约内容', 18)}</h3>
          <p className="mt-1 text-sm font-semibold text-[#9a214f]">
            {normalizeText(game?.metadata?.region) || '国际服'}
          </p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4a6074]">
            {clampText(normalizeText(game.summary) || '关注上线节奏与预约节点。', 82)}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#fff1f5] px-2.5 py-1 text-xs font-bold text-[#9a214f]">
            评分 {formatScore(game.star)}
          </span>
          {devices.map((device) => (
            <span key={`${game._id}-${device}`} className="rounded-full bg-[#f7f1f3] px-2.5 py-1 text-xs font-bold text-[#6e4152]">
              {device}
            </span>
          ))}
          {!devices.length ? (
            <span className="rounded-full bg-[#f7f1f3] px-2.5 py-1 text-xs font-bold text-[#6e4152]">
              多端关注
            </span>
          ) : null}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#9a214f] px-4 py-2 text-sm font-black text-white">
          <Clock3 className="h-4 w-4" />
          查看详情
        </div>
      </div>
    </Link>
  );
}

function CompactToolCard({
  game,
  siteShareImage,
  cardRing,
}: {
  game: ApiGame;
  siteShareImage?: string | null;
  cardRing: string;
}) {
  const imageUrl = buildGameVisual(game, siteShareImage);

  return (
    <Link
      href={getGameHref(game)}
      data-acbox-action="album_tool_game_click"
      data-acbox-label={normalizeText(game.name) || '工具专题应用'}
      className={`group rounded-[24px] border border-[#d9e4ef] bg-white p-4 shadow-[0_12px_32px_rgba(12,15,16,0.08)] transition-all hover:-translate-y-1 ${cardRing}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-[#edf5ff]">
          <Image
            src={imageUrl || FALLBACK_IMAGE}
            alt={normalizeText(game.name) || '工具应用'}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-black text-[#15202b]">{normalizeText(game.name) || '工具应用'}</h3>
          <p className="mt-1 truncate text-sm text-[#4a6074]">{normalizeText(game.tags?.[0]) || '效率工具'}</p>
        </div>
        <span className="rounded-full bg-[#edf7ff] px-2.5 py-1 text-xs font-bold text-[#005e9f]">
          {formatScore(game.star)}
        </span>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#425466]">
        {clampText(normalizeText(game.summary) || '快速查看这款工具应用的核心信息与详情页入口。', 72)}
      </p>
    </Link>
  );
}

function renderAlbumGames(params: {
  album: ApiAlbum;
  games: ApiGame[];
  siteShareImage?: string | null;
  cardRing: string;
}) {
  const { album, games, siteShareImage, cardRing } = params;
  const normalizedStyle = normalizeText(album?.style).toLowerCase();

  if (normalizedStyle === 'box') {
    return <div className="space-y-4">{games.map((game, index) => <RankingRow key={game._id} game={game} index={index} siteShareImage={siteShareImage} cardRing={cardRing} />)}</div>;
  }

  if (normalizedStyle === 'pre') {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {games.map((game) => (
          <PreregCard key={game._id} game={game} siteShareImage={siteShareImage} cardRing={cardRing} />
        ))}
      </div>
    );
  }

  if (normalizedStyle === 'list') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <CompactToolCard key={game._id} game={game} siteShareImage={siteShareImage} cardRing={cardRing} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {games.map((game) => (
        <ShowcaseCard key={game._id} game={game} siteShareImage={siteShareImage} cardRing={cardRing} />
      ))}
    </div>
  );
}

export default function AlbumTopicView({
  album,
  siteName,
  siteShareImage,
}: AlbumTopicViewProps) {
  const games = normalizeAlbumGames(album);
  const title = normalizeText(album?.title) || '专题推荐';
  const subtitle = normalizeText(album?.subtitle);
  const description = getAlbumDescription(album);
  const keywords = getAlbumKeywords(album);
  const heroImage = getAlbumShareImage(album, siteShareImage);
  const featureGame = games[0] || null;
  const supportingGames = games.slice(1, 4);
  const regions = collectRegions(games);
  const devices = collectDevices(games);
  const primaryTags = collectPrimaryTags(games);
  const styleInfo = getStyleClassNames(album?.style);
  const palette = getStylePalette(album?.style);
  const averageRating = games.length
    ? (
        games.reduce((sum, game) => {
          const score = Number(game?.star || 0);
          return Number.isFinite(score) ? sum + score : sum;
        }, 0) / games.length
      ).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8 pb-12">
      <section className={`relative overflow-hidden rounded-[34px] bg-gradient-to-br ${styleInfo.heroGradient} text-white shadow-[0_28px_60px_rgba(8,18,31,0.24)]`}>
        {heroImage ? (
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover opacity-22"
            sizes="100vw"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_38%),linear-gradient(135deg,rgba(0,0,0,0.2),rgba(0,0,0,0.58))]" />
        <div className="relative z-10 grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.2fr)_380px] xl:p-10">
          <div>
            <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/68">
              <Link href="/" className="transition-colors hover:text-white">首页</Link>
              <span>/</span>
              <span>专题推荐</span>
              <span>/</span>
              <span className="text-white">{title}</span>
            </nav>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${palette.chip}`}>
                <Layers3 className="h-3.5 w-3.5" />
                {getAlbumStyleLabel(album?.style)}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${palette.chip}`}>
                <Download className="h-3.5 w-3.5" />
                {games.length} 款内容
              </span>
              {regions.length > 0 ? (
                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${palette.chip}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {regions.slice(0, 3).join(' / ')}
                </span>
              ) : null}
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl xl:text-[3.35rem] xl:leading-[1.08]">
              {title}
            </h1>
            {subtitle ? (
              <p className={`mt-3 text-base font-bold ${palette.headingAccent}`}>{subtitle}</p>
            ) : null}
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/84 sm:text-[15px]">
              {description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#album-games"
                data-acbox-action="album_enter_content"
                data-acbox-label={title}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-colors ${palette.primaryButton}`}
              >
                进入专题内容
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/app"
                data-acbox-action="album_browse_library"
                data-acbox-label={title}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-colors ${palette.secondaryButton}`}
              >
                浏览游戏库
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className={`rounded-[22px] border border-white/12 p-4 backdrop-blur ${palette.featurePanel}`}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/64">专题评分均值</p>
                <p className={`mt-2 text-2xl font-black ${palette.statValue}`}>{averageRating}</p>
              </div>
              <div className={`rounded-[22px] border border-white/12 p-4 backdrop-blur ${palette.featurePanel}`}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/64">覆盖设备</p>
                <p className={`mt-2 text-lg font-black ${palette.statValue}`}>{devices.length > 0 ? devices.join(' / ') : '多端内容'}</p>
              </div>
              <div className={`rounded-[22px] border border-white/12 p-4 backdrop-blur ${palette.featurePanel}`}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/64">专题归属</p>
                <p className={`mt-2 text-lg font-black ${palette.statValue}`}>{siteName}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {featureGame ? <FeatureGameCard game={featureGame} siteShareImage={siteShareImage} /> : null}
            {supportingGames.map((game) => (
              <SupportingGameCard key={game._id} game={game} siteShareImage={siteShareImage} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[30px] border border-[#d7e2ee] bg-white p-6 shadow-[0_12px_32px_rgba(12,15,16,0.06)] sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${styleInfo.sectionBadge}`}>
              专题导读
            </span>
            <p className="text-sm font-semibold text-[#587089]">{styleInfo.sectionHint}</p>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[#425466]">
            <p>
              {title} 当前共收录 {games.length} 款内容，覆盖 {regions.length > 0 ? regions.join('、') : '多分区'}，
              页面内优先展示专题主推内容，再给出完整清单，方便直接进入详情页核对版本、截图、评分与下载信息。
            </p>
            <p>{buildAlbumAudienceText(String(album?.style || ''), keywords)}</p>
            <p>{buildAlbumMaintenanceText(album?.mode)}</p>
          </div>
        </article>

        <aside className="rounded-[30px] border border-[#d7e2ee] bg-[#f6f9fc] p-6 shadow-[0_12px_32px_rgba(12,15,16,0.04)] sm:p-7">
          <div className="flex items-center gap-2 text-[#15202b]">
            {normalizeText(album?.style).toLowerCase() === 'list' ? (
              <Wrench className="h-4 w-4 text-[#005e9f]" />
            ) : (
              <Sparkles className="h-4 w-4 text-[#005e9f]" />
            )}
            <h2 className="text-lg font-black">浏览建议</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[#425466]">
            <li>先看首屏推荐，能最快判断这个专题当前主推的核心作品。</li>
            <li>再看完整列表里的标签、评分、分区和更新时间，筛掉不匹配内容。</li>
            <li>如果想扩大范围，直接跳转游戏详情页或站内游戏库继续深挖。</li>
          </ul>
          <div className="mt-6">
            <h3 className="text-sm font-black text-[#15202b]">专题关键词</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(keywords.length > 0 ? keywords : primaryTags).slice(0, 8).map((keyword) => (
                <span key={keyword} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#587089] shadow-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section id="album-games" className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#005e9f]">{getAlbumStyleLabel(album?.style)}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#15202b]">{styleInfo.sectionTitle}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#587089]">
              {games.length > 0
                ? `以下内容均来自 ${title} 专题，按照当前专辑顺序完整展示。`
                : '当前专题暂时没有可展示内容。'}
            </p>
          </div>
          <Link
            href="/app"
            data-acbox-action="album_browse_library"
            data-acbox-label={title}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#005e9f] transition-colors hover:text-[#004a7e]"
          >
            扩展浏览游戏库
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {renderAlbumGames({
          album,
          games,
          siteShareImage,
          cardRing: styleInfo.cardRing,
        })}
      </section>
    </div>
  );
}
