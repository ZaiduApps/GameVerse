import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const SOURCE_ROOT = new URL('../src/', import.meta.url);
const ESLINT_CONFIG = new URL('../.eslintrc.json', import.meta.url);

async function collectTsxFiles(dirUrl) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const childUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dirUrl);
    if (entry.isDirectory()) {
      files.push(...(await collectTsxFiles(childUrl)));
    } else if (entry.name.endsWith('.tsx')) {
      files.push(childUrl);
    }
  }
  return files;
}

/** 取出一段 JSX 标签的完整文本（按花括号配对找到真正的结尾 `>`）。 */
function readOpeningTags(source, tagName) {
  const results = [];
  const pattern = new RegExp(`<${tagName}\\b`, 'g');
  let match;
  while ((match = pattern.exec(source))) {
    // 跳过正则 / 字符串里的 `<img`（例如 /<img[^>]+src=.../ 这类内容提取规则），
    // 它们不是 JSX 元素，也没有 alt 可言。
    const previousChar = source[match.index - 1];
    if (previousChar && '/\'"`\\'.includes(previousChar)) continue;
    let depth = 0;
    let index = match.index;
    while (index < source.length) {
      const char = source[index];
      if (char === '{') depth += 1;
      else if (char === '}') depth -= 1;
      else if (char === '>' && depth === 0) break;
      index += 1;
    }
    results.push({ tag: source.slice(match.index, index + 1), index: match.index });
  }
  return results;
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

test('所有图片（原生 img 与 next/image）都有非空 alt', async () => {
  const files = await collectTsxFiles(SOURCE_ROOT);
  const problems = [];

  for (const fileUrl of files) {
    const source = await readFile(fileUrl, 'utf8');
    for (const tagName of ['img', 'Image']) {
      for (const { tag, index } of readOpeningTags(source, tagName)) {
        const altMatch = tag.match(/\balt=\{?["'`]([^"'`]*)["'`]/);
        if (!altMatch) {
          // alt={someExpression} 视为动态值，交给 lint 的 jsx-a11y/alt-text 兜底。
          if (!/\balt=\{/.test(tag)) {
            const relative = path.relative(new URL('..', SOURCE_ROOT).pathname, new URL(fileUrl).pathname);
            problems.push(`${relative}:${lineOf(source, index)} <${tagName}> 缺少 alt`);
          }
          continue;
        }
        if (!altMatch[1].trim()) {
          const relative = path.relative(new URL('..', SOURCE_ROOT).pathname, new URL(fileUrl).pathname);
          problems.push(`${relative}:${lineOf(source, index)} <${tagName}> alt 为空`);
        }
      }
    }
  }

  assert.deepEqual(problems, []);
});

test('lint 固化 jsx-a11y 规则，避免无障碍问题回流', async () => {
  const config = JSON.parse(await readFile(ESLINT_CONFIG, 'utf8'));
  const rules = config.rules || {};

  for (const rule of [
    'jsx-a11y/alt-text',
    'jsx-a11y/aria-props',
    'jsx-a11y/aria-role',
    'jsx-a11y/role-has-required-aria-props',
  ]) {
    assert.ok(rules[rule], `缺少 ESLint 规则 ${rule}`);
  }

  // 共享的举报/下载失败组件必须给出可读的无障碍名称，而不是只有图标。
  const reportDialog = await readFile(new URL('../src/components/content-report-dialog.tsx', import.meta.url), 'utf8');
  assert.match(reportDialog, /aria-label=\{`举报该\$\{targetLabel\}`\}/);
  const downloadNotice = await readFile(
    new URL('../src/app/app/[id]/DownloadErrorNotice.client.tsx', import.meta.url),
    'utf8',
  );
  assert.match(downloadNotice, /role="alert"/);
});
