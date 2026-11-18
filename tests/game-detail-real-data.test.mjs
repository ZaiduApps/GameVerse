/**
 * 详情页只展示接口真实数据（2026-11-18 详情页审计）。
 *
 * 历史问题：Hero 指标条用 `RATING_FALLBACK_SCORE = 4.4` / `RATING_FALLBACK_COUNT = 124592`
 * 兜底，接口没有评分 / 评价数 / 下载量的游戏（开源启动器、GPL 软件）也会显示
 * 「4.4 分」「12.5w 条评价」「12.5w+ 下载」；「包含应用内购买」「国际服 / 需加速」对所有
 * 游戏写死，与 `metadata.region = '开源版'` 自相矛盾。这里锁定修复口径：
 * - 缺字段的指标格整格不渲染，不补示例数值；
 * - 评价条数缺失时 hint 为空串；
 * - 计数单位用万 / 亿，不用 w / k；
 * - 抓取源的英文分类名归一成中文分类名。
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

register('./helpers/src-resolve-hook.mjs', import.meta.url);

const { buildHeroMetrics, buildResourceLinks } = await import(
  '../src/app/app/[id]/game-detail-stitch-mapper.ts'
);
const { formatCompactCount, getGameTags, getPrimaryCategory } = await import(
  '../src/app/app/[id]/game-detail-presenter.ts'
);

const game = (overrides = {}) => ({
  _id: '65f000000000000000000001',
  name: '示例游戏',
  pkg: 'com.example.game',
  type: 'game',
  description: '',
  summary: '',
  download_count_show: '100,000,000+',
  star: 4.5,
  icon: '',
  detail_images: [],
  header_image: '',
  developer: '示例工作室',
  latest_at: '2026-01-01T00:00:00.000Z',
  release_at: null,
  tags: ['角色扮演'],
  version: '1.2.3',
  file_size: 1024,
  metadata: {},
  ...overrides,
});

const heroArgs = (overrides = {}, reviewSummary) => ({
  game: game(overrides),
  primaryCategory: '角色扮演',
  isWebGame: false,
  reviewSummary,
});

const metricKeys = (metrics) => metrics.map((item) => item.key);

test('Hero：star 与下载量都缺失时，评分格与下载格整格不出现', () => {
  const metrics = buildHeroMetrics(heroArgs({ star: null, download_count_show: null }));
  assert.deepEqual(metricKeys(metrics), ['category', 'platform']);
  assert.equal(
    metrics.some((item) => item.label === '综合评分' || item.label === '下载热度'),
    false,
  );
});

test('Hero：star 非法值（0 / 负数 / 非数字）同样不渲染评分格', () => {
  for (const star of [0, -1, 'abc', undefined, null, Number.NaN]) {
    const metrics = buildHeroMetrics(heroArgs({ star }));
    assert.equal(
      metrics.some((item) => item.key === 'rating'),
      false,
      `star=${String(star)} 不应生成评分格`,
    );
  }
});

test('Hero：rating_count 为 0 / null 时评分格 hint 为空串，不伪造条数', () => {
  for (const reviewSummary of [undefined, null, { ratingCount: 0 }, { ratingCount: null }]) {
    const metrics = buildHeroMetrics(heroArgs({ star: 3.32 }, reviewSummary));
    const rating = metrics.find((item) => item.key === 'rating');
    assert.ok(rating, `应保留评分格：${JSON.stringify(reviewSummary)}`);
    assert.equal(rating.value, '3.3');
    assert.equal(rating.hint, '');
  }
});

test('Hero：有真实评价条数时按中文单位展示', () => {
  const metrics = buildHeroMetrics(heroArgs({ star: 4.5 }, { ratingCount: 125000 }));
  const rating = metrics.find((item) => item.key === 'rating');
  assert.equal(rating.hint, '12.5万 条评价');
});

test('Hero：不再出现「包含应用内购买 / 需加速」这类无数据源断言', () => {
  const metrics = buildHeroMetrics(heroArgs({ star: 4.5 }, { ratingCount: 10 }));
  const platform = metrics.find((item) => item.key === 'platform');
  assert.equal(platform.hint, '');
  for (const metric of metrics) {
    assert.doesNotMatch(`${metric.value}${metric.hint}`, /需加速|应用内购买/);
  }
});

test('Hero：下载格取真实 download_count_show，缺失时整格不出现', () => {
  const withDownload = buildHeroMetrics(heroArgs({ download_count_show: '100,000,000+' }));
  const download = withDownload.find((item) => item.key === 'download');
  assert.equal(download.value, '100,000,000+');

  const withoutDownload = buildHeroMetrics(heroArgs({ download_count_show: '' }));
  assert.equal(
    withoutDownload.some((item) => item.key === 'download'),
    false,
  );
});

test('侧栏资源区：没有真实 cardConfig 条目时返回空数组（整块不渲染）', () => {
  assert.deepEqual(buildResourceLinks([]), []);
  // 没有标题也没有正文的条目同样不算真实条目。
  assert.deepEqual(buildResourceLinks([{ _id: 'x', content: {} }]), []);
});

test('formatCompactCount：万 / 亿 + 千分位，不再输出 w / k', () => {
  const cases = [
    [0, '0'],
    [null, '0'],
    [999, '999'],
    [1500, '1,500'],
    [9999, '9,999'],
    [10000, '1万'],
    [125000, '12.5万'],
    [100000000, '1亿'],
    [123456789, '1.2亿'],
  ];
  for (const [input, expected] of cases) {
    assert.equal(formatCompactCount(input), expected, `输入 ${String(input)}`);
  }
});

test('分类归一：英文分类名按别名映射回中文分类名', () => {
  const aliases = {
    Adventure: '冒险',
    adventure: '冒险',
    'ACTION RPG': '动作角色扮演',
    'Action-Adventure': '动作冒险',
    'Turn-based RPG': '回合制角色扮演',
    'Tower Defense': '塔防游戏',
  };
  for (const [raw, expected] of Object.entries(aliases)) {
    const tags = getGameTags(game({ tags: [raw] }));
    assert.deepEqual(tags, [expected], `${raw} 应归一为 ${expected}`);
    assert.equal(
      getPrimaryCategory(game({ tags: [raw] }), tags),
      expected,
      `主分类应输出中文名：${raw}`,
    );
  }
});

test('分类归一：getPrimaryCategory 收到原始英文 tag 时也返回中文名', () => {
  const raw = game({ tags: ['Adventure'] });
  assert.equal(getPrimaryCategory(raw, ['Adventure']), '冒险');
  assert.equal(getPrimaryCategory(raw, ['Adventure']), '冒险');
  assert.equal(getPrimaryCategory(raw, ['RPG']), '角色扮演');
});

test('分类归一：真标签（不在映射表里）保留原值，不被改写', () => {
  const tags = getGameTags(game({ tags: ['像素风', 'Adventure'] }));
  assert.deepEqual(tags, ['像素风', '冒险']);
  assert.equal(getPrimaryCategory(game({ tags: ['像素风'] }), ['像素风']), '像素风');
});
