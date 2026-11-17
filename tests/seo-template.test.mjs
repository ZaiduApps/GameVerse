import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SEO_TITLE_MAX,
  buildGameDetailSeo,
  normalizeSeoTemplateVersion,
  prependAliasToDescription,
  renderSeoTemplate,
  resolveChineseAlias,
  stripSeoVersionMentions,
} from '../src/lib/seo.ts';

const TITLE_TEMPLATE = '{name} v{version} Download (Latest) for Android | {site_name}';
const DESC_TEMPLATE = 'Download {name} APK {version} for Android. {summary}';

test('空 alias 不留空括号，也不留多余空格', () => {
  const title = renderSeoTemplate('{name}（{alias}）APK下载 | {site_name}', {
    name: 'エグリプト',
    alias: '',
    site_name: 'APKScc',
  });
  assert.equal(title, 'エグリプト APK下载 | APKScc');
  assert.doesNotMatch(title, /[（(]\s*[）)]/);
  assert.doesNotMatch(title, /\s{2,}/);

  const latin = renderSeoTemplate('{name} ({alias}) APK', {
    name: 'Eggrypt',
    alias: '',
  });
  assert.equal(latin, 'Eggrypt APK');
  assert.doesNotMatch(latin, /\(\s*\)/);
});

test('有 alias 时正常渲染中文别名', () => {
  const title = renderSeoTemplate('{name}（{alias}）APK下载 | {site_name}', {
    name: 'Clash Royale',
    alias: '皇室战争',
    site_name: 'APKScc',
  });
  assert.equal(title, 'Clash Royale（皇室战争）APK下载 | APKScc');
});

test('版本归一化丢弃纯数字构建号，并消除重复 v 前缀', () => {
  assert.equal(normalizeSeoTemplateVersion('160402020'), '');
  assert.equal(normalizeSeoTemplateVersion('v160402020'), '');
  assert.equal(normalizeSeoTemplateVersion(''), '');
  assert.equal(normalizeSeoTemplateVersion('v1.136.0'), 'v1.136.0');
  assert.equal(normalizeSeoTemplateVersion('VV1.2'), 'v1.2');
  assert.equal(normalizeSeoTemplateVersion('1.136.0'), 'v1.136.0');

  const rendered = renderSeoTemplate(TITLE_TEMPLATE, {
    name: 'Clash Royale',
    version: normalizeSeoTemplateVersion('v1.136.0'),
    site_name: 'APKScc',
  });
  assert.match(rendered, / v1\.136\.0 /);
  assert.doesNotMatch(rendered, /vv/i);

  const dropped = renderSeoTemplate(TITLE_TEMPLATE, {
    name: 'Clash Royale',
    version: normalizeSeoTemplateVersion('160402020'),
    site_name: 'APKScc',
  });
  assert.doesNotMatch(dropped, /160402020/);
  assert.doesNotMatch(dropped, /\bv\b/);
  assert.doesNotMatch(dropped, /\s{2,}/);
});

test('构建号不进入 title / description', () => {
  const seo = buildGameDetailSeo(
    {
      name: 'Clash Royale',
      pkg: 'com.supercell.clashroyale',
      version: '160402020',
      aliases: ['皇室战争'],
      summary: '实时卡牌对战',
      titleTemplate: TITLE_TEMPLATE,
      descriptionTemplate: DESC_TEMPLATE,
    },
    'APKScc',
  );
  assert.doesNotMatch(seo.title, /160402020/);
  assert.doesNotMatch(seo.description, /160402020/);
  assert.ok(seo.title.endsWith('-APKScc'), `缺少站点后缀：${seo.title}`);
});

test('无人工标题时使用中文资源站默认标题并移除点分版本号', () => {
  const seo = buildGameDetailSeo(
    {
      name: '堡垒之夜',
      pkg: 'com.epicgames.fortnite',
      version: '42.40.0',
    },
    'APKScc',
  );

  assert.equal(seo.title, '堡垒之夜下载_堡垒之夜安卓版APK下载-APKScc');
  assert.doesNotMatch(seo.title, /42\.40\.0|\bv\b/i);
  assert.doesNotMatch(seo.description, /42\.40\.0|\bv\b/i);
});

test('旧模板仍被采用，但默认标题会移除版本号', () => {
  const seo = buildGameDetailSeo(
    {
      name: '堡垒之夜',
      pkg: 'com.epicgames.fortnite',
      version: '42.40.0',
      titleTemplate: '{name} v{version} Download (Latest) for Android',
      descriptionTemplate: 'Download {name} APK {version} for Android.',
    },
    'APKScc',
  );

  assert.equal(seo.title, '堡垒之夜 Download (Latest) for Android-APKScc');
  assert.doesNotMatch(seo.title, /42\.40\.0|\bv\b/i);
  assert.doesNotMatch(seo.description, /42\.40\.0|\bv\b/i);
});

test('网页游戏使用在线游玩默认标题', () => {
  const seo = buildGameDetailSeo(
    {
      name: '放置小游戏',
      type: 'web',
      version: '9.9.9',
    },
    'APKScc',
  );
  assert.equal(
    seo.title,
    '放置小游戏在线玩_放置小游戏网页版游戏入口-APKScc',
  );
});

test('人工标题保持原样，不经过默认标题规范化', () => {
  const seo = buildGameDetailSeo(
    {
      name: '堡垒之夜',
      manualTitle: '堡垒之夜 42.40.0 国际服下载',
    },
    'APKScc',
  );
  assert.equal(seo.title, '堡垒之夜 42.40.0 国际服下载 | APKScc');
});

test('版本号清理不会误删普通文本', () => {
  assert.equal(
    stripSeoVersionMentions('堡垒之夜 v42.40.0 下载 2026 热门游戏'),
    '堡垒之夜 下载 2026 热门游戏',
  );
});

test('超长标题截断后仍保留站点后缀', () => {
  const longName = 'エグリプト 世界に一体だけのモンスターを育成して戦うRPG';
  const seo = buildGameDetailSeo(
    {
      name: longName,
      pkg: 'com.KyuzanInc.Eggrypt',
      version: '1.136.0',
      titleTemplate: TITLE_TEMPLATE,
      descriptionTemplate: DESC_TEMPLATE,
    },
    'APKScc',
  );
  assert.ok(seo.title.length <= SEO_TITLE_MAX, `标题 ${seo.title.length} 字符：${seo.title}`);
  assert.ok(seo.title.endsWith('-APKScc'), `缺少站点后缀：${seo.title}`);
  assert.match(seo.title, /\.\.\.-APKScc$/);
  assert.doesNotMatch(seo.title, /[（(]\s*[）)]/);
});

test('模板不含站点名时自动补后缀，且总长受控', () => {
  const seo = buildGameDetailSeo(
    {
      name: longName(),
      pkg: 'com.example.longname',
      version: '',
      titleTemplate: '{name} APK下载',
    },
    'APKScc',
  );
  assert.ok(seo.title.endsWith('-APKScc'));
  assert.ok(seo.title.length <= SEO_TITLE_MAX);
});

function longName() {
  return 'エグリプト 世界に一体だけのモンスターを育成して戦うRPG超長い名前';
}

// 线上实测（2026-11-17，apks.cc/app/com.colyinc.sparklinkstars）的真实别名顺序：
// 真正的中文名「迪士尼 星链 星星」排在最后，前面全是主名的复述（含只差一个尾部 APK 的）。
const SPARKLINK_ALIASES = [
  'ディズニー スパークリンク・スターズ',
  '迪士尼 Sparklink Stars',
  'Disney Sparklink Stars',
  'Disney Sparklink Stars APK',
  '迪士尼 Sparklink Stars APK',
  '迪士尼 星链 星星',
];
const SPARKLINK_NAME = '迪士尼 Sparklink Stars';

test('尾部只差裸 APK 的别名视为主名复述，命中后面的真正中文名', () => {
  assert.equal(
    resolveChineseAlias(SPARKLINK_ALIASES, SPARKLINK_NAME),
    '迪士尼 星链 星星',
  );
  // 全角括号里的英文名同样剥掉后再比较。
  assert.equal(
    resolveChineseAlias(['皇室战争（Clash Royale）'], '皇室战争'),
    '',
  );
  // APKS / XAPK / MOD 同属格式词，一并剥掉。
  assert.equal(resolveChineseAlias(['Foo Bar APKS'], 'Foo Bar'), '');
  assert.equal(resolveChineseAlias(['Foo Bar XAPK'], 'Foo Bar'), '');
  assert.equal(resolveChineseAlias(['Foo Bar MOD'], 'Foo Bar'), '');
  // 真正不同的中文别名不受影响。
  assert.equal(resolveChineseAlias(['星链星星'], 'Foo Bar'), '星链星星');
});

test('别名等于主名时正文首段不加「中文名」前缀', () => {
  const description = '提供迪士尼 Sparklink Stars 安卓版APK下载。';
  assert.equal(
    prependAliasToDescription(description, '迪士尼 Sparklink Stars APK', SPARKLINK_NAME),
    description,
  );
  // 真正的别名仍会前置一次，且原文已包含时不重复。
  assert.equal(
    prependAliasToDescription(description, '迪士尼 星链 星星', SPARKLINK_NAME),
    `中文名「迪士尼 星链 星星」。${description}`,
  );
  assert.equal(
    prependAliasToDescription('迪士尼 星链 星星 下载', '迪士尼 星链 星星', SPARKLINK_NAME),
    '迪士尼 星链 星星 下载',
  );
});
