import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DOWNLOAD_CLICK_SCHEMA_VERSION,
  DOWNLOAD_FAILURE_EVENT,
  buildDownloadClickDedupeKey,
  reportDownloadClick,
  reportDownloadFailure,
} from '../src/lib/download-click-tracking.ts';
import {
  DOWNLOAD_CLICK_SOURCES,
  normalizeDownloadClickSource,
} from '../src/lib/download-click-source.ts';
import {
  currentDownloadPagePath,
  normalizeDownloadPagePath,
} from '../src/lib/download-path.ts';

/** 两份上报测试共用的浏览器环境与接口桩：只抓包，不打真实接口。 */
function withTrackingEnv(pathname = '/app/com.demo.one') {
  const store = new Map();
  const bodies = [];
  const originals = {
    window: globalThis.window,
    localStorage: globalThis.localStorage,
    apiStub: globalThis.__GAME_REVIEW_API_STUB__,
  };
  globalThis.window = { location: { pathname } };
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
  globalThis.__GAME_REVIEW_API_STUB__ = {
    fetch: async (_path, init) => {
      bodies.push(JSON.parse(String(init?.body || '{}')));
      return { ok: true };
    },
  };
  return {
    bodies,
    restore() {
      globalThis.window = originals.window;
      globalThis.localStorage = originals.localStorage;
      globalThis.__GAME_REVIEW_API_STUB__ = originals.apiStub;
    },
  };
}

test('页面路径只保留 pathname，去掉查询串/哈希并拒绝脏值', () => {
  assert.equal(normalizeDownloadPagePath('/app/com.demo.one?x=1#top'), '/app/com.demo.one');
  assert.equal(normalizeDownloadPagePath('  /search  '), '/search');
  assert.equal(normalizeDownloadPagePath('https://evil.example.com/x'), '');
  assert.equal(normalizeDownloadPagePath('app/no-slash'), '');
  assert.equal(normalizeDownloadPagePath('/a b'), '');
  assert.equal(normalizeDownloadPagePath('/a\\b'), '');
  assert.equal(normalizeDownloadPagePath(`/${'x'.repeat(400)}`).length, 200);
  assert.equal(normalizeDownloadPagePath(undefined), '');

  const { restore } = withTrackingEnv('/rankings?page=2');
  try {
    assert.equal(currentDownloadPagePath(), '/rankings');
  } finally {
    restore();
  }
  assert.equal(currentDownloadPagePath(), '');
});

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

test('上报事件带 dedupe_key / schema_version / path，且重复点击仍生成新 event_id', () => {
  const { bodies, restore } = withTrackingEnv('/app/com.demo.one');

  let first;
  try {
    first = reportDownloadClick({
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
    restore();
  }

  assert.equal(bodies.length, 2);
  assert.notEqual(bodies[0].event_id, bodies[1].event_id);
  assert.equal(bodies[0].props.dedupe_key, bodies[1].props.dedupe_key);
  assert.equal(bodies[0].props.schema_version, DOWNLOAD_CLICK_SCHEMA_VERSION);
  assert.equal(bodies[0].props.surface, 'detail_dialog');
  assert.equal(bodies[0].props.path, '/app/com.demo.one');
  // 来源维度（#145）：不传时按「来源不明」落 other，保证老调用点也有完整维度。
  assert.equal(bodies[0].props.click_source, 'other');
  assert.equal(bodies[0].props.intent_stage, 'terminal');
  // 调用方拿到的键与事件里的键一致，才能继续传给签发与失败上报。
  assert.equal(first, bodies[0].props.dedupe_key);
  assert.match(
    bodies[0].props.dedupe_key,
    /^web-[^|]+\|\d{4}-\d{2}-\d{2}\|67f0a66d0b2f421bca0a0001\|detail_dialog$/,
  );
});

test('来源维度只收 list / detail / other，脏值归 other（#145）', () => {
  assert.deepEqual([...DOWNLOAD_CLICK_SOURCES], ['list', 'detail', 'other']);
  assert.equal(normalizeDownloadClickSource('list'), 'list');
  assert.equal(normalizeDownloadClickSource(' detail '), 'detail');
  assert.equal(normalizeDownloadClickSource('OTHER'), 'other');
  assert.equal(normalizeDownloadClickSource(undefined), 'other');
  assert.equal(normalizeDownloadClickSource('list_card'), 'other');
  assert.equal(normalizeDownloadClickSource('/app/com.demo.one'), 'other');

  const { bodies, restore } = withTrackingEnv('/app/com.demo.one');
  try {
    reportDownloadClick({
      appId: '67f0a66d0b2f421bca0a0001',
      pkg: 'com.demo.one',
      surface: 'detail_dialog',
      source: 'detail',
    });
    reportDownloadClick({
      appId: '67f0a66d0b2f421bca0a0001',
      pkg: 'com.demo.one',
      surface: 'list_card',
      source: 'list',
    });
  } finally {
    restore();
  }

  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].props.click_source, 'detail');
  assert.equal(bodies[1].props.click_source, 'list');
  assert.equal(bodies[1].props.surface, 'list_card');
});

test('下载失败复用 fail_reason 事件，并带 pump、path、reason_kind 与同一 dedupe_key', () => {
  const { bodies, restore } = withTrackingEnv('/app/com.demo.one');

  try {
    reportDownloadFailure({
      appId: '67f0a66d0b2f421bca0a0001',
      pkg: 'com.demo.one',
      channelId: '67f0a66d0b2f421bca0a0002',
      channelCode: 'official',
      channelName: '官方渠道',
      pump: 'web_detail_dialog',
      stage: 'request_download_url',
      reason: '「官方渠道」暂时不可用：资源不存在',
      reasonCode: 404,
      reasonKind: 'no_channel',
      dedupeKey: 'web-abc|2026-11-04|67f0a66d0b2f421bca0a0001|detail_dialog',
    });
  } finally {
    restore();
  }

  assert.equal(bodies.length, 1);
  const [body] = bodies;
  assert.equal(body.event_name, DOWNLOAD_FAILURE_EVENT);
  assert.equal(body.event_name, 'fail_reason');
  assert.equal(body.channel_id, '67f0a66d0b2f421bca0a0002');
  assert.equal(body.channel_code, 'official');
  assert.equal(body.channel_name, '官方渠道');
  assert.equal(body.props.pump, 'web_detail_dialog');
  assert.equal(body.props.stage, 'request_download_url');
  assert.equal(body.props.reason_kind, 'no_channel');
  assert.equal(body.props.path, '/app/com.demo.one');
  assert.equal(body.props.reason, '「官方渠道」暂时不可用：资源不存在');
  assert.equal(body.props.reason_code, '404');
  assert.equal(
    body.props.dedupe_key,
    'web-abc|2026-11-04|67f0a66d0b2f421bca0a0001|detail_dialog',
  );
});

test('超时失败按 timeout 归类，事件名不变', () => {
  const { bodies, restore } = withTrackingEnv();

  try {
    reportDownloadFailure({
      pump: 'web_detail_dialog',
      stage: 'request_download_url',
      reason: '「官方渠道」响应超时，可以重试或稍后再试',
      reasonCode: 'timeout',
      reasonKind: 'timeout',
    });
  } finally {
    restore();
  }

  assert.equal(bodies.length, 1);
  assert.equal(bodies[0].event_name, DOWNLOAD_FAILURE_EVENT);
  assert.equal(bodies[0].props.reason_kind, 'timeout');
});
