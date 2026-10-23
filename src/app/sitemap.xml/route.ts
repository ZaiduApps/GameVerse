import fs from 'node:fs/promises';
import path from 'node:path';

import { getSiteUrl } from '@/lib/seo';
import {
  SITEMAP_REVALIDATE_SECONDS,
  checkStaticFreshness,
  createSitemapBuilder,
  getServerApiBaseUrl,
  inspectStaticSitemap,
  serializeSitemapXml,
  validateStaticSitemap,
} from '@/lib/sitemap-core.mjs';

// sitemap 依赖生产 API，运行时生成，避免构建阶段失败被预渲染为空。
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOG_TAG = '[sitemap]';

/**
 * 静态产物候选路径：
 *   1. public/sitemap.xml —— 执行 `node scripts/generate-sitemap.mjs` 后的位置（本地/静态托管）；
 *   2. <distDir>/server/sitemap.xml —— postbuild 拷进来的副本，发布流程只上传 .next，
 *      线上服务器没有 public/ 产物，这一份才是线上真正能读到的静态文件。
 * 注意 public 目录里的同名文件在 Next 里会优先于路由直出（见 next/dist/server/lib/router-server.js），
 * 所以 postbuild 拷完会把 public 副本移出，保证校验/降级逻辑始终是唯一入口。
 */
const STATIC_RELATIVE_CANDIDATES = ['public/sitemap.xml'];

function resolveDistDir() {
  const configured = String(process.env.NEXT_DIST_DIR || '').trim();
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? '.next' : '.next-dev';
}

async function readStaticSitemap(): Promise<{ xml: string; source: string } | null> {
  const root = process.cwd();
  const candidates = [...STATIC_RELATIVE_CANDIDATES, path.join(resolveDistDir(), 'server', 'sitemap.xml')];
  for (const relative of candidates) {
    try {
      const xml = await fs.readFile(path.join(root, relative), 'utf8');
      if (xml.trim()) return { xml, source: relative };
    } catch {
      // 读不到就试下一个候选；全部失败由调用方降级到运行时生成。
    }
  }
  return null;
}

function xmlResponse(xml: string, source: string): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // 内容变化不频繁，允许边缘缓存半小时；stale 期间由浏览器/回源兜底。
      'cache-control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
      'x-sitemap-source': source,
    },
  });
}

export async function GET(): Promise<Response> {
  const builder = createSitemapBuilder({
    apiBaseUrl: getServerApiBaseUrl(),
    siteUrl: getSiteUrl(),
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    logger: console,
  });

  try {
    // 1) 静态优先：文件自洽（注释 urlCount 与条目数一致）且未过期才直出。
    const staticFile = await readStaticSitemap();
    if (staticFile) {
      const meta = inspectStaticSitemap(staticFile.xml);
      const validation = validateStaticSitemap(meta);
      if (validation.ok) {
        const liveGameTotal = await builder.getLiveGameTotal();
        const freshness = checkStaticFreshness(meta, liveGameTotal);
        if (freshness.ok) {
          console.log(
            `${LOG_TAG} 直出静态文件 ${staticFile.source}：${validation.reason}；${freshness.reason}${freshness.skipped ? '（跳过）' : ''}`,
          );
          return xmlResponse(staticFile.xml, `static:${staticFile.source}`);
        }
        console.warn(`${LOG_TAG} 静态文件已过期（${freshness.reason}），改用运行时生成`);
      } else {
        console.warn(`${LOG_TAG} 静态文件校验失败（${validation.reason}），改用运行时生成`);
      }
    }

    // 2) 运行时兜底：任何异常都必须返回 200 的可用 sitemap，不允许 500。
    try {
      const { entries, stats, apiReachable } = await builder.buildEntries();
      console.warn(
        `${LOG_TAG} 运行时生成 ${entries.length} 条（games=${stats.games} posts=${stats.posts} topics=${stats.topics} albums=${stats.albums} users=${stats.users}${apiReachable ? '' : '，API 不可达'}`,
      );
      return xmlResponse(serializeSitemapXml(entries), 'runtime');
    } catch (error) {
      console.error(`${LOG_TAG} 运行时生成异常，返回静态入口兜底：`, error);
      return xmlResponse(serializeSitemapXml(builder.buildStaticEntries()), 'runtime-static-paths-only');
    }
  } catch (error) {
    // 最外层兜底：连静态文件读取/日志都可能异常，仍然保证 200。
    console.error(`${LOG_TAG} 未预期异常，返回静态入口兜底：`, error);
    return xmlResponse(serializeSitemapXml(builder.buildStaticEntries()), 'error-static-paths-only');
  }
}
