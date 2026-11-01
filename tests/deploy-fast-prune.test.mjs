import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const deployScript = fileURLToPath(new URL('../deploy-fast.sh', import.meta.url));

// 造一个假 APP_DIR：.deploy-backups 下每份备份是空目录，命名沿用脚本的 %Y%m%d%H%M%S。
async function makeAppDir(names) {
  const appDir = await mkdtemp(join(tmpdir(), 'gameverse-prune-'));
  if (names.length > 0) {
    const backupRoot = join(appDir, '.deploy-backups');
    await mkdir(backupRoot, { recursive: true });
    for (const name of names) {
      await mkdir(join(backupRoot, name), { recursive: true });
    }
  }
  return appDir;
}

async function listBackups(appDir) {
  try {
    return (await readdir(join(appDir, '.deploy-backups'))).sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

// KB_DEPLOY_FAST_PRUNE_ONLY=1 让脚本只跑清理就退出，不碰 git/build/pm2；
// KB_DEPLOY_FAST_BACKUP_ROOT 把清理范围指向临时目录。
async function runPrune(appDir, extraEnv = {}) {
  return execFileAsync('bash', [deployScript], {
    env: {
      ...process.env,
      KB_DEPLOY_FAST_BACKUP_ROOT: join(appDir, '.deploy-backups'),
      KB_DEPLOY_FAST_PRUNE_ONLY: '1',
      ...extraEnv,
    },
  });
}

test('5 份备份只保留最近 3 份，删掉最老的 2 份', async (t) => {
  const appDir = await makeAppDir([
    '20260101000000',
    '20260102000000',
    '20260103000000',
    '20260104000000',
    '20260105000000',
  ]);
  t.after(() => rm(appDir, { recursive: true, force: true }));

  const { stdout } = await runPrune(appDir);

  assert.deepEqual(await listBackups(appDir), [
    '20260103000000',
    '20260104000000',
    '20260105000000',
  ]);
  // 删前打印的是被删目录名，且只提到最老的两份。
  assert.match(stdout, /prune old backup: .*20260101000000/);
  assert.match(stdout, /prune old backup: .*20260102000000/);
  assert.doesNotMatch(stdout, /prune old backup: .*20260103000000/);
  assert.match(stdout, /pruned 2 old backup\(s\); kept 3/);
});

test('没有 .deploy-backups、只有 1 份、恰好 3 份时都不报错也不删除', async (t) => {
  const emptyDir = await makeAppDir([]);
  const oneDir = await makeAppDir(['20260101000000']);
  const threeDir = await makeAppDir([
    '20260101000000',
    '20260102000000',
    '20260103000000',
  ]);
  t.after(async () => {
    await Promise.all(
      [emptyDir, oneDir, threeDir].map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  const emptyResult = await runPrune(emptyDir);
  assert.doesNotMatch(emptyResult.stdout, /prune old backup:/);
  assert.deepEqual(await listBackups(emptyDir), []);

  const oneResult = await runPrune(oneDir);
  assert.doesNotMatch(oneResult.stdout, /prune old backup:/);
  assert.deepEqual(await listBackups(oneDir), ['20260101000000']);

  const threeResult = await runPrune(threeDir);
  assert.doesNotMatch(threeResult.stdout, /prune old backup:/);
  assert.deepEqual(await listBackups(threeDir), [
    '20260101000000',
    '20260102000000',
    '20260103000000',
  ]);
});

test('只处理一级目录，备份根下的散文件不动', async (t) => {
  const appDir = await makeAppDir([
    '20260101000000',
    '20260102000000',
    '20260103000000',
    '20260104000000',
  ]);
  t.after(() => rm(appDir, { recursive: true, force: true }));
  await writeFile(join(appDir, '.deploy-backups', 'keep.txt'), 'not a backup\n');

  await runPrune(appDir);

  assert.deepEqual(await listBackups(appDir), [
    '20260102000000',
    '20260103000000',
    '20260104000000',
    'keep.txt',
  ]);
});

test('KB_DEPLOY_FAST_PRUNE_DRY=1 只打印不删除', async (t) => {
  const appDir = await makeAppDir([
    '20260101000000',
    '20260102000000',
    '20260103000000',
    '20260104000000',
  ]);
  t.after(() => rm(appDir, { recursive: true, force: true }));

  const { stdout } = await runPrune(appDir, { KB_DEPLOY_FAST_PRUNE_DRY: '1' });

  assert.match(stdout, /dry run; not deleting/);
  assert.equal((await listBackups(appDir)).length, 4);
});

test('清理只出现在发布成功分支，失败与回滚路径不触发', async () => {
  const deploySource = await readFile(deployScript, 'utf8');

  const rollbackMatch = deploySource.match(/rollback\(\) \{[\s\S]*?\n\}/);
  assert.ok(rollbackMatch, 'rollback() 函数应存在于 deploy-fast.sh');
  assert.doesNotMatch(rollbackMatch[0], /prune_backups/);

  // 两处调用：用例钩子 + 发布成功后的正式清理；定义行 `prune_backups() {` 不算调用。
  const callLines = deploySource.match(/^\s*prune_backups\s*$/gm) ?? [];
  assert.equal(callLines.length, 2);

  // 正式清理必须排在健康检查之后（健康检查失败的分支在上面 exit/rollback，走不到这里）。
  const healthCheckIndex = deploySource.indexOf('health check failed');
  const finalCallIndex = deploySource.lastIndexOf('\nprune_backups\n');
  assert.ok(healthCheckIndex > 0);
  assert.ok(finalCallIndex > healthCheckIndex);

  // 退一步再兜底：任何 exit 1 失败分支之前都不得紧跟清理调用。
  const lines = deploySource.split('\n');
  lines.forEach((line, index) => {
    if (!/^\s*exit 1\s*$/.test(line)) return;
    const nearby = lines.slice(Math.max(0, index - 5), index);
    assert.equal(
      nearby.some((candidate) => /^\s*prune_backups\s*$/.test(candidate)),
      false,
      `line ${index + 1}: exit 1 附近不应出现 prune_backups`,
    );
  });
});
