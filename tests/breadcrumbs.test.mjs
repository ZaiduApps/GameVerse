import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BREADCRUMB_ROOT,
  buildBreadcrumbJsonLd,
  getBreadcrumbSiteUrl,
  toBreadcrumbJsonLdScript,
} from '../src/lib/breadcrumbs.ts';
import { absoluteUrl } from '../src/lib/seo.ts';

// 固定站点 URL 环境，保证与 absoluteUrl 的对照断言不随机器环境漂移。
delete process.env.NEXT_PUBLIC_SITE_URL;
delete process.env.SITE_URL;

const DEFAULT_SITE_URL = 'https://apks.cc';

test('默认站点 URL 与 seo.ts 的 absoluteUrl 同源', () => {
  assert.equal(getBreadcrumbSiteUrl(), DEFAULT_SITE_URL);
  assert.equal(getBreadcrumbSiteUrl(), absoluteUrl('/').replace(/\/$/, ''));
});

test('JSON-LD 结构：position 连续、item 绝对 URL、最后一项也带 item', () => {
  const jsonLd = buildBreadcrumbJsonLd([
    BREADCRUMB_ROOT,
    { name: '游戏库', href: '/app' },
    { name: '射击', href: '/app?category=%E5%B0%84%E5%87%BB' },
    { name: 'PUBG MOBILE' },
  ]);

  assert.equal(jsonLd['@context'], 'https://schema.org');
  assert.equal(jsonLd['@type'], 'BreadcrumbList');
  assert.deepEqual(
    jsonLd.itemListElement.map((item) => item.position),
    [1, 2, 3, 4],
  );
  assert.deepEqual(
    jsonLd.itemListElement.map((item) => item.name),
    ['首页', '游戏库', '射击', 'PUBG MOBILE'],
  );
  for (const item of jsonLd.itemListElement) {
    assert.equal(item['@type'], 'ListItem');
    assert.match(item.item, /^https:\/\/apks\.cc\//);
  }
  // 末项缺省 href：沿用上一项的绝对 URL，而不是留空。
  assert.equal(
    jsonLd.itemListElement[3].item,
    `${DEFAULT_SITE_URL}/app?category=%E5%B0%84%E5%87%BB`,
  );
});

test('href 缺省 / 单元素 / 空数组都有确定行为', () => {
  const firstOnly = buildBreadcrumbJsonLd([BREADCRUMB_ROOT]);
  assert.equal(firstOnly.itemListElement.length, 1);
  assert.equal(firstOnly.itemListElement[0].item, `${DEFAULT_SITE_URL}/`);

  const singleWithoutHref = buildBreadcrumbJsonLd([{ name: '仅标题' }]);
  assert.equal(singleWithoutHref.itemListElement[0].item, `${DEFAULT_SITE_URL}/`);

  const empty = buildBreadcrumbJsonLd([]);
  assert.deepEqual(empty.itemListElement, []);
  assert.equal(empty['@type'], 'BreadcrumbList');
});

test('带查询串的 href 原样保留，绝对 URL 与不带头斜杠的路径都归一化', () => {
  const jsonLd = buildBreadcrumbJsonLd(
    [
      { name: '首页', href: '/' },
      { name: '话题', href: '/community/topics?sort=new&q=mmo' },
      { name: '帖子', href: 'community/post/abc' },
      { name: '外链', href: 'https://example.com/page?a=1&b=2' },
    ],
    { siteUrl: 'https://staging.apks.cc///' },
  );

  assert.deepEqual(
    jsonLd.itemListElement.map((item) => item.item),
    [
      'https://staging.apks.cc/',
      'https://staging.apks.cc/community/topics?sort=new&q=mmo',
      'https://staging.apks.cc/community/post/abc',
      'https://example.com/page?a=1&b=2',
    ],
  );
});

test('同一路径与 absoluteUrl 生成的绝对 URL 一致', () => {
  const paths = ['/', '/app', '/app/com.tencent.ig', '/community/topics?sort=new'];
  const jsonLd = buildBreadcrumbJsonLd(paths.map((href) => ({ name: href, href })));
  assert.deepEqual(
    jsonLd.itemListElement.map((item) => item.item),
    paths.map((path) => absoluteUrl(path)),
  );
});

test('toBreadcrumbJsonLdScript 转义 <，防止 </script> 注入', () => {
  const jsonLd = buildBreadcrumbJsonLd([
    { name: '首页', href: '/' },
    { name: '</script><script>alert(1)</script>', href: '/x' },
  ]);
  const script = toBreadcrumbJsonLdScript(jsonLd);

  assert.equal(script.includes('</script>'), false);
  assert.equal(script.includes('<'), false);
  assert.equal(script.includes('\\u003c'), true);
  // 转义后仍可被 JSON.parse 还原成原始数据。
  assert.deepEqual(JSON.parse(script), jsonLd);
});

test('组件渲染所需的 JSON-LD 缺省参数可省略', () => {
  const jsonLd = buildBreadcrumbJsonLd([BREADCRUMB_ROOT, { name: '排行榜', href: '/rankings' }]);
  assert.equal(jsonLd.itemListElement[1].item, absoluteUrl('/rankings'));
});
