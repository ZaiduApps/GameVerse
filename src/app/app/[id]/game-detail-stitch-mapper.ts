// 把接口真实数据合并成页面直接可渲染的视图模型。
// 设计原则：接口能拿到的字段一律用真实值；**取不到就整项不渲染**，不写「未知 / 暂无 / -」，
// 也不补任何示例数值（评分、评价数、下载量、内购提示、区服提示都只有真实字段才能出现）。
// 游戏自身的介绍、FAQ、评价、帖子不走本文件兜底，缺失时对应区块直接不渲染。

import type { ApiGameDetail, ApiRecommendedGame, CardConfigItem, GameDetailData, GamePageSnapshot } from '@/types';

import { resolveDisplayVersion } from '@/lib/game-version';

import { type MockResourceLink } from './game-detail-mock-copy';

import {
  cleanText,
  formatAndroidPlatformLabel,
  formatBytes,
  formatCompactCount,
  formatDateText,
  normalizeScore,
} from './game-detail-presenter';

export interface TrustBadge {
  label: string;
  className: string;
}

export interface HeroMetric {
  /** 指标身份。布局按身份而不是数组下标取格，过滤后不会错位。 */
  key: 'rating' | 'category' | 'download' | 'platform';
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

// Hero 徽章：只用接口真实标签；没有标签就不渲染。
// 不再用「官方正版 / 编辑精选」这类没有证据的稿件徽章补位（派发单 #180）。
export function buildTrustBadges(tags: string[]): TrustBadge[] {
  return tags.slice(0, 3).map((label, index) => ({
    label,
    className: BADGE_TONES[index % BADGE_TONES.length],
  }));
}

// Hero 指标条：综合评分 / 游戏分类 / 下载热度 / 适龄与平台。
// 每一格都必须由真实字段支撑，取不到就整格不出现（移动端按 key 取格，不靠固定下标）：
// - 评分：`star` 缺失或非正数 → 不渲染「综合评分」；`ratingCount` 为 0 → hint 留空，不伪造条数；
// - 下载热度：`download_count_show` 为空 → 不渲染（不再用示例数值撑版式）；
// - 平台：没有区服就不把区服写成事实，hint 只保留不作断言的空间。
export function buildHeroMetrics(args: {
  game: GameDetailData['app'];
  primaryCategory: string;
  isWebGame: boolean;
  reviewSummary?: GamePageSnapshot['reviewSummary'];
}): HeroMetric[] {
  const { game, primaryCategory, isWebGame, reviewSummary } = args;
  const ratingCount = Math.max(0, Number(reviewSummary?.ratingCount || 0));
  const metrics: HeroMetric[] = [];

  const rawScore = Number(game.star);
  if (Number.isFinite(rawScore) && rawScore > 0) {
    metrics.push({
      key: 'rating',
      label: '综合评分',
      value: rawScore.toFixed(1),
      hint: ratingCount > 0 ? `${formatCompactCount(ratingCount)} 条评价` : '',
    });
  }

  if (primaryCategory) {
    metrics.push({ key: 'category', label: '游戏分类', value: primaryCategory, hint: '按标签自动归类' });
  }

  // download_count_show 可能是「未知下载量」这类文案，只有纯数值才追加 “+”。
  const downloadShow = cleanText(game.download_count_show);
  const downloadValue = isWebGame
    ? '页游专区'
    : downloadShow
      ? /^[\d.,]+\s*[KMBkmb万亿]?$/.test(downloadShow)
        ? `${downloadShow}+`
        : downloadShow
      : '';
  if (downloadValue) {
    metrics.push({
      key: 'download',
      label: isWebGame ? '游玩方式' : '下载热度',
      value: downloadValue,
      hint: isWebGame ? '在 AC 盒子内游玩' : '多渠道官方分发',
    });
  }

  // 4 号位优先展示真实区服；没有区服时改用接口真实的最低 Android 版本（#210），
  // 两者都没有时只保留平台事实 `Android`，不再写死 `Android 8.0+` 这种编造的兼容性承诺。
  // hint 留空：加速 / 内购这类结论没有接口字段可支撑，不能作为事实展示。
  const regionValue = cleanText(game.metadata?.region);
  metrics.push({
    key: 'platform',
    label: regionValue ? '区服与平台' : '适龄与平台',
    value: regionValue || (isWebGame ? 'AC 盒子' : formatAndroidPlatformLabel(game.limit_android_version) || 'Android'),
    hint: '',
  });

  return metrics;
}

// 技术参数宫格：只展示真实 facts，不再用稿件条目补齐。
// 「最低系统要求 / 支持语言」两条对所有游戏写死同一句编造值，会误导安装（#194）；
// 「安全签名校验」已移除——没有签名校验集成，不能作为事实展示。
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

  return tiles.slice(0, MAX_SPEC_TILES);
}

// 最新更新：有 latest_content 就用真实内容；没有真实内容时返回空 headline + 空 bullets，
// 由渲染层整块不渲染（#219：过去全站回落到示例游戏的更新日志，属于伪内容）。
export function buildLatestUpdate(
  game: GameDetailData['app'],
  latestContent: string,
): LatestUpdateView {
  // 占位符（VARY / VARY@<epoch>）不是可读版本号，按缺失处理。
  const version = resolveDisplayVersion(game.version);
  const versionLabel = version ? `版本 v${version}` : '版本信息待补充';
  const updatedAt = formatDateText(game.latest_at);
  const meta = updatedAt !== '未知' ? `${versionLabel} · 更新于 ${updatedAt}` : versionLabel;
  const bullets = latestContent
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (bullets.length === 0) {
    return { versionLabel: meta, headline: '', bullets: [] };
  }
  return { versionLabel: meta, headline: bullets[0], bullets: bullets.slice(1) };
}

// 侧栏“官方资源与外链服务”：只渲染后台配置的真实 cardConfig 条目。
// 没有配置时返回空数组，由渲染层整块不渲染——过去会退回三条广告文案（QQ 频道 /
// 礼品卡代充 / 加速工具），既不是站点自己的服务，也没有可点击的目标。
export function buildResourceLinks(items: CardConfigItem[]): ResourceLinkView[] {
  const icons: MockResourceLink['icon'][] = ['message', 'card', 'rocket'];
  const tones = [
    'bg-tone-blue/10 text-tone-blue border-tone-blue/25',
    'bg-tone-amber/10 text-tone-amber border-tone-amber/25',
    'bg-tone-green/10 text-tone-green border-tone-green/25',
  ];
  return items
    .map((item) => {
      const title = cleanText(item.content?.title);
      const description = cleanText(item.content?.text || item.content?.html);
      const href = String(item.content?.link || '').trim();
      return { key: item._id || title, title, description, href };
    })
    .filter((item) => item.title || item.description)
    .map((item, index) => ({
      key: `${item.key}-${index}`,
      title: item.title || '资源链接',
      description: item.description || '点击查看',
      href: item.href,
      tone: tones[index % tones.length],
      icon: icons[index % icons.length],
    }));
}

// 相似推荐：只用真实数据。为空时返回空数组让区块整体不渲染——
// 过去用稿件三款游戏撑版式，渲染出的是 3 个 href="" 的死链卡片（既不能点，又被爬虫当作链接）。
export function buildSimilarGames(items: ApiRecommendedGame[]): SimilarGameView[] {
  // 详情页内链密度：用后端已返回的推荐列表，最多渲染 10 个 /app/{pkg} 链接。
  const real = items.slice(0, 10);
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
  const version = resolveDisplayVersion(game.version);
  if (version) parts.push(`v${version}`);
  if (game.file_size) parts.push(formatBytes(game.file_size));
  return parts.join(' · ') || '版本信息待补充';
}
