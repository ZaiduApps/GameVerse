import { getSiteUrl } from '@/lib/seo';
import {
  SITEMAP_REVALIDATE_SECONDS,
  applyGameLastmodPatch,
  checkStaticFreshness,
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

const LOG_TAG = '[sitemap]';
const STATIC_FILE_NAME = 'sitemap.xml';

/**
 * 主 sitemap（/sitemap.xml）：静态入口 + 分类页 + 游戏详情页。
 * `/search?q=` 不进 sitemap（#133）；社区页拆去了 /sitemap-community.xml（#126），
 * 把抓取预算让给详情页。
 */
export async function GET(): Promise<Response> {
  const builder = createSitemapBuilder({
    apiBaseUrl: getServerApiBaseUrl(),
    siteUrl: getSiteUrl(),
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    logger: console,
  });

  try {
    // 1) 静态优先：文件自洽（注释 urlCount 与条目数一致）且未过期才直出。
    const staticFile = await readStaticSitemapFile(STATIC_FILE_NAME);
    if (staticFile) {
      const meta = inspectStaticSitemap(staticFile.xml);
      const validation = validateStaticSitemap(meta);
      if (validation.ok) {
        // 一次轻量请求同时拿到线上游戏总数（新鲜度）与构建之后被更新过的游戏（lastmod 补丁）。
        const updates = await builder.getRecentGameUpdates(meta.buildTime);
        const freshness = checkStaticFreshness(meta, updates.total);
        if (freshness.ok) {
          // 静态文件里的 lastmod 是 buildTime 那一刻的快照，后台改完 SEO 不会自己变；
          // 用最新的 updated_at 就地覆写，避免爬虫一直看到旧日期（也不必重建整份 sitemap）。
          if (!updates.complete && updates.games.length > 0) {
            console.warn(
              `${LOG_TAG} 构建后的更新超过单页窗口，本次只补前 ${updates.games.length} 条 lastmod，其余等下次重建`,
            );
          }
          const patched = applyGameLastmodPatch(staticFile.xml, updates.games);
          console.log(
            `${LOG_TAG} 直出静态文件 ${staticFile.source}：${validation.reason}；${freshness.reason}${freshness.skipped ? '（跳过）' : ''}；lastmod 补丁 ${patched.patched} 条`,
          );
          return xmlResponse(
            patched.xml,
            patched.patched > 0
              ? `static:${staticFile.source}+lastmod:${patched.patched}`
              : `static:${staticFile.source}`,
          );
        }
        console.warn(`${LOG_TAG} 静态文件已过期（${freshness.reason}），改用运行时生成`);
      } else {
        console.warn(`${LOG_TAG} 静态文件校验失败（${validation.reason}），改用运行时生成`);
      }
    }

    // 2) 运行时兜底：任何异常都必须返回 200 的可用 sitemap，不允许 500。
    try {
      const { sections, stats, apiReachable } = await builder.buildEntries();
      console.warn(
        `${LOG_TAG} 运行时生成 main ${sections.main.length} 条（games=${stats.games} category=${stats.categoryPages}；剔除未发布游戏 ${stats.gamesSkippedUnpublished} 条${apiReachable ? '' : '，API 不可达'}`,
      );
      return xmlResponse(serializeSitemapXml(sections.main), 'runtime');
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
