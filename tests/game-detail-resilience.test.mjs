import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, utimes, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';

import {
  classifyGameDetailError,
  classifyGameDetailPayload,
  DETAIL_API_TIMEOUT_MS,
  loadGameDetailWithFallback,
  pruneGameDetailSnapshots,
  readGameDetailSnapshot,
  resolveSnapshotDir,
  SNAPSHOT_TTL_MS,
  saveGameDetailSnapshot,
} from '../src/lib/game-detail-resilience.ts';

const createdDirs = [];

async function useSnapshotDir(name) {
  const dir = await mkdtemp(path.join(tmpdir(), `gv-snapshot-${name}-`));
  createdDirs.push(dir);
  process.env.GAME_DETAIL_SNAPSHOT_DIR = dir;
  return dir;
}

function makeDetailData(pkg, extra = {}) {
  return {
    app: {
      _id: `id-${pkg}`,
      pkg,
      name: `${pkg} 原版`,
      metadata: { chs: `${pkg} 中文名` },
      detail_images: ['https://cdn.example.com/1.webp'],
    },
    resources: [{ _id: 'r1' }],
    ...extra,
  };
}

const silentLogger = { error: (...args) => silentLogger.entries.push(args), warn: () => {}, entries: [] };

after(async () => {
  delete process.env.GAME_DETAIL_SNAPSHOT_DIR;
  delete process.env.GAME_DETAIL_SNAPSHOT_LIMIT;
  await Promise.all(createdDirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

test('上游业务码/数据形状的分类', () => {
  const data = makeDetailData('com.ok');
  assert.deepEqual(classifyGameDetailPayload({ code: 0, data }), { kind: 'ok', data });

  assert.deepEqual(classifyGameDetailPayload({ code: 404, message: '应用不存在' }), { kind: 'missing' });
  assert.deepEqual(classifyGameDetailPayload({ code: 500, message: 'everything is broken' }), {
    kind: 'degraded',
    reason: 'code',
    message: 'code=500 message=everything is broken',
  });
  assert.equal(classifyGameDetailPayload({ code: 0, data: { resources: [] } }).reason, 'parse');
  assert.equal(classifyGameDetailPayload(undefined).reason, 'parse');
  assert.equal(classifyGameDetailPayload('<html>502</html>').reason, 'parse');
});

test('网络异常归到 timeout / connect / parse', () => {
  const timeout = new Error('The operation was aborted due to timeout');
  timeout.name = 'TimeoutError';
  assert.equal(classifyGameDetailError(timeout), 'timeout');

  const refused = new TypeError('fetch failed');
  refused.cause = { code: 'ECONNREFUSED' };
  assert.equal(classifyGameDetailError(refused), 'connect');

  const dns = new Error('getaddrinfo EAI_AGAIN api.hk.apks.cc');
  assert.equal(classifyGameDetailError(dns), 'connect');

  assert.equal(classifyGameDetailError(new SyntaxError('Unexpected token < in JSON')), 'parse');
  assert.equal(classifyGameDetailError(new Error('boom')), 'other');
});

test('超时常量沿用 12000ms', () => {
  assert.equal(DETAIL_API_TIMEOUT_MS, 12000);
});

test('成功抓取写入 pkg 粒度快照文件，可回读且带 savedAt', async () => {
  const dir = await useSnapshotDir('write');
  const pkg = 'com.example.write';
  const data = makeDetailData(pkg);
  const savedAtMs = Date.parse('2026-10-25T04:00:00.000Z');

  const filePath = await saveGameDetailSnapshot(pkg, data, { now: () => savedAtMs });
  assert.equal(filePath, path.join(dir, `${pkg}.json`));

  const raw = JSON.parse(await readFile(filePath, 'utf8'));
  assert.equal(raw.pkg, pkg);
  assert.equal(raw.savedAt, '2026-10-25T04:00:00.000Z');
  assert.equal(raw.data.app.pkg, pkg);
  // 原子写：目录里不能残留 tmp 文件。
  assert.deepEqual((await readdir(dir)).sort(), [`${pkg}.json`]);

  const read = await readGameDetailSnapshot(pkg, { now: () => savedAtMs + 60_000 });
  assert.equal(read.savedAt, '2026-10-25T04:00:00.000Z');
  assert.equal(read.ageMs, 60_000);
  assert.equal(read.data.app.pkg, pkg);
});

test('快照目录默认落在 .cache/game-detail-fallback 并可用环境变量覆盖', async () => {
  const dir = await useSnapshotDir('dir');
  assert.equal(resolveSnapshotDir(), dir);

  delete process.env.GAME_DETAIL_SNAPSHOT_DIR;
  assert.equal(resolveSnapshotDir(), path.join(process.cwd(), '.cache', 'game-detail-fallback'));
});

test('超过 TTL 的快照不参与降级', async () => {
  const dir = await useSnapshotDir('ttl');
  const pkg = 'com.example.expired';
  const staleAt = Date.now() - SNAPSHOT_TTL_MS - 60_000;

  await writeFile(
    path.join(dir, `${pkg}.json`),
    JSON.stringify({ pkg, savedAt: new Date(staleAt).toISOString(), data: makeDetailData(pkg) }),
    'utf8',
  );

  assert.equal(await readGameDetailSnapshot(pkg), null);
});

test('损坏的快照文件被忽略，不抛错', async () => {
  const dir = await useSnapshotDir('broken');
  await writeFile(path.join(dir, 'com.example.broken.json'), '{not json', 'utf8');

  assert.equal(await readGameDetailSnapshot('com.example.broken'), null);
});

test('降级：上游挂了但有快照时渲染快照并打出 pkg/reason/snapshotAgeMs', async () => {
  await useSnapshotDir('degraded-hit');
  const pkg = 'com.example.degraded';
  const savedAtMs = Date.now() - 5 * 60 * 1000;
  await saveGameDetailSnapshot(pkg, makeDetailData(pkg), { now: () => savedAtMs });

  const logger = { entries: [], error: (...args) => logger.entries.push(args), warn: () => {} };
  const outcome = await loadGameDetailWithFallback({
    pkg,
    load: async () => {
      throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
    },
    logger,
    now: () => savedAtMs + 5 * 60 * 1000,
  });

  assert.equal(outcome.result, 'degraded');
  assert.equal(outcome.reason, 'connect');
  assert.equal(outcome.data.app.pkg, pkg);
  assert.equal(outcome.savedAt, new Date(savedAtMs).toISOString());

  assert.equal(logger.entries.length, 1);
  const [headline, payload] = logger.entries[0];
  assert.equal(headline, '[game-detail] degraded');
  assert.equal(payload.pkg, pkg);
  assert.equal(payload.reason, 'connect');
  assert.equal(payload.hasSnapshot, true);
  assert.equal(payload.snapshotAgeMs, 5 * 60 * 1000);
});

test('降级：无快照时返回空数据并照样打日志', async () => {
  await useSnapshotDir('degraded-miss');
  const logger = { entries: [], error: (...args) => logger.entries.push(args), warn: () => {} };

  const outcome = await loadGameDetailWithFallback({
    pkg: 'com.example.never-fetched',
    load: async () => ({ status: 502 }),
    logger,
  });

  assert.equal(outcome.result, 'degraded');
  assert.equal(outcome.reason, 'status');
  assert.equal(outcome.data, null);
  assert.equal(outcome.savedAt, null);
  const payload = logger.entries[0][1];
  assert.equal(payload.hasSnapshot, false);
  assert.equal(payload.snapshotAgeMs, null);
});

test('上游明确不存在时返回 missing 且不写快照', async () => {
  const dir = await useSnapshotDir('missing');
  const logger = { entries: [], error: (...args) => logger.entries.push(args), warn: () => {} };

  const outcome = await loadGameDetailWithFallback({
    pkg: 'com.example.missing',
    load: async () => ({ status: 200, payload: { code: 404, message: '应用不存在' } }),
    logger,
  });

  assert.equal(outcome.result, 'missing');
  assert.equal(logger.entries.length, 0);
  assert.deepEqual(await readdir(dir), []);
});

test('成功路径写快照，persistSnapshot=false 时不写（构建期）', async () => {
  const dir = await useSnapshotDir('persist');
  const data = makeDetailData('com.example.ok');

  const outcome = await loadGameDetailWithFallback({
    pkg: 'com.example.ok',
    load: async () => ({ status: 200, payload: { code: 0, data } }),
    logger: silentLogger,
  });
  assert.equal(outcome.result, 'ok');
  assert.deepEqual((await readdir(dir)).sort(), ['com.example.ok.json']);

  await loadGameDetailWithFallback({
    pkg: 'com.example.build',
    load: async () => ({ status: 200, payload: { code: 0, data: makeDetailData('com.example.build') } }),
    persistSnapshot: false,
    logger: silentLogger,
  });
  assert.deepEqual((await readdir(dir)).sort(), ['com.example.ok.json']);
});

test('快照数量按上限淘汰最旧的，并清理过期文件', async () => {
  const dir = await useSnapshotDir('prune');
  process.env.GAME_DETAIL_SNAPSHOT_LIMIT = '2';
  const nowMs = Date.now();

  const pkgNames = ['com.a.one', 'com.a.two', 'com.a.three', 'com.a.expired'];
  for (const [index, pkg] of pkgNames.entries()) {
    const savedAtMs = pkg === 'com.a.expired' ? nowMs - SNAPSHOT_TTL_MS - 60_000 : nowMs - (10 - index) * 60_000;
    const filePath = path.join(dir, `${pkg}.json`);
    await writeFile(
      filePath,
      JSON.stringify({ pkg, savedAt: new Date(savedAtMs).toISOString(), data: makeDetailData(pkg) }),
      'utf8',
    );
    // 淘汰按文件 mtime（磁盘上的写入时间）排序，这里显式对齐，避免同毫秒写入导致顺序不稳。
    const stamp = new Date(savedAtMs);
    await utimes(filePath, stamp, stamp);
  }
  // 非快照文件不受影响。
  await mkdir(path.join(dir, 'nested'), { recursive: true });

  const result = await pruneGameDetailSnapshots({ now: () => nowMs });
  const remaining = (await readdir(dir)).filter((name) => name.endsWith('.json')).sort();

  assert.equal(result.removed, 2);
  assert.equal(result.kept, 2);
  assert.deepEqual(remaining, ['com.a.three.json', 'com.a.two.json']);
  delete process.env.GAME_DETAIL_SNAPSHOT_LIMIT;
});
