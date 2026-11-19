/**
 * 静态 sitemap 的产物约定与校验逻辑（src/lib/sitemap-core.mjs）。
 *
 * 覆盖四类风险：
 *   1. 序列化格式与注释头（写入端）
 *   2. 静态文件自洽校验（运行时拒绝损坏产物并降级）
 *   3. 新鲜度阈值（静态文件过期判定）
 *   4. 构建/运行时共用同一套抓取与过滤规则（防两套实现漂移）
 *   5. 分片（#269）：priority + 长尾片的划分是纯函数、覆盖全集、可复算
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SITEMAP_MAX_SHARDS,
  SITEMAP_PRIORITY_FILE_NAME,
  SITEMAP_SHARD_SIZE,
  STATIC_COUNT_DEVIATION_LIMIT,
  STATIC_MAX_AGE_HOURS,
  applyGameLastmodPatch,
  buildShards,
  checkStaticAge,
  checkStaticFreshness,
  createSitemapBuilder,
  getServerApiBaseUrl,
  getSiteUrlFromEnv,
  hashPkgToShard,
  inspectStaticSitemap,
  parseSitemapShardParam,
  serializeSitemapIndexXml,
  serializeSitemapXml,
  sitemapShardFileName,
  sitemapShardPath,
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

test('checkStaticAge: 23h 新鲜 / 25h 过期 / 无 buildTime 过期（与审计脚本 MAX_AGE_HOURS 同口径）', () => {
  assert.equal(STATIC_MAX_AGE_HOURS, 24);

  const now = Date.parse('2026-11-19T20:00:00.000Z');
  const hoursAgo = (hours) => new Date(now - hours * 3_600_000).toISOString();

  // 23 小时前构建：放行，ageHours 可用于日志
  const fresh = checkStaticAge({ buildTime: hoursAgo(23) }, now);
  assert.equal(fresh.ok, true);
  assert.ok(Math.abs(fresh.ageHours - 23) < 1e-6, `ageHours=${fresh.ageHours}`);

  // 25 小时前构建：过期，reason 里带上限与年龄
  const stale = checkStaticAge({ buildTime: hoursAgo(25) }, now);
  assert.equal(stale.ok, false);
  assert.ok(Math.abs(stale.ageHours - 25) < 1e-6, `ageHours=${stale.ageHours}`);
  assert.match(stale.reason, /上限 24h/);

  // buildTime 缺失 / 不可解析：一律判过期，不猜
  for (const meta of [{ buildTime: null }, {}, { buildTime: '' }, { buildTime: 'not-a-date' }]) {
    const result = checkStaticAge(meta, now);
    assert.equal(result.ok, false, `应判过期：${JSON.stringify(meta)}`);
    assert.equal(result.ageHours, Number.POSITIVE_INFINITY);
    assert.match(result.reason, /buildTime/);
  }

  // 恰好 24h 边界不算过期（审计脚本用的是 ageHours <= MAX_AGE_HOURS）
  assert.equal(checkStaticAge({ buildTime: hoursAgo(24) }, now).ok, true);
  // 时钟偏差导致的「未来」buildTime 不算过期
  assert.equal(checkStaticAge({ buildTime: new Date(now + 3_600_000).toISOString() }, now).ok, true);

  // 真实链路口径：inspectStaticSitemap 解析出的 buildTime 能直接喂给年龄闸
  const xml = serializeSitemapXml(ENTRIES, { buildTime: hoursAgo(25) });
  assert.equal(checkStaticAge(inspectStaticSitemap(xml), now).ok, false);
  assert.equal(checkStaticAge(inspectStaticSitemap(serializeSitemapXml(ENTRIES, { buildTime: hoursAgo(1) })), now).ok, true);
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
  const { sections, apiReachable, complete, stats } = await builder.buildEntries();

  assert.equal(apiReachable, true);
  assert.equal(complete.main, true);
  assert.equal(complete.community, true);
  assert.deepEqual(stats, {
    staticMain: 4,
    staticCommunity: 2,
    // 本用例的 fetch 对 /seo/category-pages 一律 404，分类页整节跳过，故为 0。
    categoryPages: 0,
    games: 1,
    // 未发布（预约 0 / 下线 2 / 非 0-2 的脏值）一律剔除；本夹具的 com.gone 是 status=9。
    gamesSkippedUnpublished: 1,
    gamesSkippedByIndexable: 0,
    posts: 1,
    albums: 1,
    topics: 1,
  });
  const mainUrls = sections.main.map((entry) => entry.url);
  const communityUrls = sections.community.map((entry) => entry.url);
  assert.ok(mainUrls.includes('https://apks.cc/app/com.a'));
  // 非 indexable 的游戏被过滤掉（与历史运行时行为一致）
  assert.equal(mainUrls.includes('https://apks.cc/app/com.gone'), false);
  // #133：主 sitemap 不再收录 /search?q=，也不该再去打搜索接口。
  assert.equal(mainUrls.some((url) => url.includes('/search?q=')), false);
  assert.equal(calls.some((call) => call.includes('/search/global')), false);
  // 分层（#126）：main 只装详情页 + 分类/榜单/静态入口，社区页全部让路
  assert.equal(mainUrls.some((url) => url.includes('/community/')), false);
  assert.equal(mainUrls.some((url) => url.includes('/albums/')), false);
  assert.ok(communityUrls.includes('https://apks.cc/community/post/post1'));
  assert.ok(communityUrls.includes('https://apks.cc/albums/album1'));
  assert.ok(communityUrls.includes('https://apks.cc/community/topic/topic-slug'));
  assert.ok(communityUrls.includes('https://apks.cc/community'));
  assert.ok(communityUrls.includes('https://apks.cc/community/topics'));
  // 即使用户接口有数据，/u/ 也不进 sitemap（薄页 + UGC）
  assert.equal(calls.some((call) => call.includes('/seo/sitemap/users')), false);
  assert.equal(communityUrls.some((url) => url.includes('/u/')), false);
  assert.ok(calls.some((call) => call.includes('/seo/sitemap/games?page=1')));
});

test('createSitemapBuilder: 未发布游戏剔除、已发布保留，页面条目数不受影响', async () => {
  const listed = [
    { pkg: 'com.published.one', status: 1, updated_at: '2026-10-01T00:00:00.000Z' },
    // status=0 是「预约」，详情页 200 软 404
    { pkg: 'com.reserved.one', status: 0, updated_at: '2026-10-01T00:00:00.000Z' },
    // status=2 是「下线」
    { pkg: 'com.offline.one', status: 2, updated_at: '2026-10-01T00:00:00.000Z' },
    // 缺 status 的历史行按未发布处理，不猜成已发布
    { pkg: 'com.no-status.one', updated_at: '2026-10-01T00:00:00.000Z' },
    { pkg: 'com.published.two', status: 1, is_deleted: 1 },
  ];
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    const payload = (list) => new Response(JSON.stringify({ code: 0, data: { page: 1, pageSize: 500, total: list.length, list } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    if (parsed.pathname.endsWith('/seo/sitemap/games')) return payload(listed);
    if (parsed.pathname.endsWith('/seo/audit/games')) {
      return payload(listed.map((item) => ({ pkg: item.pkg, quality: { indexable: true } })));
    }
    if (parsed.pathname.endsWith('/content/feed')) return payload([]);
    if (parsed.pathname.endsWith('/albums/home')) return payload([]);
    if (parsed.pathname.endsWith('/content/topics/public')) return payload([]);
    return new Response('not found', { status: 404 });
  };

  const builder = createSitemapBuilder({ apiBaseUrl: 'https://api.test', siteUrl: 'https://apks.cc', fetchImpl });
  const { sections, stats } = await builder.buildEntries();
  const urls = sections.main.map((entry) => entry.url);

  assert.ok(urls.includes('https://apks.cc/app/com.published.one'));
  assert.ok(!urls.includes('https://apks.cc/app/com.reserved.one'));
  assert.ok(!urls.includes('https://apks.cc/app/com.offline.one'));
  assert.ok(!urls.includes('https://apks.cc/app/com.no-status.one'));
  // 已删除的行既不算已发布，也不重复计入「未发布剔除」
  assert.ok(!urls.includes('https://apks.cc/app/com.published.two'));
  assert.equal(stats.games, 1);
  assert.equal(stats.gamesSkippedUnpublished, 3);
  // 其它段落条数与历史一致（本夹具下 main 为 4 条静态入口 + 1 条游戏详情页）
  assert.equal(sections.main.length, 5);
});

test('createSitemapBuilder: 审计接口按 pageSize=200、并发≤2 分页，抓到的高质量 id 数量不变', async () => {
  // 1000 条游戏 → 5 页审计数据；并发探针记录峰值同时请求数。
  const games = Array.from({ length: 1000 }, (_, index) => ({
    pkg: `com.example.game${index}`,
    status: 1,
    updated_at: '2026-10-01T00:00:00.000Z',
  }));
  let inFlight = 0;
  let peak = 0;
  const auditRequests = [];
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    const payload = (list, page, pageSize, total) => new Response(
      JSON.stringify({ code: 0, data: { page, pageSize, total, list } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    if (parsed.pathname.endsWith('/seo/sitemap/games')) {
      const page = Number(parsed.searchParams.get('page') || 1);
      const pageSize = Number(parsed.searchParams.get('pageSize') || 500);
      return payload(games.slice((page - 1) * pageSize, page * pageSize), page, pageSize, games.length);
    }
    if (parsed.pathname.endsWith('/seo/audit/games')) {
      const page = Number(parsed.searchParams.get('page') || 1);
      const pageSize = Number(parsed.searchParams.get('pageSize') || 0);
      auditRequests.push({ page, pageSize });
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      const list = games.slice((page - 1) * pageSize, page * pageSize).map((item) => ({
        pkg: item.pkg,
        quality: { indexable: true },
      }));
      return payload(list, page, pageSize, games.length);
    }
    return payload([], 1, 500, 0);
  };

  const builder = createSitemapBuilder({ apiBaseUrl: 'https://api.test', siteUrl: 'https://apks.cc', fetchImpl });
  const { sections } = await builder.buildEntries();

  assert.ok(auditRequests.length >= 5);
  assert.ok(auditRequests.every((request) => request.pageSize === 200));
  assert.ok(peak <= 2, `审计接口并发峰值 ${peak} 超过 2`);
  // 页大小变小不影响总量：1000 个高质量包全部拿到，sitemap 里仍是 1000 条游戏
  assert.equal(sections.main.filter((entry) => entry.url.includes('/app/')).length, games.length);
});

test('createSitemapBuilder: 游戏目录为空时 apiReachable=false，调用方据此不覆盖旧产物', async () => {
  const fetchImpl = async () => new Response('{}', { status: 500 });
  const builder = createSitemapBuilder({ apiBaseUrl: 'https://api.test', siteUrl: 'https://apks.cc', fetchImpl });
  const { sections, apiReachable, complete } = await builder.buildEntries();
  assert.equal(apiReachable, false);
  assert.equal(complete.main, false);
  assert.equal(complete.community, false);
  assert.equal(sections.main.length, 4); // 仅 main 静态入口
  assert.equal(sections.community.length, 2); // 仅 community 静态入口
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

test('createSitemapBuilder: 分类页只收达到阈值的分类，且全部名字只请求一次', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    const parsed = new URL(url);
    const json = (payload) => new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    if (parsed.pathname.endsWith('/seo/category-pages')) {
      return json({
        code: 0,
        data: {
          list: [
            { name: '角色扮演', published: 1400, with_resources: 1341 },
            // 恰好等于阈值（12 / 8）也要收录，边界不能写成「大于」
            { name: 'MOBA', published: 12, with_resources: 8 },
            { name: '纸牌', published: 11, with_resources: 83 },
            { name: '音乐', published: 99, with_resources: 7 },
            // 映射表里没有的名字不生成 /category/ 条目
            { name: '不存在的分类', published: 999, with_resources: 999 },
          ],
          cached: false,
        },
      });
    }
    if (parsed.pathname.endsWith('/seo/sitemap/games')) {
      return json({ code: 0, data: { page: 1, pageSize: 500, total: 1, list: [{ pkg: 'com.a', status: 1 }] } });
    }
    return json({ code: 0, data: { page: 1, pageSize: 500, total: 0, list: [] } });
  };

  const builder = createSitemapBuilder({ apiBaseUrl: 'https://api.test', siteUrl: 'https://apks.cc', fetchImpl });
  const { sections, stats } = await builder.buildEntries();
  const urls = sections.main.map((entry) => entry.url);

  assert.ok(urls.includes('https://apks.cc/category/rpg'));
  assert.ok(urls.includes('https://apks.cc/category/moba'));
  assert.equal(urls.some((url) => url.includes('/category/card')), false); // 已发布 11 < 12
  assert.equal(urls.some((url) => url.includes('/category/music')), false); // 有资源 7 < 8
  assert.equal(stats.categoryPages, 2);

  const rpg = sections.main.find((entry) => entry.url === 'https://apks.cc/category/rpg');
  assert.equal(rpg.changeFrequency, 'weekly');
  assert.equal(rpg.priority, 0.7);

  // 23 个分类名一次请求拿全，不许 N 次
  const categoryCalls = calls.filter((call) => call.includes('/seo/category-pages'));
  assert.equal(categoryCalls.length, 1);
  const names = new URL(categoryCalls[0]).searchParams.get('names').split(',');
  assert.equal(names.length, 23);
  assert.ok(names.includes('角色扮演'));
  assert.ok(names.includes('MOBA'));
});

test('createSitemapBuilder: 分类计数接口报错只跳过分类页，整份 sitemap 照常生成', async () => {
  const warnings = [];
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    const json = (payload) => new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    if (parsed.pathname.endsWith('/seo/category-pages')) return json({ code: 502, message: 'upstream failed' });
    if (parsed.pathname.endsWith('/seo/sitemap/games')) {
      return json({ code: 0, data: { page: 1, pageSize: 500, total: 1, list: [{ pkg: 'com.a', status: 1 }] } });
    }
    if (parsed.pathname.endsWith('/seo/audit/games')) {
      return json({ code: 0, data: { page: 1, pageSize: 200, total: 1, list: [{ pkg: 'com.a', quality: { indexable: true } }] } });
    }
    return json({ code: 0, data: { page: 1, pageSize: 500, total: 0, list: [] } });
  };

  const builder = createSitemapBuilder({
    apiBaseUrl: 'https://api.test',
    siteUrl: 'https://apks.cc',
    fetchImpl,
    logger: { log: () => {}, warn: (...args) => warnings.push(args.join(' ')) },
  });
  const { sections, complete, stats } = await builder.buildEntries();
  const urls = sections.main.map((entry) => entry.url);

  assert.equal(stats.categoryPages, 0);
  assert.equal(urls.some((url) => url.includes('/category/')), false);
  // 分类页是加成，不能因为它把整份 sitemap 判成残缺（否则静态快照永远写不出来）
  assert.equal(complete.main, true);
  assert.ok(urls.includes('https://apks.cc/app/com.a'));
  assert.ok(warnings.some((line) => line.includes('[sitemap] 分类计数接口不可用')));
});

test('createSitemapBuilder: 社区节抓取失败只判 community 残缺，main 照常完整（#126 分层解耦）', async () => {
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    const payload = (list, total) => new Response(
      JSON.stringify({ code: 0, data: { page: 1, pageSize: 500, total: total ?? list.length, list } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    if (parsed.pathname.endsWith('/seo/sitemap/games')) return payload([{ pkg: 'com.a', status: 1 }]);
    if (parsed.pathname.endsWith('/seo/audit/games')) {
      return payload([{ pkg: 'com.a', quality: { indexable: true } }]);
    }
    // 社区三节全部 5xx：complete.community 必须为 false，但不得影响 main。
    if (parsed.pathname.endsWith('/content/feed')) return new Response('{}', { status: 500 });
    if (parsed.pathname.endsWith('/albums/home')) return new Response('{}', { status: 500 });
    if (parsed.pathname.endsWith('/content/topics/public')) return new Response('{}', { status: 500 });
    return payload([]);
  };

  const builder = createSitemapBuilder({ apiBaseUrl: 'https://api.test', siteUrl: 'https://apks.cc', fetchImpl });
  const { sections, apiReachable, complete } = await builder.buildEntries();

  assert.equal(apiReachable, true);
  assert.equal(complete.main, true);
  assert.equal(complete.community, false);
  assert.ok(sections.main.some((entry) => entry.url === 'https://apks.cc/app/com.a'));
  // community 残缺时只剩两条静态入口，调用方（构建脚本/运行时）据此放弃落盘该份。
  assert.equal(sections.community.length, 2);
});

// ---- 分片（#269）：priority + 长尾片 ----

const shardGames = (count) => Array.from({ length: count }, (_, index) => ({
  url: `https://apks.cc/app/com.example.game${index}`,
  // 时间递增：index 越大越新
  lastModified: new Date(Date.UTC(2026, 0, 1) + index * 60_000),
  changeFrequency: 'daily',
  priority: 0.8,
}));

const STATIC_TAIL = [
  { url: 'https://apks.cc/', changeFrequency: 'hourly', priority: 1 },
  { url: 'https://apks.cc/app', changeFrequency: 'daily', priority: 0.7 },
  { url: 'https://apks.cc/rankings', changeFrequency: 'daily', priority: 0.7 },
  { url: 'https://apks.cc/updates', changeFrequency: 'daily', priority: 0.7 },
  { url: 'https://apks.cc/category/rpg', changeFrequency: 'weekly', priority: 0.7 },
];

test('buildShards: priority 保留非详情页原顺序，详情页按 lastModified 倒序取前 N', () => {
  const entries = [...STATIC_TAIL, ...shardGames(10)];
  const { priority, tails } = buildShards(entries, { priorityCount: 3 });

  // 非详情页一条都不能落进长尾片：静态入口/分类页每次都必须整体提交。
  assert.deepEqual(priority.slice(0, STATIC_TAIL.length).map((entry) => entry.url), STATIC_TAIL.map((entry) => entry.url));
  const pickedGames = priority.slice(STATIC_TAIL.length).map((entry) => entry.url);
  assert.deepEqual(pickedGames, [
    'https://apks.cc/app/com.example.game9',
    'https://apks.cc/app/com.example.game8',
    'https://apks.cc/app/com.example.game7',
  ]);
  const tailUrls = [...tails.values()].flat().map((entry) => entry.url);
  assert.equal(tailUrls.length, 7);
  assert.equal(tailUrls.includes('https://apks.cc/app/com.example.game9'), false);
});

test('buildShards: 覆盖全集（priority + 所有长尾片 == 输入），无重复无丢失', () => {
  const entries = [...STATIC_TAIL, ...shardGames(4321)];
  const { priority, tails } = buildShards(entries, { priorityCount: 300, shardSize: 2000 });
  const all = [...priority, ...[...tails.values()].flat()].map((entry) => entry.url);

  assert.equal(all.length, entries.length);
  assert.equal(new Set(all).size, entries.length); // 无重复
  assert.deepEqual(new Set(all), new Set(entries.map((entry) => entry.url))); // 无丢失
  // 4321 - 300 = 4021 → ceil(4021/2000) = 3 片
  assert.equal(tails.size, 3);
  for (const shard of tails.values()) assert.ok(shard.length > 0, '空片会被 validateStaticSitemap 拒绝');
});

test('buildShards: 同一 pkg 的落片稳定（换数据量/换顺序不变，只随片数变化）', () => {
  const pkg = 'com.stable.game';
  const shardOf = (entries, options) => {
    const { tails } = buildShards(entries, options);
    for (const [index, list] of tails) {
      if (list.some((entry) => entry.url.endsWith(`/app/${pkg}`))) return index;
    }
    return null;
  };
  const base = [...STATIC_TAIL, ...shardGames(4000)];
  const withExtra = [...base, ...shardGames(200)]; // 数据量变化但片数不变
  const target = { url: `https://apks.cc/app/${pkg}`, lastModified: new Date('2026-01-01T00:00:00.000Z') };
  // 先确认片数一致（同片数下必须落同一片）
  const shardCountOf = (entries) => buildShards(entries, { priorityCount: 300, shardSize: 2000 }).tails.size;
  assert.equal(shardCountOf([...base, target]), shardCountOf([...withExtra, target]));
  assert.equal(shardOf([...base, target], { priorityCount: 300, shardSize: 2000 }), shardOf([...withExtra, target], { priorityCount: 300, shardSize: 2000 }));
  // 哈希本身就是纯函数：同输入同输出，且落片在合法区间内。
  assert.equal(hashPkgToShard(pkg, 3), hashPkgToShard(pkg, 3));
  assert.ok(hashPkgToShard(pkg, 3) >= 0 && hashPkgToShard(pkg, 3) < 3);
});

test('buildShards: 游戏数不足 priorityCount 时没有长尾片，不产生空文件', () => {
  const { priority, tails } = buildShards([...STATIC_TAIL, ...shardGames(5)], { priorityCount: 300 });
  assert.equal(priority.length, STATIC_TAIL.length + 5);
  assert.equal(tails.size, 0);
});

test('分片文件名 ↔ 线上 URL 映射唯一，参数非法/越界返回 null', () => {
  assert.equal(sitemapShardFileName(3), 'sitemap-tail-3.xml');
  assert.equal(sitemapShardPath(3), '/sitemap-tail/3');
  for (const shard of [1, 2, 17]) {
    const url = sitemapShardPath(shard);
    const parsed = parseSitemapShardParam(url.split('/').pop());
    assert.equal(parsed, shard);
    assert.equal(sitemapShardFileName(parsed), `sitemap-tail-${shard}.xml`);
  }
  // catch-all 路由拿到的永远是数组
  assert.equal(parseSitemapShardParam(['3']), 3);
  for (const bad of ['', '0', '-1', '01x', 'abc', '3.xml', '1/2', null, undefined, SITEMAP_MAX_SHARDS + 1, '9999']) {
    assert.equal(parseSitemapShardParam(bad), null, `应拒绝 ${JSON.stringify(bad)}`);
  }
});

test('serializeSitemapIndexXml + validateStaticSitemap：索引按 <sitemap> 条数校验', () => {
  const xml = serializeSitemapIndexXml([
    { url: 'https://apks.cc/sitemap-priority.xml' },
    { url: 'https://apks.cc/sitemap-tail/1' },
    { url: 'https://apks.cc/sitemap-community.xml' },
  ], { buildTime: '2026-11-19T00:00:00.000Z' });

  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n/);
  assert.match(xml, /<!-- buildTime: 2026-11-19T00:00:00\.000Z urlCount: 3 -->/);
  assert.equal((xml.match(/<sitemap>/g) || []).length, 3);
  assert.ok(xml.trimEnd().endsWith('</sitemapindex>'));
  assert.ok(xml.includes('<loc>https://apks.cc/sitemap-tail/1</loc>'));

  const meta = inspectStaticSitemap(xml);
  assert.equal(meta.kind, 'index');
  assert.deepEqual(validateStaticSitemap(meta), { ok: true, reason: 'urlCount=3（2026-11-19T00:00:00.000Z）' });

  // 注释头写错 uRlCount 时必须拒绝（索引的条目数是 <sitemap> 条数，不是 <loc> 总数）
  const corrupted = xml.replace('urlCount: 3', 'urlCount: 4');
  const result = validateStaticSitemap(inspectStaticSitemap(corrupted));
  assert.equal(result.ok, false);
  assert.match(result.reason, /urlCount=4 与文件条目数 3 不一致/);
});

test('buildShards 自检：每片序列化后注释 urlCount 等于 <loc> 条数（自检失败整批不落盘的前提）', () => {
  const entries = [...STATIC_TAIL, ...shardGames(4321)];
  const buildTime = '2026-11-19T00:00:00.000Z';
  const { priority, tails } = buildShards(entries, { priorityCount: 300, shardSize: 2000 });

  for (const [label, list] of [['priority', priority], ...[...tails.entries()].map(([index, list]) => [`tail-${index}`, list])]) {
    const xml = serializeSitemapXml(list, { buildTime });
    const meta = inspectStaticSitemap(xml);
    assert.equal(meta.kind, 'urlset');
    assert.equal((xml.match(/<loc>/g) || []).length, list.length, `${label} 的 <loc> 条数`);
    assert.deepEqual(validateStaticSitemap(meta), { ok: true, reason: `urlCount=${list.length}（${buildTime}）` });
  }
  assert.equal(SITEMAP_PRIORITY_FILE_NAME, 'sitemap-priority.xml');
  assert.equal(SITEMAP_SHARD_SIZE, 2000);
});
