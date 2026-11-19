import { getSiteUrl } from '@/lib/seo';
import {
  SITEMAP_COMMUNITY_FILE_NAME,
  SITEMAP_PRIORITY_FILE_NAME,
  SITEMAP_REVALIDATE_SECONDS,
  buildShards,
  checkStaticAge,
  createSitemapBuilder,
  getServerApiBaseUrl,
  inspectStaticSitemap,
  parseSitemapShardParam,
  serializeSitemapIndexXml,
  sitemapShardFileName,
  sitemapShardPath,
  validateStaticSitemap,
} from '@/lib/sitemap-core.mjs';
import { readStaticSitemapFile, xmlResponse } from '@/lib/sitemap-route';

// sitemap 依赖生产 API，运行时生成，避免构建阶段失败被预渲染为空。
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOG_TAG = '[sitemap]';

/**
 * 主 sitemap 索引（/sitemap.xml，#269）。
 *
 * 改前是「一份平铺 5280 条」，抓取预算全压在同一个文件上；改后是 sitemapindex：
 *   /sitemap-priority.xml   静态入口 + 分类页 + updated_at 倒序前 300 个详情页（每轮整体提交）
 *   /sitemap-tail/<N>       余下长尾详情页，按 pkg 稳定哈希分片（每片约 2000 条）
 *   /sitemap-community.xml  社区页（本轮不拆）
 *
 * 三条硬约束：
 *   1. 索引必须覆盖全部分片——任何分片静默缺席都等于把那一批 URL 从收录里删掉；
 *   2. 任一产物自检失败整批不落盘（构建脚本侧），这里对应「静态索引不可用就实时重算」；
 *   3. 索引里的每个 `<loc>` 都必须真的能取到内容，所以直出前逐片确认静态文件存在且自洽。
 */
export async function GET(): Promise<Response> {
  const builder = createSitemapBuilder({
    apiBaseUrl: getServerApiBaseUrl(),
    siteUrl: getSiteUrl(),
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    logger: console,
  });

  try {
    // 1) 静态优先：索引自洽 + 未过期 + 它列出的每一片都真的存在且自洽，才直出。
    const staticFile = await readStaticSitemapFile('sitemap.xml');
    if (staticFile) {
      const meta = inspectStaticSitemap(staticFile.xml);
      const validation = validateStaticSitemap(meta);
      const age = checkStaticAge(meta);
      if (!validation.ok) {
        console.warn(`${LOG_TAG} 静态索引校验失败（${validation.reason}），改用运行时生成`);
      } else if (!age.ok) {
        // 条数偏差闸抓不到「目录整体停更」：日增几十条时 5% 要好几十天才触发。
        console.warn(`${LOG_TAG} 静态索引已过期（${age.reason}），改用运行时生成`);
      } else if (meta.kind === 'index') {
        const problem = await findMissingShard(staticFile.xml);
        if (!problem) {
          console.log(`${LOG_TAG} 直出静态索引 ${staticFile.source}：${validation.reason}`);
          return xmlResponse(staticFile.xml, `static:${staticFile.source}`);
        }
        console.warn(`${LOG_TAG} 静态索引不自洽（${problem}），改用运行时生成`);
      } else {
        // 旧版平铺产物（升级前构建的 /sitemap.xml）：直接透传仍是合法 sitemap，不必打死。
        console.log(`${LOG_TAG} 直出旧版平铺产物 ${staticFile.source}：${validation.reason}`);
        return xmlResponse(staticFile.xml, `static:${staticFile.source}`);
      }
    }

    // 2) 运行时兜底：与构建期同一套 buildShards，条目集合不会少。
    try {
      const { sections, stats } = await builder.buildEntries();
      const { priority, tails } = buildShards(sections.main);
      const siteUrl = getSiteUrl().replace(/\/+$/, '');
      const sitemaps = [
        { url: `${siteUrl}/${SITEMAP_PRIORITY_FILE_NAME}` },
        ...[...tails.keys()].map((shard) => ({ url: `${siteUrl}${sitemapShardPath(shard)}` })),
        { url: `${siteUrl}/${SITEMAP_COMMUNITY_FILE_NAME}` },
      ];
      console.warn(
        `${LOG_TAG} 运行时生成索引：priority ${priority.length} 条 + ${tails.size} 个长尾分片（games=${stats.games}）`,
      );
      return xmlResponse(serializeSitemapIndexXml(sitemaps), 'runtime');
    } catch (error) {
      console.error(`${LOG_TAG} 运行时生成索引异常，返回只含社区与 priority 的兜底索引：`, error);
      const siteUrl = getSiteUrl().replace(/\/+$/, '');
      return xmlResponse(
        serializeSitemapIndexXml([
          { url: `${siteUrl}/${SITEMAP_PRIORITY_FILE_NAME}` },
          { url: `${siteUrl}/${SITEMAP_COMMUNITY_FILE_NAME}` },
        ]),
        'runtime-index-minimal',
      );
    }
  } catch (error) {
    // 最外层兜底：连静态文件读取/日志都可能异常，仍然保证 200。
    console.error(`${LOG_TAG} 未预期异常，返回只含社区与 priority 的兜底索引：`, error);
    const siteUrl = getSiteUrl().replace(/\/+$/, '');
    return xmlResponse(
      serializeSitemapIndexXml([
        { url: `${siteUrl}/${SITEMAP_PRIORITY_FILE_NAME}` },
        { url: `${siteUrl}/${SITEMAP_COMMUNITY_FILE_NAME}` },
      ]),
      'error-index-minimal',
    );
  }
}

/**
 * 索引里列出的每个长尾分片都必须在静态产物里真实存在且自洽。
 * 返回第一处问题描述；全部正常返回 null。
 */
async function findMissingShard(indexXml: string): Promise<string | null> {
  const locs = [...String(indexXml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  for (const loc of locs) {
    const shardMatch = /\/sitemap-tail\/([^/?#]+)$/.exec(loc);
    if (!shardMatch) continue; // priority / community 是单文件，由各自路由兜底
    const shard = parseSitemapShardParam(shardMatch[1]);
    if (shard === null) return `索引里有非法分片地址 ${loc}`;
    const file = await readStaticSitemapFile(sitemapShardFileName(shard));
    if (!file) return `索引指向的分片 ${loc} 没有静态产物`;
    const validation = validateStaticSitemap(inspectStaticSitemap(file.xml));
    if (!validation.ok) return `索引指向的分片 ${loc} 自检失败：${validation.reason}`;
  }
  return null;
}
