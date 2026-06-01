const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadRenderMarkdown() {
  const filePath = path.join(process.cwd(), 'src/lib/utils.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: (id) => {
      if (id === 'clsx') return { clsx: (...args) => args.filter(Boolean).join(' ') };
      if (id === 'tailwind-merge') return { twMerge: (v) => v };
      return require(id);
    },
  };

  vm.runInNewContext(compiled, sandbox);
  return moduleObj.exports.renderMarkdown;
}

function loadSeoUtils() {
  const filePath = path.join(process.cwd(), 'src/lib/seo.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require,
    process,
  };

  vm.runInNewContext(compiled, sandbox);
  return moduleObj.exports;
}

const renderMarkdown = loadRenderMarkdown();
const { sanitizeSeoText } = loadSeoUtils();

test('markdown regression: code + https link + hr', () => {
  const input = [
    '#### 四级标题',
    '',
    '```bash',
    'pnpm build',
    '```',
    '',
    '[官方文档](https://example.com/docs)',
    '',
    '---',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /<h4 class="text-lg font-semibold my-2">四级标题<\/h4>/);
  assert.match(html, /<pre class="bg-muted/);
  assert.match(html, /<a href="https:\/\/example.com\/docs"/);
  assert.match(html, /<hr class="my-6" \/>/);
});

test('markdown regression: defined-image html compatibility', () => {
  const input =
    '<p class="defined-image"><img src="https://uu.fp.ps.netease.com/file/678df67414dda3f1c43bc49bkJDlgYay06" /></p>';
  const html = renderMarkdown(input).__html;
  assert.match(html, /<img alt="内容配图" src="https:\/\/uu\.fp\.ps\.netease\.com\/file\/678df67414dda3f1c43bc49bkJDlgYay06"/);
});

test('markdown regression: acbox scheme mapped to safe trigger', () => {
  const input = '[在 App 打开](acbox://jump?type=post&id=123)';
  const html = renderMarkdown(input).__html;
  assert.match(html, /data-app-link="acbox:\/\/jump\?type=post&amp;id=123"/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test('markdown regression: uu-mobile scheme mapped to app prompt', () => {
  const input = '[帮助反馈](uu-mobile://user_feedback "点击前往【帮助和反馈】")';
  const html = renderMarkdown(input).__html;
  assert.match(html, /data-app-link="uu-mobile:\/\/user_feedback"/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test('markdown regression: non-whitelisted scheme rendered as text only', () => {
  const input = '[危险链接](javascript:evil)';
  const html = renderMarkdown(input).__html;
  assert.match(html, /\(javascript:evil\)/);
  assert.doesNotMatch(html, /href="javascript:/);
});

test('markdown regression: parting-line html compatibility', () => {
  const input = '<p class="parting-line"><span>历史问题分割线</span></p>';
  const html = renderMarkdown(input).__html;
  assert.match(html, /<hr class="my-6" \/>/);
  assert.match(html, /历史问题分割线/);
});

test('markdown regression: quote heading with paragraph', () => {
  const input = [
    '> ## Excerpt',
    '',
    '> 最近在寻找存储空间，3天前找到了 100GB 的免费 WebDAV 空间，',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /<blockquote class="border-l-4 border-primary[^\"]*"><h2 class="text-2xl font-bold my-1">Excerpt<\/h2><\/blockquote>/);
  assert.match(html, /<blockquote class="border-l-4 border-primary[^\"]*">最近在寻找存储空间，3天前找到了 100GB 的免费 WebDAV 空间，<\/blockquote>/);
});

test('markdown detail preset: upgraded section headings and unordered list items', () => {
  const input = [
    '## 功能概览',
    '',
    '- 第一条提示',
    '- 第二条提示',
    '',
    '> 引用说明',
    '',
    '```ts',
    'const value = 1;',
    '```',
    '',
    '![内容配图](https://example.com/image.png)',
    '',
    '| 名称 | 数值 |',
    '| --- | --- |',
    '| 评分 | 9 |',
    '',
    '---',
  ].join('\n');

  const html = renderMarkdown(input, { preset: 'detail' }).__html;
  assert.match(html, /<ul class="my-4 list-none space-y-3 pl-0">/);

  const h2Class = html.match(/<h2 class="([^"]+)">功能概览<\/h2>/)?.[1] || '';
  const listItemClass = html.match(/<li class="([^"]+)">第一条提示<\/li>/)?.[1] || '';
  const quoteClass = html.match(/<blockquote class="([^"]+)">引用说明<\/blockquote>/)?.[1] || '';
  const codeClass = html.match(/<pre class="([^"]+)"><code class="language-ts">/)?.[1] || '';
  const imageClass = html.match(/<img alt="内容配图" src="https:\/\/example\.com\/image\.png" class="([^"]+)" \/>/)?.[1] || '';
  const thClass = html.match(/<th class="([^"]+)">名称<\/th>/)?.[1] || '';
  const tdClass = html.match(/<td class="([^"]+)">评分<\/td>/)?.[1] || '';
  const hrClass = html.match(/<hr class="([^"]+)" \/>/)?.[1] || '';

  [h2Class, listItemClass, quoteClass, codeClass, imageClass, thClass, tdClass, hrClass].forEach((value) => {
    assert.ok(value.length > 0);
    assert.doesNotMatch(value, /(^| )border(?:$|-|\[)/);
    assert.doesNotMatch(value, /(^| )border-l(?:$|-|\[)/);
    assert.doesNotMatch(value, /(^| )border-t(?:$|-|\[)/);
  });

  assert.match(h2Class, /bg-gradient-to-r/);
  assert.match(h2Class, /before:bg-primary\/75/);
  assert.match(listItemClass, /bg-gradient-to-r/);
  assert.match(listItemClass, /after:bg-primary\/80/);
  assert.match(quoteClass, /before:bg-accent\/65/);
  assert.match(codeClass, /bg-muted\/70/);
  assert.match(imageClass, /bg-muted\/20/);
  assert.match(hrClass, /bg-gradient-to-r/);
});

test('seo text sanitizer: strips markdown links, images and bare urls', () => {
  const input = [
    '由《[灌籃高手](https://acg.gamer.com.tw/search.php?kw=test)》團隊打造',
    '',
    '[https://www.facebook.com/demo](https://www.facebook.com/demo)',
    '',
    '![image](https://example.com/image.png)',
    '',
    '- 首日登入即送',
  ].join('\n');

  const output = sanitizeSeoText(input);
  assert.equal(output, '由《灌籃高手》團隊打造 首日登入即送');
  assert.doesNotMatch(output, /https?:\/\//);
  assert.doesNotMatch(output, /\[[^\]]+\]\(/);
});

test('seo text sanitizer: repairs truncated markdown link fragments', () => {
  const input =
    '由《灌籃高手》團隊打造的 3v3 手機遊戲《[超時空街球對決](';

  const output = sanitizeSeoText(input);
  assert.equal(output, '由《灌籃高手》團隊打造的 3v3 手機遊戲《超時空街球對決');
  assert.doesNotMatch(output, /\[[^\]]+\]\(/);
});
