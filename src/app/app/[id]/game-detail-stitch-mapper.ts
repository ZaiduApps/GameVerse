// 把「接口真实数据 + 视觉稿兜底内容」合并成页面直接可渲染的视图模型。
// 设计原则：接口能拿到的字段一律用真实值，取不到或为空时才回落到 game-detail-mock-copy 的稿件内容，
// 以保证版式完整；所有回落点都在本文件集中可见，便于后续替换成真实数据源。
// 注意：游戏自身的介绍、FAQ、评价、帖子不走本文件兜底，缺失时对应区块直接不渲染，
// 避免把示例游戏的文案当作真实内容展示。

import type { ApiGameDetail, ApiRecommendedGame, CardConfigItem, GameDetailData, GamePageSnapshot } from '@/types';

import {
  HERO_IN_APP_PURCHASE_NOTE,
  HERO_PLATFORM_NOTE,
  HERO_TRUST_BADGES,
  OFFICIAL_RESOURCE_LINKS_FALLBACK,
  RATING_FALLBACK_COUNT,
  RATING_FALLBACK_SCORE,
  SIGNATURE_VERIFY_TILE,
  SIMILAR_GAMES_FALLBACK,
  TECH_SPEC_FILLERS,
  WHATS_NEW_FALLBACK,
  type MockResourceLink,
} from './game-detail-mock-copy';
import { cleanText, formatBytes, formatCompactCount, formatDateText, normalizeScore } from './game-detail-presenter';

export interface TrustBadge {
  label: string;
  className: string;
}

export interface HeroMetric {
  label: string;
  value: string;
  hint: string;
}

export interface SpecTile {
  label: string;
  value: string;
  mono?: boolean;
  emphasize?: boolean;
  verified?: boolean;
  badge?: string;
}

export interface LatestUpdateView {
  versionLabel: string;
  headline: string;
  bullets: string[];
}

export interface ResourceLinkView {
  key: string;
  title: string;
  description: string;
  href: string;
  tone: string;
  icon: MockResourceLink['icon'];
}

export interface SimilarGameView {
  key: string;
  name: string;
  meta: string;
  icon: string;
  href: string;
}

export interface RelatedPostView {
  key: string;
  title: string;
  date: string;
  href: string;
}

// 徽章配色按位置轮换，复用站点 tone-* 语义色板，仅用于小面积元素。
const BADGE_TONES = [
  'border-tone-green/40 bg-tone-green/10 text-tone-green',
  'border-tone-blue/40 bg-tone-blue/10 text-tone-blue',
  'border-tone-amber/40 bg-tone-amber/10 text-tone-amber',
];

// 技术参数宫格最多展示 8 条，与视觉稿的 4 列 × 2 行一致。
const MAX_SPEC_TILES = 8;

// Hero 徽章：有真实标签就用标签，不足三条时用稿件徽章补位。
export function buildTrustBadges(tags: string[]): TrustBadge[] {
  const source = tags.length > 0 ? tags.slice(0, 3) : [...HERO_TRUST_BADGES];
  return source.map((label, index) => ({
    label,
    className: BADGE_TONES[index % BADGE_TONES.length],
  }));
}

// Hero 副信息里“包含应用内购买”一句，接口没有对应字段，按稿件固定展示。
export function buildHeroPurchaseNote(): string {
  return HERO_IN_APP_PURCHASE_NOTE;
}

// Hero 指标条：综合评分 / 游戏分类 / 下载热度 / 适龄与平台。
// PC 端四条全展示，移动端取第 1、3、4 条三宫格展示。
export function buildHeroMetrics(args: {
  game: GameDetailData['app'];
  primaryCategory: string;
  isWebGame: boolean;
  reviewSummary?: GamePageSnapshot['reviewSummary'];
}): HeroMetric[] {
  const { game, primaryCategory, isWebGame, reviewSummary } = args;
  const ratingCount = Number(reviewSummary?.ratingCount || 0);
  const score = normalizeScore(game.star, RATING_FALLBACK_SCORE);
  // download_count_show 可能是「未知下载量」这类文案，只有纯数值才追加 “+”。
  const downloadShow = cleanText(game.download_count_show);
  const downloadValue = isWebGame
    ? '页游专区'
    : downloadShow
      ? /^[\d.,]+\s*[KMBkmb万亿]?$/.test(downloadShow)
        ? `${downloadShow}+`
        : downloadShow
      : `${formatCompactCount(RATING_FALLBACK_COUNT)}+`;
  // 接口没有适龄与系统版本的独立字段，4 号位优先展示真实区服，取不到时再回落到平台兜底文案。
  const regionValue = cleanText(game.metadata?.region);
  const platformValue = regionValue || (isWebGame ? 'AC 盒子' : 'Android 8.0+');

  return [
    {
      label: '综合评分',
      value: score,
      hint: `${ratingCount > 0 ? formatCompactCount(ratingCount) : formatCompactCount(RATING_FALLBACK_COUNT)} 条评价`,
    },
    { label: '游戏分类', value: primaryCategory, hint: '按标签自动归类' },
    { label: isWebGame ? '游玩方式' : '下载热度', value: downloadValue, hint: isWebGame ? '在 AC 盒子内游玩' : '多渠道官方分发' },
    { label: regionValue ? '区服与平台' : '适龄与平台', value: platformValue, hint: HERO_PLATFORM_NOTE },
  ];
}

// 技术参数宫格：真实 facts 优先，不足 8 条时用稿件条目补齐，末位固定为签名校验。
export function buildSpecTiles(facts: { label: string; value: string }[]): SpecTile[] {
  const labelMap: Record<string, string> = {
    包名: '应用包名',
    当前版本: '当前正式版本',
    安装包大小: '安装包大小',
    开发者: '发行厂商',
  };
  const tiles: SpecTile[] = facts.map((fact) => ({
    label: labelMap[fact.label] || fact.label,
    value: fact.label === '安装包大小' ? `${fact.value} (基础包)` : fact.value,
    mono: fact.label === '包名',
    emphasize: fact.label === '安装包大小',
    badge: fact.label === '当前版本' ? '最新' : undefined,
  }));

  TECH_SPEC_FILLERS.forEach((item) => {
    if (tiles.length < MAX_SPEC_TILES - 1) tiles.push({ label: item.label, value: item.value });
  });
  tiles.push({ label: SIGNATURE_VERIFY_TILE.label, value: SIGNATURE_VERIFY_TILE.value, verified: true });

  return tiles.slice(0, MAX_SPEC_TILES);
}

// 最新更新：有 latest_content 就用真实内容，否则用稿件更新日志。
export function buildLatestUpdate(
  game: GameDetailData['app'],
  latestContent: string,
): LatestUpdateView {
  const versionLabel = game.version ? `版本 v${game.version}` : '版本信息待补充';
  const updatedAt = formatDateText(game.latest_at);
  const meta = updatedAt !== '未知' ? `${versionLabel} · 更新于 ${updatedAt}` : versionLabel;
  const bullets = latestContent
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (bullets.length === 0) {
    return { versionLabel: meta, headline: WHATS_NEW_FALLBACK.headline, bullets: [...WHATS_NEW_FALLBACK.bullets] };
  }
  return { versionLabel: meta, headline: bullets[0], bullets: bullets.slice(1) };
}

// 侧栏“官方资源与外链服务”：真实 cardConfig 条目优先，为空时用稿件三条。
export function buildResourceLinks(items: CardConfigItem[]): ResourceLinkView[] {
  const icons: MockResourceLink['icon'][] = ['message', 'card', 'rocket'];
  const tones = OFFICIAL_RESOURCE_LINKS_FALLBACK.map((item) => item.tone);
  const real = items
    .map((item) => {
      const title = cleanText(item.content?.title);
      const description = cleanText(item.content?.text || item.content?.html);
      const href = String(item.content?.link || '').trim();
      return { key: item._id || title, title, description, href };
    })
    .filter((item) => item.title || item.description);

  if (real.length === 0) {
    return OFFICIAL_RESOURCE_LINKS_FALLBACK.map((item, index) => ({
      key: `mock-resource-${index}`,
      title: item.title,
      description: item.description,
      href: '',
      tone: item.tone,
      icon: item.icon,
    }));
  }

  return real.map((item, index) => ({
    key: `${item.key}-${index}`,
    title: item.title || '资源链接',
    description: item.description || '点击查看',
    href: item.href,
    tone: tones[index % tones.length],
    icon: icons[index % icons.length],
  }));
}

// 相似推荐：真实推荐优先，为空时用稿件三款游戏（无跳转，仅撑版式）。
export function buildSimilarGames(items: ApiRecommendedGame[]): SimilarGameView[] {
  const real = items.slice(0, 3);
  if (real.length === 0) {
    return SIMILAR_GAMES_FALLBACK.map((item, index) => ({
      key: `mock-similar-${index}`,
      name: item.name,
      meta: item.meta,
      icon: '',
      href: '',
    }));
  }
  return real.map((item) => ({
    key: `${item._id}-${item.pkg}`,
    name: item.name,
    meta: `${normalizeScore(item.star)} 分 · ${cleanText(item.summary) || '同类热门推荐'}`,
    icon: item.icon || '',
    href: `/app/${encodeURIComponent(item.pkg)}`,
  }));
}

// 相关帖子：只用真实数据，缺失时返回空数组让区块整体不渲染。
export function buildRelatedPosts(
  items: { id: string; title: string; excerpt: string; date: string }[],
): RelatedPostView[] {
  return items.slice(0, 6).map((item) => ({
    key: item.id,
    title: item.title,
    date: item.date,
    href: `/community/post/${encodeURIComponent(item.id)}`,
  }));
}

// Hero 主按钮右侧的包体描述，例如 “v2.4 · 179.40 MB”。
export function buildPrimaryActionMeta(game: Pick<ApiGameDetail, 'version' | 'file_size'>): string {
  const parts: string[] = [];
  if (game.version) parts.push(`v${game.version}`);
  if (game.file_size) parts.push(formatBytes(game.file_size));
  return parts.join(' · ') || '版本信息待补充';
}
