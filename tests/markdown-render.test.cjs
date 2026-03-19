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

const renderMarkdown = loadRenderMarkdown();

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
  assert.match(html, /<img alt="" src="https:\/\/uu\.fp\.ps\.netease\.com\/file\/678df67414dda3f1c43bc49bkJDlgYay06"/);
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
