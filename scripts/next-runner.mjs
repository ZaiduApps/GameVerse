import { spawn } from 'node:child_process';
import { access, rm } from 'node:fs/promises';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv();

const mode = process.argv[2] || 'dev';
const port = process.env.PORT || '9002';
const shouldCleanDevDist = process.env.CLEAN_NEXT_DEV_DIST === '1';
const cwd = process.cwd();
const devDistDir = path.join(cwd, '.next-dev');
const prodBuildIdFile = path.join(cwd, '.next', 'BUILD_ID');

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

if (mode === 'dev' && shouldCleanDevDist) {
  await rm(devDistDir, { recursive: true, force: true });
  console.log('[next-runner] Cleared dev dist directory: .next-dev');
}

if (mode === 'dev' && process.env.DISABLE_WEBPACK_CACHE === '1') {
  console.log('[next-runner] Disabled webpack cache for this dev session via DISABLE_WEBPACK_CACHE=1');
}

if (mode === 'start' && !(await pathExists(prodBuildIdFile))) {
  console.error('[next-runner] Missing production build (.next/BUILD_ID). Run `pnpm build` before `pnpm start`.');
  process.exit(1);
}

if (mode === 'dev') {
  const runner = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const child = spawn(runner, ['exec', 'next', 'dev', '-p', port], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
} else if (mode === 'start') {
  // 生产走自定义 server：需要在响应落盘前收口详情页 HTML 的 Vary（边缘缓存前提），
  // 并补回 `next start` 自带、自定义 server 会丢掉的 HTML gzip。详见
  // scripts/lib/next-prod-server.mjs 与 docs/EDGE_CACHE_POLICY.md。
  const { startProductionServer } = await import('./lib/next-prod-server.mjs');
  try {
    await startProductionServer({ dir: cwd, port, hostname: process.env.BIND_HOST || '0.0.0.0' });
  } catch (error) {
    console.error('[next-runner] failed to start production server', {
      port,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
} else {
  console.error(`Unsupported mode: ${mode}`);
  process.exit(1);
}
