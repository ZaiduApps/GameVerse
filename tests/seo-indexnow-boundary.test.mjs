import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appShellSource = await readFile(
  new URL('../src/components/layout/AppShell.tsx', import.meta.url),
  'utf8',
);

test('页面访问不会自动触发 SEO URL 提交', () => {
  assert.doesNotMatch(appShellSource, /\/api\/seo\/push/);
  assert.doesNotMatch(appShellSource, /navigator\.sendBeacon/);
});
