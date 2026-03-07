import { spawn } from 'node:child_process';
import { config as loadEnv } from 'dotenv';

loadEnv();

const mode = process.argv[2] || 'dev';
const port = process.env.PORT || '9002';

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
