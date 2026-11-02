import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * /sitemap.xml 与 /sitemap-community.xml 两条运行时路由共用的读取与响应助手。
 *
 * 静态产物候选路径：
 *   1. public/<file> —— 执行 `node scripts/generate-sitemap.mjs` 后的位置（本地/静态托管）；
 *   2. <distDir>/server/<file> —— postbuild 拷进来的副本，发布流程只上传 .next，
 *      线上服务器没有 public/ 产物，这一份才是线上真正能读到的静态文件。
 * 注意 public 目录里的同名文件在 Next 里会优先于路由直出（见 next/dist/server/lib/router-server.js），
 * 所以 postbuild 拷完会把 public 副本移出，保证校验/降级逻辑始终是唯一入口。
 */
const STATIC_RELATIVE_CANDIDATES = ['public'];

export function resolveDistDir() {
  const configured = String(process.env.NEXT_DIST_DIR || '').trim();
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? '.next' : '.next-dev';
}

export async function readStaticSitemapFile(fileName: string): Promise<{ xml: string; source: string } | null> {
  const root = process.cwd();
  const candidates = [
    ...STATIC_RELATIVE_CANDIDATES.map((dir) => path.join(dir, fileName)),
    path.join(resolveDistDir(), 'server', fileName),
  ];
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

export function xmlResponse(xml: string, source: string): Response {
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
