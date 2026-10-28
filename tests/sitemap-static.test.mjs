/**
 * 静态 sitemap 的产物约定与校验逻辑（src/lib/sitemap-core.mjs）。
 *
 * 覆盖三类风险：
 *   1. 序列化格式与注释头（写入端）
 *   2. 静态文件自洽校验（运行时拒绝损坏产物并降级）
 *   3. 新鲜度阈值（静态文件过期判定）
 *   4. 构建/运行时共用同一套抓取与过滤规则（防两套实现漂移）
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STATIC_COUNT_DEVIATION_LIMIT,
  applyGameLastmodPatch,
  checkStaticFreshness,
  createSitemapBuilder,
  getServerApiBaseUrl,
  getSiteUrlFromEnv,
  inspectStaticSitemap,
  serializeSitemapXml,
  validateStaticSitemap,
} from '../src/lib/sitemap-core.mjs';

const ENTRIES = [
  { url: 'https://apks.cc/', changeFrequency: 'hourly', priority: 1 },
  {
    url: 'https://apks.cc/app/com.example.game',
    lastModified: new Date('2026-10-20T11:13:00.000Z'),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  { url: 'https://apks.cc/community?from=sitemap', changeFrequency: 'daily', priority: 0.6 },
];

test('serializeSitemapXml: 注释头 urlCount 等于 <loc> 条目数', () => {
  const xml = serializeSitemapXml(ENTRIES, { buildTime: '2026-10-23T00:00:00.000Z' });
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n/);
  assert.match(xml, /<!-- buildTime: 2026-10-23T00:00:00\.000Z urlCount: 3 -->/);
  assert.equal((xml.match(/<loc>/g) || []).length, 3);
  assert.ok(xml.trimEnd().endsWith('</urlset>'));
  const meta = inspectStaticSitemap(xml);
  assert.deepEqual(validateStaticSitemap(meta), { ok: true, reason: 'urlCount=3（2026-10-23T00:00:00.000Z）' });
});

test('serializeSitemapXml: 保留 lastmod/changefreq/priority 且优先级去掉多余小数位', () => {
  const xml = serializeSitemapXml(ENTRIES, { buildTime: '2026-10-23T00:00:00.000Z' });
  assert.ok(xml.includes('<lastmod>2026-10-20T11:13:00.000Z</lastmod>'));
  assert.ok(xml.includes('<changefreq>hourly</changefreq>'));
  assert.ok(xml.includes('<priority>1</priority>'));
  assert.ok(xml.includes('<priority>0.8</priority>'));
});

test('serializeSitemapXml: URL 里的 & 被转义，避免产物本身就是坏 XML', () => {
  const xml = serializeSitemapXml([{ url: 'https://apks.cc/community?from=sitemap&x=1' }]);
  assert.ok(xml.includes('<loc>https://apks.cc/community?from=sitemap&amp;x=1</loc>'));
});

test('validateStaticSitemap: 注释 urlCount 与条目数不一致时判定损坏', () => {
  const xml = serializeSitemapXml(ENTRIES, { buildTime: '2026-10-23T00:00:00.000Z' });
  const corrupted = xml.replace(/urlCount: 3/, 'urlCount: 99');
  const result = validateStaticSitemap(inspectStaticSitemap(corrupted));
  assert.equal(result.ok, false);
  assert.match(result.reason, /urlCount=99 与文件条目数 3 不一致/);
});

test('validateStaticSitemap: 缺注释头 / 结构不完整 / 空产物都被拒绝', () => {
  const noHeader = serializeSitemapXml(ENTRIES);
  assert.match(validateStaticSitemap(inspectStaticSitemap(noHeader)).reason, /缺少 buildTime\/urlCount 注释头/);

  const truncated = serializeSitemapXml(ENTRIES, { buildTime: '2026-10-23T00:00:00.000Z' }).replace('</urlset>', '');
  assert.match(validateStaticSitemap(inspectStaticSitemap(truncated)).reason, /XML 结构不完整/);

  const empty = serializeSitemapXml([], { buildTime: '2026-10-23T00:00:00.000Z' });
  assert.match(validateStaticSitemap(inspectStaticSitemap(empty)).reason, /urlCount=0 非法/);
});

test('checkStaticFreshness: 偏差超过 5% 判过期，5% 以内放行', () => {
  const meta = { gameLocCount: 5000 };
  assert.equal(checkStaticFreshness(meta, 5100).ok, true); // 5000 vs 5100 → 1.96%
  assert.equal(checkStaticFreshness(meta, 5300).ok, false); // 5000 vs 5300 → 5.66%
  assert.equal(STATIC_COUNT_DEVIATION_LIMIT, 0.05);
  // 取不到线上总数时放行（静态文件是接口不可用时的最后兜底）
  assert.deepEqual(checkStaticFreshness(meta, null).ok, true);
  assert.equal(checkStaticFreshness(meta, null).skipped, true);
});

test('createSitemapBuilder: 构建期与运行时产出同形条目（分页 + 过滤规则一致）', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    const parsed = new URL(url);
    const page = Number(parsed.searchParams.get('page') || 1);
    const pageSize = Number(parsed.searchParams.get('pageSize') || 500);
    const payload = (list, total) => new Response(JSON.stringify({ code: 0, data: { page, pageSize, total, list } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    if (parsed.pathname.endsWith('/seo/sitemap/games')) {
      return page === 1
        ? payload([{ pkg: 'com.a', status: 1, updated_at: '2026-10-01T00:00:00.000Z' }, { pkg: 'com.gone', status: 9 }], 2)
        : payload([], 2);
    }
    if (parsed.pathname.endsWith('/seo/audit/games')) {
      return payload([{ pkg: 'com.a', quality: { indexable: true } }], 1);
    }
    if (parsed.pathname.endsWith('/content/feed')) {
      return payload([{ _id: 'post1', post_type: 'post', status: 1, updated_at: '2026-10-02T00:00:00.000Z' }], 1);
    }
    if (parsed.pathname.endsWith('/albums/home')) {
      return payload([{ _id: 'album1', is_active: true }], 1);
    }
    if (parsed.pathname.endsWith('/content/topics/public')) {
      return payload([{ _id: 't1', slug: 'topic-slug', status: 'active', post_count: 3 }], 1);
    }
    if (parsed.pathname.endsWith('/seo/sitemap/users')) {
      return payload([{ _id: 'u1', username: 'alice', post_count: 5 }], 1);
    }
    return new Response('not found', { status: 404 });
  };

  const builder = createSitemapBuilder({ apiBaseUrl: 'https://api.test', siteUrl: 'https://apks.cc', fetchImpl });
  const { entries, apiReachable, complete, stats } = await builder.buildEntries();

  assert.equal(apiReachable, true);
  assert.equal(complete, true);
  assert.deepEqual(stats, {
    staticPaths: 5,
    games: 1,
    gamesSkippedByIndexable: 0,
    posts: 1,
    albums: 1,
    topics: 1,
    users: 1,
    // /search?q= 白名单这一节：本用例的 fetch 对 /search/global 一律 404，全部跳过，故为 0。
    search: 0,
  });
  const urls = entries.map((entry) => entry.url);
  assert.ok(urls.includes('https://apks.cc/app/com.a'));
  // 非 indexable 的游戏被过滤掉（与历史运行时行为一致）
  assert.equal(urls.includes('https://apks.cc/app/com.gone'), false);
  assert.ok(urls.includes('https://apks.cc/community/post/post1'));
  assert.ok(urls.includes('https://apks.cc/albums/album1'));
  assert.ok(urls.includes('https://apks.cc/community/topic/topic-slug'));
  assert.ok(urls.includes('https://apks.cc/u/alice'));
  assert.ok(calls.some((call) => call.includes('/seo/sitemap/games?page=1')));
});

test('createSitemapBuilder: 游戏目录为空时 apiReachable=false，调用方据此不覆盖旧产物', async () => {
  const fetchImpl = async () => new Response('{}', { status: 500 });
  const builder = createSitemapBuilder({ apiBaseUrl: 'https://api.test', siteUrl: 'https://apks.cc', fetchImpl });
  const { entries, apiReachable, complete } = await builder.buildEntries();
  assert.equal(apiReachable, false);
  assert.equal(complete, false);
  assert.equal(entries.length, 5); // 仅静态入口
});

const STATIC_FIXTURE = serializeSitemapXml([
  { url: 'https://apks.cc/', changeFrequency: 'hourly', priority: 1 },
  {
    url: 'https://apks.cc/app/com.droiddeck.launcher',
    lastModified: new Date('2026-10-24T08:46:24.007Z'),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: 'https://apks.cc/app/com.tencent.ig',
    lastModified: new Date('2026-10-23T02:00:00.000Z'),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: 'https://apks.cc/community/post/post1',
    lastModified: new Date('2026-10-22T00:00:00.000Z'),
    changeFrequency: 'daily',
    priority: 0.6,
  },
], { buildTime: '2026-10-25T00:00:00.000Z' });

test('applyGameLastmodPatch: 只覆写被更新过的游戏条目，其余原样保留', () => {
  const { xml, patched } = applyGameLastmodPatch(STATIC_FIXTURE, [
    { pkg: 'com.droiddeck.launcher', lastModified: new Date('2026-10-27T09:30:00.000Z') },
  ]);

  assert.equal(patched, 1);
  assert.ok(xml.includes('<loc>https://apks.cc/app/com.droiddeck.launcher</loc>\n<lastmod>2026-10-27T09:30:00.000Z</lastmod>'));
  // 其它条目（同页其它游戏、社区帖子、首页）一处都不能动
  assert.ok(xml.includes('<lastmod>2026-10-23T02:00:00.000Z</lastmod>'));
  assert.ok(xml.includes('<lastmod>2026-10-22T00:00:00.000Z</lastmod>'));
  assert.equal(xml.match(/<lastmod>/g).length, 3);
  // 产物仍然自洽（注释头条数不变、结构完整）
  assert.equal(validateStaticSitemap(inspectStaticSitemap(xml)).ok, true);
});

test('applyGameLastmodPatch: 没有 lastmod 的条目补一条，未知包名与空补丁集不改文件', () => {
  const withoutLastmod = serializeSitemapXml([
    { url: 'https://apks.cc/app/com.fresh.game', changeFrequency: 'daily', priority: 0.8 },
  ], { buildTime: '2026-10-25T00:00:00.000Z' });

  const inserted = applyGameLastmodPatch(withoutLastmod, [
    { pkg: 'com.fresh.game', lastModified: '2026-10-27T09:00:00.000Z' },
  ]);
  assert.equal(inserted.patched, 1);
  assert.ok(inserted.xml.includes('<loc>https://apks.cc/app/com.fresh.game</loc>\n<lastmod>2026-10-27T09:00:00.000Z</lastmod>'));
  assert.ok(inserted.xml.includes('<changefreq>daily</changefreq>'));

  assert.deepEqual(applyGameLastmodPatch(STATIC_FIXTURE, []), { xml: STATIC_FIXTURE, patched: 0 });
  // 包里没有的 URL / 非 /app/ 条目都不能被误伤
  assert.equal(applyGameLastmodPatch(STATIC_FIXTURE, [{ pkg: 'com.unknown.app', lastModified: new Date() }]).patched, 0);
});

test('getRecentGameUpdates: 只取 buildTime 之后的更新，窗口装不下时 complete=false', async () => {
  const fetchImpl = (rows) => async () => new Response(
    JSON.stringify({ code: 0, data: { page: 1, pageSize: 1000, total: 5152, list: rows } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
  const builder = (impl) => createSitemapBuilder({ apiBaseUrl: 'https://api.test', siteUrl: 'https://apks.cc', fetchImpl: impl });

  const partial = await builder(fetchImpl([
    { pkg: 'com.new.one', updated_at: '2026-10-27T09:00:00.000Z' },
    { pkg: 'com.old.one', updated_at: '2026-10-24T08:46:24.007Z' },
  ])).getRecentGameUpdates('2026-10-25T00:00:00.000Z');
  assert.equal(partial.total, 5152);
  assert.equal(partial.complete, true); // 已经越过 buildTime 边界
  assert.deepEqual(partial.games.map((game) => game.pkg), ['com.new.one']);

  const truncated = await builder(fetchImpl([
    { pkg: 'com.a', updated_at: '2026-10-27T09:00:00.000Z' },
    { pkg: 'com.b', updated_at: '2026-10-27T08:00:00.000Z' },
  ])).getRecentGameUpdates('2026-10-25T00:00:00.000Z', 2);
  assert.equal(truncated.complete, false); // 整页都在窗口内，可能还有更老的没抓到
  assert.equal(truncated.games.length, 2);

  const offline = await builder(async () => new Response('{}', { status: 500 }))
    .getRecentGameUpdates('2026-10-25T00:00:00.000Z');
  assert.deepEqual(offline, { total: null, games: [], complete: false });
});

test('静态直出链路：后台改 SEO 后重新生成，目标 URL 的 lastmod 从旧值变为新值', async () => {
  // 1) 静态产物是构建那一刻的快照：DroidDeck 的 lastmod 还停在旧值
  const buildTime = '2026-10-25T00:00:00.000Z';
  assert.match(STATIC_FIXTURE, /<loc>https:\/\/apks\.cc\/app\/com\.droiddeck\.launcher<\/loc>\n<lastmod>2026-10-24T08:46:24\.007Z<\/lastmod>/);

  // 2) 后台改 SEO → interface 侧 updateGame 写入新的 updated_at
  const updatedAt = '2026-10-27T13:05:00.000Z';
  const builder = createSitemapBuilder({
    apiBaseUrl: 'https://api.test',
    siteUrl: 'https://apks.cc',
    fetchImpl: async () => new Response(JSON.stringify({
      code: 0,
      data: {
        page: 1,
        pageSize: 1000,
        total: 2, // 与夹具里的两条 /app/ 条目一致，条数新鲜度校验照常通过
        list: [
          { pkg: 'com.droiddeck.launcher', updated_at: updatedAt },
          { pkg: 'com.tencent.ig', updated_at: '2026-10-23T02:00:00.000Z' },
        ],
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } }),
  });

  // 3) 运行时直出：新鲜度校验照旧，lastmod 用线上 updated_at 补丁覆写
  const meta = inspectStaticSitemap(STATIC_FIXTURE);
  const updates = await builder.getRecentGameUpdates(meta.buildTime);
  assert.equal(checkStaticFreshness(meta, updates.total).ok, true);
  const served = applyGameLastmodPatch(STATIC_FIXTURE, updates.games);

  assert.equal(served.patched, 1);
  assert.match(served.xml, new RegExp(`<loc>https://apks\\.cc/app/com\\.droiddeck\\.launcher</loc>\\n<lastmod>${updatedAt.replace(/\./g, '\\.')}</lastmod>`));
  assert.doesNotMatch(served.xml, /com\.droiddeck\.launcher<\/loc>\n<lastmod>2026-10-24T08:46:24\.007Z/);
  // 本次没改的游戏保持原值（lastmod 不能靠「当前时间」糊弄）
  assert.match(served.xml, /com\.tencent\.ig<\/loc>\n<lastmod>2026-10-23T02:00:00\.000Z/);
});

test('getRecentGameUpdates: 补丁查询绕过 Next 数据缓存，写入后立刻可见（regression）', async () => {
  // 生产缺陷复现：route 以 revalidate=1800 调 createSitemapBuilder，首次请求把「写入前」的
  // API 响应钉进 Next fetch 缓存；补丁查询若也走 force-cache，缓存纪元内恒返回旧快照。
  // stub 用 init.cache 模拟 Next 缓存语义：force-cache 只见到首次快照，no-store 见到实时数据。
  const beforeWrite = [{ pkg: 'com.old.one', updated_at: '2026-10-24T08:46:24.007Z' }];
  const afterWrite = [
    { pkg: 'com.fresh.one', updated_at: '2026-10-27T16:28:22.606Z' },
    { pkg: 'com.old.one', updated_at: '2026-10-24T08:46:24.007Z' },
  ];
  let hasWriteHappened = false;
  const fetchImpl = (url, init = {}) => new Response(
    JSON.stringify({
      code: 0,
      data: { page: 1, pageSize: 1000, total: 5152, list: init.cache === 'no-store' && hasWriteHappened ? afterWrite : beforeWrite },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
  const builder = createSitemapBuilder({
    apiBaseUrl: 'https://api.test',
    siteUrl: 'https://apks.cc',
    fetchImpl,
    revalidate: 1800,
  });

  const first = await builder.getRecentGameUpdates('2026-10-25T00:00:00.000Z');
  assert.deepEqual(first.games.map((game) => game.pkg), []); // 写入前：补丁 0 条

  hasWriteHappened = true; // 后台写入 updated_at=2026-10-27T16:28:22.606Z
  const second = await builder.getRecentGameUpdates('2026-10-25T00:00:00.000Z');
  assert.deepEqual(second.games.map((game) => game.pkg), ['com.fresh.one']); // 不再命中旧缓存
});

test('getServerApiBaseUrl / getSiteUrlFromEnv: 与运行时 env 口径一致', () => {
  assert.equal(getServerApiBaseUrl({ API_BASE_URL: 'http://127.0.0.1:9527/' }), 'http://127.0.0.1:9527');
  assert.equal(getServerApiBaseUrl({ APP_ENV: 'production' }), 'https://api.hk.apks.cc');
  assert.equal(getServerApiBaseUrl({ APP_ENV: 'development' }), 'http://127.0.0.1:9527');
  assert.equal(getSiteUrlFromEnv({ SITE_URL: 'https://apks.cc/' }), 'https://apks.cc');
  assert.equal(getSiteUrlFromEnv({}), 'https://apks.cc');
});
