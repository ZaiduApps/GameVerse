import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DOWNLOAD_CLICK_SCHEMA_VERSION,
  buildDownloadClickDedupeKey,
  reportDownloadClick,
} from '../src/lib/download-click-tracking.ts';

test('dedupe_key 按同访客 + 同日 + 同游戏 + 同 surface 归并', () => {
  const occurredAt = new Date('2026-11-01T10:00:00.000Z');
  const base = {
    visitorId: 'web-abc',
    occurredAt,
    gameId: 'com.demo.one',
    surface: 'detail_dialog',
  };

  assert.equal(
    buildDownloadClickDedupeKey(base),
    buildDownloadClickDedupeKey({ ...base }),
  );
  // 同日不同时刻仍归并
  assert.equal(
    buildDownloadClickDedupeKey(base),
    buildDownloadClickDedupeKey({ ...base, occurredAt: new Date('2026-11-01T23:59:59.000Z') }),
  );
  // 任意一维变化都要拆开
  assert.notEqual(
    buildDownloadClickDedupeKey(base),
    buildDownloadClickDedupeKey({ ...base, surface: 'detail_open' }),
  );
  assert.notEqual(
    buildDownloadClickDedupeKey(base),
    buildDownloadClickDedupeKey({ ...base, gameId: 'com.demo.two' }),
  );
  assert.notEqual(
    buildDownloadClickDedupeKey(base),
    buildDownloadClickDedupeKey({ ...base, visitorId: 'web-xyz' }),
  );
  assert.notEqual(
    buildDownloadClickDedupeKey(base),
    buildDownloadClickDedupeKey({ ...base, occurredAt: new Date('2026-11-02T00:00:00.000Z') }),
  );
});

test('上报事件带 dedupe_key / schema_version，且重复点击仍生成新 event_id', () => {
  const store = new Map();
  const originals = {
    window: globalThis.window,
    localStorage: globalThis.localStorage,
    apiStub: globalThis.__GAME_REVIEW_API_STUB__,
  };
  const bodies = [];
  globalThis.window = {};
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
  // alias-loader 把 @/lib/api 换成测试桩：抓取上报体，不打真实接口。
  globalThis.__GAME_REVIEW_API_STUB__ = {
    fetch: async (_path, init) => {
      bodies.push(JSON.parse(String(init?.body || '{}')));
      return { ok: true };
    },
  };

  try {
    reportDownloadClick({
      appId: '67f0a66d0b2f421bca0a0001',
      pkg: 'com.demo.one',
      channelId: '67f0a66d0b2f421bca0a0002',
      surface: 'detail_dialog',
    });
    reportDownloadClick({
      appId: '67f0a66d0b2f421bca0a0001',
      pkg: 'com.demo.one',
      channelId: '67f0a66d0b2f421bca0a0002',
      surface: 'detail_dialog',
    });
  } finally {
    globalThis.window = originals.window;
    globalThis.localStorage = originals.localStorage;
    globalThis.__GAME_REVIEW_API_STUB__ = originals.apiStub;
  }

  assert.equal(bodies.length, 2);
  assert.notEqual(bodies[0].event_id, bodies[1].event_id);
  assert.equal(bodies[0].props.dedupe_key, bodies[1].props.dedupe_key);
  assert.equal(bodies[0].props.schema_version, DOWNLOAD_CLICK_SCHEMA_VERSION);
  assert.equal(bodies[0].props.surface, 'detail_dialog');
  assert.equal(bodies[0].props.intent_stage, 'terminal');
  assert.match(
    bodies[0].props.dedupe_key,
    /^web-[^|]+\|\d{4}-\d{2}-\d{2}\|67f0a66d0b2f421bca0a0001\|detail_dialog$/,
  );
});
