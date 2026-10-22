import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SEO_TITLE_MAX,
  buildGameDetailSeo,
  normalizeSeoTemplateVersion,
  renderSeoTemplate,
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
  assert.ok(seo.title.endsWith(' | APKScc'), `缺少站点后缀：${seo.title}`);
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
  assert.ok(seo.title.endsWith(' | APKScc'), `缺少站点后缀：${seo.title}`);
  assert.match(seo.title, /\.\.\. \| APKScc$/);
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
  assert.ok(seo.title.endsWith(' | APKScc'));
  assert.ok(seo.title.length <= SEO_TITLE_MAX);
});

function longName() {
  return 'エグリプト 世界に一体だけのモンスターを育成して戦うRPG超長い名前';
}
