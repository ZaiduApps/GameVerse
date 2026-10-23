/**
 * sitemap 生成核心：运行时路由（src/app/sitemap.xml/route.ts）与构建期脚本
 * （scripts/generate-sitemap.mjs）共用同一套抓取/过滤/序列化规则。
 *
 * 为什么是 .mjs 而不是 .ts：构建脚本必须能被裸 `node` 直接执行（prebuild 阶段还没有
 * 编译产物），而运行时路由又必须走 Next/TS。放在 .mjs 里两边都能 import，规则只有一份，
 * 不会出现「静态文件与运行时结果不一致」的漂移。tsconfig 的 allowJs 负责让 TS 侧可用。
 *
 * 静态文件约定：
 *   - 第一行 `<?xml ...?>`，随后一行注释头 `<!-- buildTime: <ISO> urlCount: <N> -->`
 *   - urlCount 必须等于文件里 <loc> 的条数；不一致即视为产物损坏，运行时回落实时生成。
 */

export const SITEMAP_PAGE_SIZE = 500;
export const SITEMAP_MAX_PAGES = 200;
export const NEWS_SITEMAP_MAX_PAGES = 80;
/** 运行时抓接口的缓存时长（秒）。 */
export const SITEMAP_REVALIDATE_SECONDS = 1800;

export const FALLBACK_STATIC_PATHS = ['/', '/app', '/community', '/community/topics', '/rankings'];

/** 静态 sitemap 与线上游戏总数的允许偏差；超过即判定静态文件过期。 */
export const STATIC_COUNT_DEVIATION_LIMIT = 0.05;

/** 注释头：buildTime 与 urlCount 都必需，顺序固定。 */
export const STATIC_SITEMAP_HEADER_PATTERN = /<!--\s*buildTime:\s*(\S+)\s+urlCount:\s*(\d+)\s*-->/;

const DEFAULT_SITE_URL = 'https://apks.cc';
const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';

/** 与 src/app/sitemap.ts 历史实现完全一致的服务端 API 基址解析。 */
export function getServerApiBaseUrl(env = process.env) {
  const appEnv = String(env.APP_ENV || env.NODE_ENV || 'development').toLowerCase();
  const base = (
    env.API_BASE_URL ||
    (appEnv === 'production'
      ? env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
      : env.API_BASE_URL_DEV || 'http://127.0.0.1:9527')
  );
  return String(base || '').replace(/\/+$/, '');
}

/** 与 src/lib/seo.ts 的 getSiteUrl 同口径；静态产物与运行时 URL 必须一致。 */
export function getSiteUrlFromEnv(env = process.env) {
  const raw = String(env.SITE_URL || env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/+$/, '');
  return raw || DEFAULT_SITE_URL;
}

function parseDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeListData(payload) {
  const data = payload?.data;
  if (Array.isArray(data)) {
    return { list: data };
  }
  if (data && typeof data === 'object') {
    return {
      list: Array.isArray(data.list) ? data.list : [],
      total: Number(data.total || 0),
      page: Number(data.page || 1),
      pageSize: Number(data.pageSize || 0),
    };
  }
  return { list: [] };
}

function toGameEntry(item, absolute) {
  const pkg = String(item?.pkg || '').trim();
  if (!pkg) return null;
  const isDeleted = item?.is_deleted === true || Number(item?.is_deleted || 0) === 1;
  if (isDeleted) return null;
  if (item?.status !== undefined && ![0, 1].includes(Number(item.status))) return null;

  const lastmod = parseDate(item.updated_at) || parseDate(item.latest_at) || parseDate(item.created_at);
  return {
    url: absolute(`/app/${encodeURIComponent(pkg)}`),
    lastModified: lastmod,
    changeFrequency: 'daily',
    priority: 0.8,
  };
}

function toCommunityPostEntry(item, absolute) {
  const id = String(item?._id || '').trim();
  if (!id) return null;

  const isDeleted = item?.is_deleted === true || Number(item?.is_deleted || 0) === 1;
  if (isDeleted) return null;
  if (item?.status !== undefined && Number(item.status) !== 1) return null;
  const postType = String(item?.post_type || '').trim();
  if (postType && !['news', 'post'].includes(postType)) return null;

  const lastmod = parseDate(item.updated_at) || parseDate(item.last_commented_at) || parseDate(item.publish_at);
  return {
    url: absolute(`/community/post/${encodeURIComponent(id)}`),
    lastModified: lastmod,
    changeFrequency: 'daily',
    priority: 0.6,
  };
}

function toAlbumEntry(item, absolute) {
  const id = String(item?._id || '').trim();
  if (!id) return null;

  const isDeleted = item?.is_deleted === true || Number(item?.is_deleted || 0) === 1;
  if (isDeleted) return null;
  if (item?.is_active === false) return null;

  return {
    url: absolute(`/albums/${encodeURIComponent(id)}`),
    lastModified: parseDate(item.updated_at) || parseDate(item.created_at),
    changeFrequency: 'daily',
    priority: 0.75,
  };
}

function toTopicEntry(item, absolute) {
  const id = String(item?._id || '').trim();
  const slug = String(item?.slug || '').trim();
  const pathTarget = slug || id;
  if (!pathTarget) return null;

  const isDeleted = item?.is_deleted === true || Number(item?.is_deleted || 0) === 1;
  if (isDeleted) return null;
  if (item?.status && String(item.status).trim().toLowerCase() !== 'active') return null;

  const postCount = Number(item?.post_count || 0);
  const followersCount = Number(item?.followers_count || 0);
  if (postCount <= 0 && followersCount <= 0) return null;

  const lastmod = parseDate(item?.last_activity_at) || parseDate(item?.updated_at) || parseDate(item?.created_at);

  return {
    url: absolute(`/community/topic/${encodeURIComponent(pathTarget)}`),
    lastModified: lastmod,
    changeFrequency: 'daily',
    priority: 0.58,
  };
}

function toUserEntry(item, absolute) {
  const username = String(item?.username || '').trim();
  const id = String(item?._id || '').trim();

  // 邮箱型用户名属于 PII，且这类主页通常是薄页面；即使认证过也不进 sitemap。
  if (username.includes('@')) return null;

  const pathTarget = username || id;
  if (!pathTarget) return null;

  const postCount = Number(item?.post_count || 0);
  // 只有可认证作者或至少 3 条公开动态的主页才值得收录。
  if (!item?.isVerified && postCount < 3) return null;

  return {
    url: absolute(`/u/${encodeURIComponent(pathTarget)}`),
    lastModified: parseDate(item?.updated_at) || parseDate(item?.created_at),
    changeFrequency: 'weekly',
    priority: item?.isVerified ? 0.52 : 0.46,
  };
}

/**
 * 建一个 sitemap 数据源。
 * @param {{
 *   apiBaseUrl?: string,
 *   siteUrl?: string,
 *   fetchImpl?: typeof fetch,
 *   revalidate?: number,          // 给了就走 Next 的 fetch 缓存（运行时路由）
 *   requestTimeoutMs?: number,    // 给了就给单次请求加超时（构建脚本）
 *   logger?: { warn: Function, log?: Function },
 * }} [options]
 */
export function createSitemapBuilder(options = {}) {
  const apiBaseUrl = String(options.apiBaseUrl ?? getServerApiBaseUrl()).replace(/\/+$/, '');
  const siteUrl = String(options.siteUrl ?? getSiteUrlFromEnv()).replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const revalidate = typeof options.revalidate === 'number' ? options.revalidate : undefined;
  const requestTimeoutMs = Number(options.requestTimeoutMs || 0);
  const logger = options.logger ?? console;
  // 审计接口单页实测 2~18 s，构建期并发抓 11 页时必须给足余量，否则会「半成功」出残缺数据。
  const retryCount = revalidate === undefined ? 1 : 0;

  // URL 拼接与 src/lib/seo.ts 的 absoluteUrl 同口径（路由侧会显式传入 getSiteUrl() 的结果）。
  const absolute = (path) => (path.startsWith('/') ? `${siteUrl}${path}` : `${siteUrl}/${path}`);

  async function fetchJsonOnce(path) {
    try {
      const init = {
        headers: {
          'x-tracking-skip': '1',
          'x-client-platform': 'web',
        },
      };
      if (revalidate !== undefined) {
        init.cache = 'force-cache';
        init.next = { revalidate };
      } else {
        init.cache = 'no-store';
        if (requestTimeoutMs > 0) init.signal = AbortSignal.timeout(requestTimeoutMs);
      }
      const res = await fetchImpl(`${apiBaseUrl}${path}`, init);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function fetchJson(path) {
    let json = await fetchJsonOnce(path);
    for (let attempt = 0; attempt < retryCount && !json; attempt += 1) {
      json = await fetchJsonOnce(path);
    }
    return json;
  }

  function extractList(json) {
    if (!json || (json.code !== 0 && json.code !== undefined)) return null;
    return normalizeListData(json);
  }

  // 先探测第一页，再按接口返回的 total 并发拉取其余页，避免长链式串行等待。
  // complete=false 表示至少一页失败：调用方据此决定「不要拿残缺结果覆盖静态文件」。
  async function fetchPaged(fetchPage, maxPages) {
    const first = await fetchPage(1);
    if (!first || !Array.isArray(first.list)) return { items: [], complete: false };
    if (first.list.length === 0) return { items: [], complete: true };
    const pageSize = Math.max(first.pageSize || first.list.length, 1);
    const totalPages = Math.min(maxPages, first.total && first.total > 0 ? Math.ceil(first.total / pageSize) : 1);
    if (totalPages === 1) return { items: first.list, complete: true };
    const rest = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2)));
    const complete = rest.every((page) => page && Array.isArray(page.list));
    return {
      items: [...first.list, ...rest.flatMap((page) => (page?.list && Array.isArray(page.list) ? page.list : []))],
      complete,
    };
  }

  async function fetchPagedJson(pathForPage, maxPages) {
    return fetchPaged(async (page) => extractList(await fetchJson(pathForPage(page))), maxPages);
  }

  function collect(items, toEntry, seen, target) {
    for (const item of items) {
      const entry = toEntry(item, absolute);
      if (!entry) continue;
      if (seen.has(entry.url)) continue;
      seen.add(entry.url);
      target.push(entry);
    }
  }

  async function fetchGamesFromSeoEndpoint() {
    const result = [];
    const seen = new Set();
    const { items, complete } = await fetchPagedJson(
      (page) => `/seo/sitemap/games?page=${page}&pageSize=${SITEMAP_PAGE_SIZE}`,
      SITEMAP_MAX_PAGES,
    );
    collect(items, toGameEntry, seen, result);
    return { entries: result, rawCount: items.length, complete };
  }

  async function fetchCommunityPostsFromFeed() {
    const result = [];
    const seen = new Set();
    const pages = await Promise.all(
      ['news', 'post'].map((postType) => fetchPagedJson(
        (page) => `/content/feed?page=${page}&pageSize=${SITEMAP_PAGE_SIZE}&post_type=${postType}&sort=latest&view=card`,
        NEWS_SITEMAP_MAX_PAGES,
      )),
    );
    for (const page of pages) collect(page.items, toCommunityPostEntry, seen, result);
    return { entries: result, complete: pages.every((page) => page.complete) };
  }

  async function fetchIndexableGamePackages() {
    const result = new Set();
    const first = extractList(await fetchJson(`/seo/audit/games?page=1&pageSize=${SITEMAP_PAGE_SIZE}`));
    if (!first) return { packages: null, complete: false };
    const pageSize = Math.max(first.pageSize || first.list?.length || 1, 1);
    const totalPages = Math.min(SITEMAP_MAX_PAGES, first.total ? Math.ceil(first.total / pageSize) : 1);
    const pages = totalPages > 1
      ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => fetchJson(`/seo/audit/games?page=${index + 2}&pageSize=${SITEMAP_PAGE_SIZE}`)))
      : [];
    const collectPage = (data) => {
      for (const item of data.list || []) {
        const pkg = String(item?.pkg || '').trim();
        if (pkg && item?.quality?.indexable === true) result.add(pkg);
      }
    };
    collectPage(first);
    for (const json of pages) {
      const data = extractList(json);
      // 任一页失败就整体放弃过滤：宁可多收录，也不能因为审计接口抖动把游戏从 sitemap 里删掉。
      if (!data) return { packages: null, complete: false };
      collectPage(data);
    }
    return { packages: result, complete: true };
  }

  async function fetchHomeAlbumEntries() {
    const data = extractList(await fetchJson('/albums/home'));
    if (!data) return { entries: [], complete: false };
    const result = [];
    collect(Array.isArray(data.list) ? data.list : [], toAlbumEntry, new Set(), result);
    return { entries: result, complete: true };
  }

  async function fetchPagedSection(pathForPage, toEntry) {
    const result = [];
    const seen = new Set();
    let complete = true;
    for (let page = 1; page <= NEWS_SITEMAP_MAX_PAGES; page += 1) {
      const data = extractList(await fetchJson(pathForPage(page)));
      if (!data) {
        complete = false;
        break;
      }

      const safeList = Array.isArray(data.list) ? data.list : [];
      if (safeList.length === 0) break;

      collect(safeList, toEntry, seen, result);

      if (data.total && page * (data.pageSize || SITEMAP_PAGE_SIZE) >= data.total) break;
      if (safeList.length < SITEMAP_PAGE_SIZE) break;
    }
    return { entries: result, complete };
  }

  const fetchTopics = () => fetchPagedSection(
    (page) => `/content/topics/public?page=${page}&pageSize=${SITEMAP_PAGE_SIZE}&sort=activity`,
    toTopicEntry,
  );

  const fetchUsers = () => fetchPagedSection(
    (page) => `/seo/sitemap/users?page=${page}&pageSize=${SITEMAP_PAGE_SIZE}`,
    toUserEntry,
  );

  function buildStaticEntries() {
    return FALLBACK_STATIC_PATHS.map((path) => ({
      url: absolute(path),
      changeFrequency: path === '/' ? 'hourly' : 'daily',
      priority: path === '/' ? 1 : 0.7,
    }));
  }

  /**
   * 全量构建。任何单节接口失败都不会抛异常（与历史运行时行为一致）；
   * games 一节为空时视为 API 不可用，调用方据此决定是否落盘/降级。
   */
  async function buildEntries() {
    const [games, indexable] = await Promise.all([
      fetchGamesFromSeoEndpoint(),
      fetchIndexableGamePackages(),
    ]);
    const indexablePackages = indexable.packages;
    if (!indexable.complete) {
      logger.warn('[sitemap] 质量审计接口不完整，本次不做 indexable 过滤（宁可多收录，也不漏掉游戏）');
    }
    const gameEntries = indexablePackages
      ? games.entries.filter((entry) => {
          const pkg = decodeURIComponent(new URL(entry.url).pathname.split('/').pop() || '');
          return indexablePackages.has(pkg);
        })
      : games.entries;

    const [posts, albums, topics, users] = await Promise.all([
      fetchCommunityPostsFromFeed(),
      fetchHomeAlbumEntries(),
      fetchTopics(),
      fetchUsers(),
    ]);

    const entries = [
      ...buildStaticEntries(),
      ...albums.entries,
      ...gameEntries,
      ...topics.entries,
      ...users.entries,
      ...posts.entries,
    ];

    return {
      entries,
      // games 源为空说明 API 基本不可用，调用方不应拿这份残缺结果覆盖已有静态文件。
      apiReachable: games.rawCount > 0,
      // 任一节抓取不完整（分页失败/接口报错）时不得落盘成静态快照，否则会把 URL 静默删掉。
      complete:
        games.complete && posts.complete && albums.complete && topics.complete && users.complete && indexable.complete,
      stats: {
        staticPaths: FALLBACK_STATIC_PATHS.length,
        games: gameEntries.length,
        gamesSkippedByIndexable: games.entries.length - gameEntries.length,
        posts: posts.entries.length,
        albums: albums.entries.length,
        topics: topics.entries.length,
        users: users.entries.length,
      },
    };
  }

  /**
   * 线上游戏总数（一次轻量请求）。用于静态文件的新鲜度校验：
   * 完整「运行时会生成多少条」只能靠真正跑一遍生成才能得到，而静态文件的存在意义正是
   * 不跑那一遍；游戏是全站最大的一节（约六成条目）且只有它有权威的 total，所以用它做信号。
   */
  async function getLiveGameTotal() {
    const data = extractList(await fetchJson('/seo/sitemap/games?page=1&pageSize=1'));
    const total = Number(data?.total || 0);
    return total > 0 ? total : null;
  }

  return {
    absolute,
    buildEntries,
    buildStaticEntries,
    getLiveGameTotal,
    stats: { apiBaseUrl, siteUrl },
  };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatLastModified(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/**
 * 序列化为 sitemap XML。行格式与 Next 内置 MetadataRoute 的 sitemap 输出保持一致
 * （无缩进、priority 去掉多余小数位），避免切换实现后爬虫看到不同格式。
 */
export function serializeSitemapXml(entries, { buildTime } = {}) {
  const urls = Array.isArray(entries) ? entries : [];
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
  if (buildTime) {
    lines.push(`<!-- buildTime: ${buildTime} urlCount: ${urls.length} -->`);
  }
  lines.push(`<urlset xmlns="${SITEMAP_NS}">`);
  for (const entry of urls) {
    lines.push('<url>');
    lines.push(`<loc>${escapeXml(entry.url)}</loc>`);
    const lastmod = formatLastModified(entry.lastModified);
    if (lastmod) lines.push(`<lastmod>${lastmod}</lastmod>`);
    if (entry.changeFrequency) lines.push(`<changefreq>${escapeXml(entry.changeFrequency)}</changefreq>`);
    if (entry.priority !== undefined && entry.priority !== null) {
      const priority = Number(entry.priority);
      if (Number.isFinite(priority)) lines.push(`<priority>${priority}</priority>`);
    }
    lines.push('</url>');
  }
  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}

/** 读出静态文件的结构信息（不解析成对象，路由是原样直出）。 */
export function inspectStaticSitemap(xml) {
  const text = String(xml || '');
  const header = STATIC_SITEMAP_HEADER_PATTERN.exec(text);
  const locs = text.match(/<loc>/g);
  const gameLocs = text.match(/<loc>[^<]*\/app\//g);
  return {
    wellFormed: text.startsWith('<?xml') && text.includes('<urlset') && text.trimEnd().endsWith('</urlset>'),
    buildTime: header ? header[1] : null,
    declaredCount: header ? Number(header[2]) : null,
    locCount: locs ? locs.length : 0,
    gameLocCount: gameLocs ? gameLocs.length : 0,
  };
}

/** 校验静态文件自身自洽：结构完整 + 注释头 urlCount 与 <loc> 条目数一致。 */
export function validateStaticSitemap(meta) {
  if (!meta?.wellFormed) return { ok: false, reason: 'XML 结构不完整（缺 <?xml / <urlset> / </urlset>）' };
  if (!meta.buildTime || !Number.isFinite(meta.declaredCount)) {
    return { ok: false, reason: '缺少 buildTime/urlCount 注释头' };
  }
  if (meta.declaredCount <= 0) return { ok: false, reason: `注释 urlCount=${meta.declaredCount} 非法` };
  if (meta.declaredCount !== meta.locCount) {
    return { ok: false, reason: `注释 urlCount=${meta.declaredCount} 与文件条目数 ${meta.locCount} 不一致` };
  }
  return { ok: true, reason: `urlCount=${meta.locCount}（${meta.buildTime}）` };
}

/**
 * 新鲜度校验：静态文件里的游戏条目数与线上游戏总数偏差超过 limit 时判定过期。
 * 取不到线上总数时放行（静态文件是比「接口都挂了的运行时生成」更可靠的兜底）。
 */
export function checkStaticFreshness(meta, liveGameTotal, limit = STATIC_COUNT_DEVIATION_LIMIT) {
  if (!Number.isFinite(liveGameTotal) || liveGameTotal <= 0) {
    return { ok: true, skipped: true, reason: '未取到线上游戏总数，跳过新鲜度校验' };
  }
  const deviation = Math.abs(meta.gameLocCount - liveGameTotal) / liveGameTotal;
  const detail = {
    gameLocCount: meta.gameLocCount,
    liveGameTotal,
    deviation,
    limit,
    reason: `静态游戏条目 ${meta.gameLocCount} 条 vs 线上 ${liveGameTotal} 条，偏差 ${(deviation * 100).toFixed(1)}%`,
  };
  return deviation > limit ? { ok: false, ...detail } : { ok: true, ...detail };
}
