import { getSiteUrl } from '@/lib/seo';
import {
  SITEMAP_REVALIDATE_SECONDS,
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

const LOG_TAG = '[sitemap-community]';
const STATIC_FILE_NAME = 'sitemap-community.xml';

/**
 * 社区 sitemap（/sitemap-community.xml，#126）：社区静态入口 + albums + topics + posts。
 * 与主 sitemap（/sitemap.xml）分层后，社区页的抓取预算与详情页互不挤占。
 *
 * 校验规则与主 sitemap 的差异：这一份没有游戏条目，所以不做「线上游戏总数」新鲜度校验，
 * 也没有 lastmod 补丁；只要求产物自身自洽（结构完整 + 注释 urlCount 一致）。
 */
export async function GET(): Promise<Response> {
  const builder = createSitemapBuilder({
    apiBaseUrl: getServerApiBaseUrl(),
    siteUrl: getSiteUrl(),
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    logger: console,
  });

  try {
    // 1) 静态优先：文件自洽才直出。
    const staticFile = await readStaticSitemapFile(STATIC_FILE_NAME);
    if (staticFile) {
      const meta = inspectStaticSitemap(staticFile.xml);
      const validation = validateStaticSitemap(meta);
      if (validation.ok) {
        console.log(`${LOG_TAG} 直出静态文件 ${staticFile.source}：${validation.reason}`);
        return xmlResponse(staticFile.xml, `static:${staticFile.source}`);
      }
      console.warn(`${LOG_TAG} 静态文件校验失败（${validation.reason}），改用运行时生成`);
    }

    // 2) 运行时兜底：任何异常都必须返回 200 的可用 sitemap，不允许 500。
    try {
      const { sections, stats, apiReachable } = await builder.buildEntries();
      console.warn(
        `${LOG_TAG} 运行时生成 community ${sections.community.length} 条（posts=${stats.posts} topics=${stats.topics} albums=${stats.albums}${apiReachable ? '' : '，API 不可达'}`,
      );
      return xmlResponse(serializeSitemapXml(sections.community), 'runtime');
    } catch (error) {
      console.error(`${LOG_TAG} 运行时生成异常，返回静态入口兜底：`, error);
      return xmlResponse(serializeSitemapXml(builder.buildStaticEntries('community')), 'runtime-static-paths-only');
    }
  } catch (error) {
    console.error(`${LOG_TAG} 未预期异常，返回静态入口兜底：`, error);
    return xmlResponse(serializeSitemapXml(builder.buildStaticEntries('community')), 'error-static-paths-only');
  }
}
