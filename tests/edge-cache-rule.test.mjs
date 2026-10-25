import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CACHE_RULE_BODY,
  CACHE_RULE_EXPRESSION,
  diffFingerprints,
  extractDetailFingerprint,
  validateRuleExpression,
} from '../scripts/lib/edge-cache-policy.mjs';

test('规则表达式只接管 /app/ 下的普通 HTML 请求', () => {
  assert.match(CACHE_RULE_EXPRESSION, /^\(starts_with\(http\.request\.uri\.path, "\/app\/"\)/);
  assert.match(CACHE_RULE_EXPRESSION, /and not http\.request\.uri\.query contains "_rsc="/);
  assert.deepEqual(validateRuleExpression(CACHE_RULE_EXPRESSION), []);
});

test('表达式缺任何一条边界都会被校验拦下', () => {
  assert.deepEqual(validateRuleExpression('(starts_with(http.request.uri.path, "/app/"))'), [
    '缺少 _rsc 查询串排除',
  ]);
  assert.deepEqual(
    validateRuleExpression('(starts_with(http.request.uri.path, "/app/") and http.request.uri.query contains "_rsc=")'),
    ['缺少 _rsc 查询串排除'],
  );
  assert.deepEqual(
    validateRuleExpression('(http.request.uri.path contains "/app/" and not http.request.uri.query contains "_rsc=")'),
    ['缺少 /app/ 路径前缀限定'],
  );
  assert.equal(validateRuleExpression('true').length, 2);
});

test('规则体：Eligible for cache，TTL 复用源站，不做自定义 cache key', () => {
  assert.equal(CACHE_RULE_BODY.action, 'set_cache_settings');
  assert.equal(CACHE_RULE_BODY.enabled, true);
  assert.equal(CACHE_RULE_BODY.expression, CACHE_RULE_EXPRESSION);
  assert.equal(CACHE_RULE_BODY.action_parameters.cache, true);
  assert.equal(CACHE_RULE_BODY.action_parameters.edge_ttl.mode, 'respect_origin');
  assert.equal(CACHE_RULE_BODY.action_parameters.browser_ttl.mode, 'respect_origin');
  // 不自定义 cache key：查询串参与缓存键，_rsc 请求由表达式排除。
  assert.equal('cache_key' in CACHE_RULE_BODY.action_parameters, false);
});

test('详情页指纹抽取：标题 / og:image / detail_images / JSON-LD screenshot', () => {
  const html = `<html><head><title>PUBG MOBILE 国际服下载 | APKScc</title>
<meta property="og:title" content="PUBG MOBILE 国际服"/>
<meta property="og:image" content="https://cdn.apks.cc/uploads/first.webp"/>
</head><body>
<script type="application/ld+json">{"screenshot":["https://cdn.apks.cc/uploads/shot1.webp"],"detail_images":["https://cdn.apks.cc/uploads/detail1.webp"]}</script>
</body></html>`;

  const fingerprint = extractDetailFingerprint(html);
  assert.equal(fingerprint.title, 'PUBG MOBILE 国际服下载 | APKScc');
  assert.equal(fingerprint.ogTitle, 'PUBG MOBILE 国际服');
  assert.equal(fingerprint.ogImage, 'https://cdn.apks.cc/uploads/first.webp');
  assert.equal(fingerprint.firstDetailImage, 'https://cdn.apks.cc/uploads/detail1.webp');
  assert.equal(fingerprint.firstScreenshot, 'https://cdn.apks.cc/uploads/shot1.webp');
});

test('指纹抽取兼容转义的 RSC payload 与缺字段页面', () => {
  const escaped = '<script>self.__next_f.push([1,"{\\"detail_images\\":[\\"https://cdn.apks.cc/a.webp\\"]}"])</script>';
  assert.equal(extractDetailFingerprint(escaped).firstDetailImage, 'https://cdn.apks.cc/a.webp');

  const empty = extractDetailFingerprint('<html><body>无数据</body></html>');
  assert.deepEqual(empty, {
    title: '',
    ogTitle: '',
    ogImage: '',
    firstDetailImage: '',
    firstScreenshot: '',
  });
  assert.deepEqual(extractDetailFingerprint(undefined).title, '');
});

test('两次响应指纹对比只报变化的字段', () => {
  const base = {
    title: 'A',
    ogTitle: 'A',
    ogImage: 'https://cdn/1.webp',
    firstDetailImage: '',
    firstScreenshot: 'https://cdn/2.webp',
  };
  assert.deepEqual(diffFingerprints(base, { ...base }), []);
  assert.deepEqual(diffFingerprints(base, { ...base, ogImage: 'https://cdn/9.webp' }), ['ogImage']);
  assert.deepEqual(diffFingerprints(base, { ...base, title: undefined }), ['title']);
});
