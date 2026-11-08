import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import {
  putDraftImage,
  pruneExpiredDrafts,
  readDraft,
  readDraftImages,
  resolveDraftKey,
  writeDraft,
} from '../src/lib/community-draft.ts';
import {
  installBrowserEnv,
  resetCommunityIdb,
  restoreBrowserEnv,
} from './helpers/community-test-env.mjs';

const BASE_NOW = 1_700_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DRAFT_TTL_MS = 7 * DAY_MS;
const DEVICE_KEY = 'community:draft-device';

const realNow = Date.now;

let currentNow = BASE_NOW;
let browserEnv = null;

function makeDraft(overrides = {}) {
  return {
    version: 1,
    userId: 'user-1',
    title: '标题',
    content: '正文',
    topicIds: [],
    topicNames: [],
    updatedAt: currentNow,
    ...overrides,
  };
}

function makeImage(id) {
  return {
    meta: { id, name: `${id}.png`, type: 'image/png', size: 1 },
    blob: new Blob(['x'], { type: 'image/png' }),
  };
}

beforeEach(() => {
  currentNow = BASE_NOW;
  Date.now = () => currentNow;
  browserEnv = installBrowserEnv();
  resetCommunityIdb();
});

afterEach(() => {
  Date.now = realNow;
  restoreBrowserEnv(browserEnv);
  browserEnv = null;
});

test('pruneExpiredDrafts 删除超过 7 天的草稿文本与图片，保留未过期草稿', async () => {
  const expiredKey = resolveDraftKey('user-expired');
  const freshKey = resolveDraftKey('user-fresh');
  writeDraft(expiredKey, makeDraft({
    userId: 'user-expired',
    updatedAt: BASE_NOW - DRAFT_TTL_MS - 1,
  }));
  writeDraft(freshKey, makeDraft({
    userId: 'user-fresh',
    updatedAt: BASE_NOW - DRAFT_TTL_MS + 1,
  }));
  const expiredImage = makeImage('img-old');
  const freshImage = makeImage('img-new');
  await putDraftImage(expiredKey, expiredImage.meta, expiredImage.blob);
  await putDraftImage(freshKey, freshImage.meta, freshImage.blob);

  await pruneExpiredDrafts();

  assert.equal(browserEnv.storage.getItem(expiredKey), null);
  assert.equal(readDraft(expiredKey), null);
  assert.equal((await readDraftImages(expiredKey)).size, 0);

  assert.ok(readDraft(freshKey));
  assert.equal((await readDraftImages(freshKey)).size, 1);
  assert.ok((await readDraftImages(freshKey)).has('img-new'));
});

test('pruneExpiredDrafts 清掉损坏 JSON 与旧版本草稿', async () => {
  const brokenKey = `${resolveDraftKey('user-broken')}`;
  const legacyKey = resolveDraftKey('user-legacy');
  browserEnv.storage.setItem(brokenKey, '{not-json');
  writeDraft(legacyKey, { ...makeDraft({ userId: 'user-legacy' }), version: 0 });

  await pruneExpiredDrafts();

  assert.equal(browserEnv.storage.getItem(brokenKey), null);
  assert.equal(browserEnv.storage.getItem(legacyKey), null);
});

test('readDraft（normalizeDraft）拒绝过期草稿并删除它', () => {
  const key = resolveDraftKey('user-ttl');
  writeDraft(key, makeDraft({
    userId: 'user-ttl',
    updatedAt: BASE_NOW - DRAFT_TTL_MS - 1,
  }));

  assert.equal(readDraft(key), null);
  assert.equal(browserEnv.storage.getItem(key), null);
});

test('readDraft（normalizeDraft）拒绝版本不符的草稿并删除它', () => {
  const key = resolveDraftKey('user-version');
  browserEnv.storage.setItem(
    key,
    JSON.stringify({ ...makeDraft({ userId: 'user-version' }), version: 2 }),
  );

  assert.equal(readDraft(key), null);
  assert.equal(browserEnv.storage.getItem(key), null);
});

test('readDraft 返回未过期有效草稿', () => {
  const key = resolveDraftKey('user-valid');
  writeDraft(key, makeDraft({
    userId: 'user-valid',
    title: '有效标题',
    content: '有效正文',
    topicIds: ['t1'],
    topicNames: ['话题一'],
    updatedAt: BASE_NOW - 1,
  }));

  const draft = readDraft(key);
  assert.deepEqual(draft, {
    version: 1,
    userId: 'user-valid',
    title: '有效标题',
    content: '有效正文',
    topicIds: ['t1'],
    topicNames: ['话题一'],
    updatedAt: BASE_NOW - 1,
  });
});

test('resolveDraftKey 登录用户按 ID 隔离，未登录按设备隔离且设备 ID 持久化', () => {
  assert.equal(resolveDraftKey('user-1'), 'community:draft:v1:u:user-1');
  assert.notEqual(resolveDraftKey('user-1'), resolveDraftKey('user-2'));

  const anonymousKey = resolveDraftKey();
  const deviceId = browserEnv.storage.getItem(DEVICE_KEY);
  assert.match(anonymousKey, /^community:draft:v1:d:draft-dev-/);
  assert.equal(anonymousKey, `community:draft:v1:d:${deviceId}`);
  assert.equal(resolveDraftKey(null), anonymousKey);
  assert.equal(anonymousKey, resolveDraftKey('   '));
});
