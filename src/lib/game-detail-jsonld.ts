import { resolveGameName } from '@/lib/game-display-name';
import { normalizeText } from '@/lib/seo';
import { isWebGameType } from '@/lib/game-resource-type';
import type { ApiDownloadResource, GameDetailData, GamePageSnapshot } from '@/types';

/**
 * 详情页 `SoftwareApplication` JSON-LD 的纯函数组装。
 *
 * 从 page.tsx 抽出的原因：结构化数据字段必须有「解析 JSON + 必填字段断言」的测试
 * （派发单 #80 验收 3），而 page.tsx 依赖 Next 路由上下文无法直接 import。
 * 组装规则：只写数据里真实存在的字段，缺版本 / 缺评分 / 缺资源时宁可不写，
 * 不为「看起来完整」编造任何值。
 */

export function schemaApplicationCategory(input?: string | null): string {
  const value = normalizeText(input).toLowerCase();
  const applicationTypes = new Set(['app', 'application', 'tool', 'software']);
  return applicationTypes.has(value) ? 'UtilitiesApplication' : 'GameApplication';
}

function toIsoDate(input?: string | null): string | undefined {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function formatFileSize(bytes?: number | null): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export interface DetailJsonLdInput {
  game: GameDetailData['app'];
  reviewSummary: GamePageSnapshot['reviewSummary'];
  resources: ApiDownloadResource[];
  /** 已清洗的 SEO 描述；空串表示无。 */
  description: string;
  aliases: string[];
  canonicalUrl: string;
  heroImage?: string;
  /** 已 normalizeText 的主分类。 */
  genre: string;
  /** 已 normalize + 截断的截图 URL 列表。 */
  screenshots: string[];
}

export function buildDetailJsonLd(input: DetailJsonLdInput): Record<string, unknown> {
  const { game, reviewSummary, resources, description, aliases, canonicalUrl, heroImage, genre, screenshots } = input;
  const isWebGame = isWebGameType(game.type);
  // 评分结构化数据只使用站点真实评价数据；来源评分（app.star）仅作为展示参考，不进 JSON-LD。
  const ratingCount = Math.max(0, Number(reviewSummary?.ratingCount || 0));
  const siteRatingAverage = Number(reviewSummary?.userAverage || 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: resolveGameName(game),
    alternateName: aliases.length > 0 ? aliases : undefined,
    applicationCategory: schemaApplicationCategory(game.type),
    operatingSystem: isWebGame ? 'Web Browser' : 'Android',
    inLanguage: 'zh-CN',
    image: heroImage || undefined,
    description: description || undefined,
    url: canonicalUrl,
    genre: genre || undefined,
    screenshot: screenshots.length > 0 ? screenshots : undefined,
    softwareVersion: isWebGame ? undefined : normalizeText(game.version) || undefined,
    fileSize: isWebGame ? undefined : formatFileSize(game.file_size),
    datePublished: toIsoDate(game.release_at),
    dateModified: toIsoDate(game.latest_at),
    publisher: game.developer
      ? {
          '@type': 'Organization',
          name: normalizeText(game.developer),
        }
      : undefined,
    ...(!isWebGame && Array.isArray(resources) && resources.length > 0
      ? {
          offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            price: '0',
            priceCurrency: 'CNY',
            availability: 'https://schema.org/InStock',
          },
          potentialAction: {
            '@type': 'InstallAction',
            target: canonicalUrl,
            platform: ['https://schema.org/AndroidPlatform'],
          },
        }
      : {}),
    aggregateRating: ratingCount > 0 && siteRatingAverage > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: Math.round(siteRatingAverage * 10) / 10,
          ratingCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };
}
