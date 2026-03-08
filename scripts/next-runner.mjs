import { spawn } from 'node:child_process';
import { access, rm } from 'node:fs/promises';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv();

const mode = process.argv[2] || 'dev';
const port = process.env.PORT || '9002';
const shouldCleanDevDist = process.env.CLEAN_NEXT_DEV_DIST !== '0';
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

if (mode === 'start' && !(await pathExists(prodBuildIdFile))) {
  console.error('[next-runner] Missing production build (.next/BUILD_ID). Run `pnpm build` before `pnpm start`.');
  process.exit(1);
}

let args;
if (mode === 'dev') {
  args = ['dev', '-p', port];
} else if (mode === 'start') {
  args = ['start', '-p', port];
} else {
  console.error(`Unsupported mode: ${mode}`);
  process.exit(1);
}

const runner = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const child = spawn(runner, ['exec', 'next', ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
