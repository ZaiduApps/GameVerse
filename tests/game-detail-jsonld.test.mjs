import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDetailJsonLd, schemaApplicationCategory } from '@/lib/game-detail-jsonld';
import { buildGameVariantRows } from '@/lib/game-detail-variants';

// 派发单 #80 验收 3：JSON-LD 必须能被解析，且必填字段只来自真实数据；
// 缺版本 / 缺评分 / 缺资源时对应键不出现，禁止编造。

function makeGame(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439011',
    pkg: 'com.example.game',
    name: 'Example Game',
    version: '1.2.3',
    file_size: 52428800,
    developer: 'Example Studio',
    type: 'game',
    tags: ['休闲'],
    detail_images: [],
    summary: '',
    description: '',
    metadata: {},
    ...overrides,
  };
}

// 与线上渲染一致：对象经过 JSON.stringify 写进 <script>，测试同样先序列化再解析。
function roundTrip(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildDetailLd(overrides = {}) {
  return buildDetailJsonLd({
    game: makeGame(),
    reviewSummary: { userAverage: 4.25, ratingCount: 12 },
    resources: [{ _id: 'r1', channel: { _id: 'ch1', name: 'Google Play', code: 'gp' }, version: '1.2.3', size: 52428800 }],
    description: '示例游戏介绍',
    aliases: ['示例游戏'],
    canonicalUrl: 'https://apks.cc/app/com.example.game',
    heroImage: 'https://apks.cc/img/icon.png',
    genre: '休闲',
    screenshots: ['https://apks.cc/img/1.png'],
    ...overrides,
  });
}

test('JSON-LD 可解析且 SoftwareApplication 必填字段齐全', () => {
  const parsed = roundTrip(buildDetailLd());
  assert.equal(parsed['@context'], 'https://schema.org');
  assert.equal(parsed['@type'], 'SoftwareApplication');
  assert.equal(parsed.name, 'Example Game');
  assert.equal(parsed.applicationCategory, 'GameApplication');
  assert.equal(parsed.operatingSystem, 'Android');
  assert.equal(parsed.softwareVersion, '1.2.3');
  assert.equal(parsed.url, 'https://apks.cc/app/com.example.game');
  assert.deepEqual(parsed.alternateName, ['示例游戏']);
});

test('offers 只在有真实资源时出现，免费写 price 0', () => {
  const withResources = roundTrip(buildDetailLd());
  assert.equal(withResources.offers['@type'], 'Offer');
  assert.equal(withResources.offers.price, '0');
  assert.equal(withResources.offers.priceCurrency, 'CNY');

  const withoutResources = roundTrip(buildDetailLd({ resources: [] }));
  assert.equal('offers' in withoutResources, false);
  assert.equal('potentialAction' in withoutResources, false);
});

test('aggregateRating 只在站点真实评分存在时出现且数值规整', () => {
  const rated = roundTrip(buildDetailLd()).aggregateRating;
  assert.equal(rated['@type'], 'AggregateRating');
  assert.equal(rated.ratingValue, 4.3);
  assert.equal(rated.ratingCount, 12);
  assert.equal(rated.bestRating, 5);
  assert.equal(rated.worstRating, 1);

  const unrated = roundTrip(buildDetailLd({ reviewSummary: null }));
  assert.equal('aggregateRating' in unrated, false);

  const zeroCount = roundTrip(buildDetailLd({ reviewSummary: { userAverage: 4.5, ratingCount: 0 } }));
  assert.equal('aggregateRating' in zeroCount, false);
});

test('缺版本 / 缺大小 / 缺开发者时对应键不出现，不写占位值', () => {
  const sparse = roundTrip(buildDetailLd({
    game: makeGame({ version: '', file_size: null, developer: '' }),
  }));
  assert.equal('softwareVersion' in sparse, false);
  assert.equal('fileSize' in sparse, false);
  assert.equal('publisher' in sparse, false);
  assert.ok(!JSON.stringify(sparse).includes('未知'));
});

test('Web 游戏不输出 Android 字段与 offers', () => {
  const web = roundTrip(buildDetailLd({ game: makeGame({ type: 'web' }) }));
  assert.equal(web.operatingSystem, 'Web Browser');
  assert.equal('softwareVersion' in web, false);
  assert.equal('fileSize' in web, false);
  assert.equal('offers' in web, false);
});

test('applicationCategory：工具类应用与游戏区分', () => {
  assert.equal(schemaApplicationCategory('app'), 'UtilitiesApplication');
  assert.equal(schemaApplicationCategory('tool'), 'UtilitiesApplication');
  assert.equal(schemaApplicationCategory('game'), 'GameApplication');
  assert.equal(schemaApplicationCategory(''), 'GameApplication');
});

const VALID_CHANNEL = { _id: 'ch-gp', name: 'Google Play', code: 'gp', icon: '' };

function makeResource(overrides = {}) {
  return {
    _id: 'res-1',
    channel_id: VALID_CHANNEL._id,
    channel: VALID_CHANNEL,
    version: '2.0.0',
    size: 10485760,
    ...overrides,
  };
}

test('变体表：真实渠道成行，版本 / 大小 / 链接齐全', () => {
  const rows = buildGameVariantRows(
    [makeResource()],
    'com.example.game',
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].channelName, 'Google Play');
  assert.equal(rows[0].version, '2.0.0');
  assert.equal(rows[0].sizeLabel, '10.00 MB');
  assert.equal(rows[0].href, '/app/com.example.game/download/ch-gp');
});

test('变体表：缺渠道 ID 或渠道名的资源整行不渲染', () => {
  const rows = buildGameVariantRows(
    [
      makeResource({ _id: 'res-no-id', channel: { ...VALID_CHANNEL, _id: '' }, channel_id: '' }),
      makeResource({ _id: 'res-no-name', channel: { ...VALID_CHANNEL, name: ' ' } }),
      makeResource({ _id: 'res-ok' }),
    ],
    'com.example.game',
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].channelName, 'Google Play');
});

test('变体表：缺版本 / 大小留空，不写「未知」', () => {
  const rows = buildGameVariantRows(
    [makeResource({ version: '  ', size: 0 })],
    'com.example.game',
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].version, '');
  assert.equal(rows[0].sizeLabel, '');
  assert.ok(!JSON.stringify(rows).includes('未知'));
});

test('变体表：同渠道同版本去重，不同版本各自成行', () => {
  const rows = buildGameVariantRows(
    [
      makeResource({ _id: 'res-a', version: '2.0.0' }),
      makeResource({ _id: 'res-b', version: '2.0.0' }),
      makeResource({ _id: 'res-c', version: '1.0.0' }),
    ],
    'com.example.game',
  );
  assert.deepEqual(rows.map((row) => row.version), ['2.0.0', '1.0.0']);
});

test('变体表：无包名或无资源时返回空，渠道 ID 回退 channel_id', () => {
  assert.deepEqual(buildGameVariantRows([makeResource()], ''), []);
  assert.deepEqual(buildGameVariantRows([], 'com.example.game'), []);
  assert.deepEqual(buildGameVariantRows(null, 'com.example.game'), []);

  const rows = buildGameVariantRows(
    [makeResource({ channel: { ...VALID_CHANNEL, _id: '' } })],
    'com.example.game',
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].channelId, VALID_CHANNEL._id);
});
