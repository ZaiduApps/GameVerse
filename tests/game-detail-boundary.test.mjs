import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(new URL('../src/app/app/[id]/page.tsx', import.meta.url), 'utf8');
const viewSource = await readFile(new URL('../src/app/app/[id]/GameDetailView.tsx', import.meta.url), 'utf8');

test('详情路由允许新包名按需生成并兼容页游 ObjectId', () => {
  assert.match(pageSource, /export const dynamicParams = true/);
  assert.match(pageSource, /isCanonicalPackageName\(input\) \|\| \/\^\[a-fA-F0-9\]\{24\}\$\//);
  assert.match(pageSource, /if \(!isValidGameIdentifier\(id\)\) \{\s*notFound\(\)/);
  assert.match(pageSource, /initialDataMode="full"/);
});

test('完整快照保留全文和扩展详情数据', () => {
  assert.match(pageSource, /return \{\s*\.\.\.gameData,/);
  assert.doesNotMatch(pageSource, /description:[^\n]*\.slice\(0, 1200\)/);
});

test('空推荐列表被视为权威结果且不触发补请求', () => {
  assert.match(
    viewSource,
    /initialDataMode === 'full' && Array\.isArray\(initialRecommendedGames\)/,
  );
  assert.doesNotMatch(
    viewSource,
    /initialRecommendedGames\.length > 0/,
  );
});
