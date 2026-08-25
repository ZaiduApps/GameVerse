import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const deploySource = await readFile(new URL('../deploy-fast.sh', import.meta.url), 'utf8');
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);

test('生产构建使用与现有依赖一致的 pnpm 版本', () => {
  assert.equal(packageJson.packageManager, 'pnpm@10.33.0');
});

test('快速部署先构建独立产物再切换运行目录', () => {
  assert.match(deploySource, /NEXT_DIST_DIR="\$\{BUILD_DIR\}" pnpm build/);
  assert.match(deploySource, /pm2 stop game-ve[\s\S]*mv "\$\{BUILD_DIR\}" \.next/);
  assert.match(deploySource, /build failed; active \.next was not modified/);
  assert.doesNotMatch(
    deploySource,
    /build failed[\s\S]{0,200}rm -rf \.next/,
  );
});
