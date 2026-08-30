import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const seoSource = await readFile(new URL('../src/lib/seo.ts', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../src/app/app/[id]/page.tsx', import.meta.url), 'utf8');

test('详情页使用统一稳定 SEO 生成器', () => {
  assert.match(seoSource, /export function buildGameDetailSeo/);
  assert.match(pageSource, /buildGameDetailSeo\(/g);
  assert.doesNotMatch(pageSource, /当前版本 \$\{normalizedVersion\}/);
  assert.doesNotMatch(pageSource, /安装包大小 \$\{formatFileSize\(game\.file_size\)\}/);
  assert.doesNotMatch(pageSource, /包含 \$\{screenshotCount\} 张截图/);
});

test('自动 SEO 文案覆盖下载意图，手工字段保持优先', () => {
  assert.match(seoSource, /const manualDescription = sanitizeSeoText\(input\.manualDescription\)/);
  assert.match(seoSource, /下载\$\{name\}安卓版 APK/);
  assert.match(seoSource, /安卓游戏下载/);
  assert.match(seoSource, /manualKeywords/);
  assert.match(seoSource, /titleCore\.includes\(normalizedSiteName\)/);
});
