import { getSiteUrl } from '@/lib/seo';
import {
  SITEMAP_PRIORITY_FILE_NAME,
  SITEMAP_REVALIDATE_SECONDS,
  applyGameLastmodPatch,
  buildShards,
  checkStaticAge,
  createSitemapBuilder,
  getServerApiBaseUrl,
  inspectStaticSitemap,
  serializeSitemapXml,
  validateStaticSitemap,
} from '@/lib/sitemap-core.mjs';
import { readStaticSitemapFile, xmlResponse } from '@/lib/sitemap-route';

// sitemap 依赖生产 API，运行时生成，避免构建阶段失败被预渲染为空。
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOG_TAG = '[sitemap-priority]';

/**
 * 主 sitemap 的 priority 分片（#269）：静态入口 + 分类页 + 按 updated_at 倒序的前 300 个详情页。
 *
 * 这份是「每轮都整体提交」的那一段，长尾 URL 拆到 `/sitemap-tail/<N>`，由 `/sitemap.xml`
 * （sitemapindex）统一指向。收录与否和改前一致：所有已发布详情页仍然都在索引覆盖内，
 * 只是分散到不同分片；删分片等于丢收录，任何降级都必须是「整份可用」而不是少几条。
 *
 * 与旧主 sitemap 的差异：这一份只装 300 个详情页，所以不做「线上游戏总数」新鲜度校验
 * （总量校验由索引层负责）；lastmod 补丁照旧按线上 updated_at 覆写。
 */
export async function GET(): Promise<Response> {
  const builder = createSitemapBuilder({
    apiBaseUrl: getServerApiBaseUrl(),
    siteUrl: getSiteUrl(),
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    logger: console,
  });

  try {
    // 1) 静态优先：文件自洽且未过期才直出。
    const staticFile = await readStaticSitemapFile(SITEMAP_PRIORITY_FILE_NAME);
    if (staticFile) {
      const meta = inspectStaticSitemap(staticFile.xml);
      const validation = validateStaticSitemap(meta);
      const age = checkStaticAge(meta);
      if (validation.ok && age.ok) {
        // 一次轻量请求拿到构建之后被更新过的游戏，就地覆写对应 <lastmod>。
        const updates = await builder.getRecentGameUpdates(meta.buildTime);
        const patched = applyGameLastmodPatch(staticFile.xml, updates.games);
        console.log(
          `${LOG_TAG} 直出静态文件 ${staticFile.source}：${validation.reason}；age ${Math.round(age.ageHours)}h；lastmod 补丁 ${patched.patched} 条`,
        );
        return xmlResponse(
          patched.xml,
          patched.patched > 0
            ? `static:${staticFile.source}+lastmod:${patched.patched}`
            : `static:${staticFile.source}`,
        );
      }
      console.warn(
        `${LOG_TAG} 静态文件不可直出（${validation.ok ? age.reason : validation.reason}），改用运行时生成`,
      );
    }

    // 2) 运行时兜底：任何异常都必须返回 200 的可用 sitemap，不允许 500。
    try {
      const { sections, stats } = await builder.buildEntries();
      const { priority } = buildShards(sections.main);
      console.warn(
        `${LOG_TAG} 运行时生成 ${priority.length} 条（games=${stats.games} category=${stats.categoryPages}）`,
      );
      return xmlResponse(serializeSitemapXml(priority), 'runtime');
    } catch (error) {
      console.error(`${LOG_TAG} 运行时生成异常，返回静态入口兜底：`, error);
      return xmlResponse(serializeSitemapXml(builder.buildStaticEntries('main')), 'runtime-static-paths-only');
    }
  } catch (error) {
    // 最外层兜底：连静态文件读取/日志都可能异常，仍然保证 200。
    console.error(`${LOG_TAG} 未预期异常，返回静态入口兜底：`, error);
    return xmlResponse(serializeSitemapXml(builder.buildStaticEntries('main')), 'error-static-paths-only');
  }
}
