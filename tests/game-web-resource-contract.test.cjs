const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const helperPath = path.join(root, 'src', 'lib', 'game-resource-type.ts');
const detailPath = path.join(root, 'src', 'app', 'app', '[id]', 'GameDetailView.tsx');
const typesPath = path.join(root, 'src', 'types', 'index.ts');

test('页游资源类型只进入 App 引导操作', () => {
  const helperSource = fs.readFileSync(helperPath, 'utf8');

  assert.match(helperSource, /toLowerCase\(\) === 'web'/);
  assert.match(helperSource, /isWebGameType\(type\) \? 'app-guide' : 'download'/);
});

test('详情页保留页游与 APK 操作边界', () => {
  const detailSource = fs.readFileSync(detailPath, 'utf8');
  const typesSource = fs.readFileSync(typesPath, 'utf8');

  assert.match(typesSource, /pkg\?: string \| null/);
  assert.match(typesSource, /original_url\?: string \| null/);
  assert.match(detailSource, /primaryActionKind === 'app-guide'/);
  assert.match(detailSource, /<AppDownloadGuideDialog/);
  assert.match(detailSource, /在 App 中游玩/);
  assert.doesNotMatch(detailSource, /trackedApiFetch\(['"]\/game\/getAppDownload/);
});
