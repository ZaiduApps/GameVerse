import { getSiteUrl } from '@/lib/seo';
import {
  SITEMAP_REVALIDATE_SECONDS,
  applyGameLastmodPatch,
  buildShards,
  createSitemapBuilder,
  getServerApiBaseUrl,
  inspectStaticSitemap,
  parseSitemapShardParam,
  serializeSitemapXml,
  sitemapShardFileName,
  validateStaticSitemap,
} from '@/lib/sitemap-core.mjs';
import { readStaticSitemapFile, xmlResponse } from '@/lib/sitemap-route';

// sitemap 依赖生产 API，运行时生成，避免构建阶段失败被预渲染为空。
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOG_TAG = '[sitemap-tail]';

/**
 * 主 sitemap 的长尾分片（#269）：`/sitemap-tail/<N>`。
 *
 * 为什么 URL 不带 `.xml` 后缀：Next 的 app 目录只认「整段动态」的段（`[n]` / `[[...n]]`），
 * `sitemap-tail-[shard].xml` 这种带后缀的目录会被当成静态路由，线上 404（已实测）。
 * 所以静态产物叫 `sitemap-tail-<N>.xml`，线上地址是 `/sitemap-tail/<N>`，映射函数只有
 * `sitemapShardFileName` / `sitemapShardPath` 两份。
 *
 * 降级策略：静态文件缺失/损坏时用与构建期完全相同的 `buildShards` 重算这一片；
 * 仍拿不到该片（真不存在，或 API 不可达）才 404。索引里列出的分片必须真的能取到内容，
 * 否则等于把长尾 URL 从收录里悄悄删掉。
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ shard?: string[] }> },
): Promise<Response> {
  const params = await context.params;
  const shard = parseSitemapShardParam(params?.shard);
  if (shard === null) {
    return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  const builder = createSitemapBuilder({
    apiBaseUrl: getServerApiBaseUrl(),
    siteUrl: getSiteUrl(),
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    logger: console,
  });

  // 1) 静态优先：文件自洽才直出。
  const staticFile = await readStaticSitemapFile(sitemapShardFileName(shard));
  if (staticFile) {
    const meta = inspectStaticSitemap(staticFile.xml);
    const validation = validateStaticSitemap(meta);
    if (validation.ok) {
      const updates = await builder.getRecentGameUpdates(meta.buildTime);
      const patched = applyGameLastmodPatch(staticFile.xml, updates.games);
      console.log(
        `${LOG_TAG} 直出静态文件 ${staticFile.source}：${validation.reason}；lastmod 补丁 ${patched.patched} 条`,
      );
      return xmlResponse(
        patched.xml,
        patched.patched > 0
          ? `static:${staticFile.source}+lastmod:${patched.patched}`
          : `static:${staticFile.source}`,
      );
    }
    console.warn(`${LOG_TAG} 分片静态文件校验失败（${validation.reason}），改用运行时生成`);
  }

  // 2) 运行时兜底：分片划分是纯函数，重算结果与构建期一致。
  try {
    const { sections } = await builder.buildEntries();
    const { tails } = buildShards(sections.main);
    const entries = tails.get(shard);
    if (!entries) {
      // 真不存在的片（数据量变了/手写 URL）：404，不发空 sitemap。
      return new Response('Not Found', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300' },
      });
    }
    console.warn(`${LOG_TAG} 运行时生成分片 ${shard} 共 ${entries.length} 条（共 ${tails.size} 片）`);
    return xmlResponse(serializeSitemapXml(entries), `runtime:shard-${shard}`);
  } catch (error) {
    // 运行时异常不出 200 空文件：宁可 404（索引下次重建会修正），也不写残缺快照。
    console.error(`${LOG_TAG} 运行时生成分片 ${shard} 异常：`, error);
    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
}
