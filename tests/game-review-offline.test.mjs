import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

import {
  getGameReviewSummary,
  submitGameRating,
  submitGameReviewComment,
  updateGameReviewAdminEmailSwitch,
  updateGameReviewEmailPreference,
} from '../src/lib/game-review-api.ts';

const storage = new Map();
const localStorageShim = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
  key(index) {
    return Array.from(storage.keys())[index] ?? null;
  },
  get length() {
    return storage.size;
  },
};

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { localStorage: localStorageShim },
});
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorageShim,
});

const requests = [];
const apiStub = {
  async fetch(path, init) {
    requests.push({ path, init });
    return apiStub.handler(path, init);
  },
  handler: async () => new Response(null, { status: 500 }),
};
globalThis.__GAME_REVIEW_API_STUB__ = apiStub;

const identity = {
  appId: '68f5d0c08902ae6d797b83ca',
  pkg: 'com.tencent.ig',
  gameName: 'PUBG MOBILE',
  manualScore: 4.3,
};

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function gameReviewStorageKeys() {
  return Array.from(storage.keys()).filter((key) => key.startsWith('game-review:'));
}

beforeEach(() => {
  requests.length = 0;
  storage.clear();
  apiStub.handler = async () => jsonResponse(500, {
    code: 500,
    message: 'upstream down',
    data: null,
  });
});

test('后端恒 500 时评论和评分均失败，且不写 game-review 本地缓存', async () => {
  const comment = await submitGameReviewComment({
    token: 'fake-token',
    identity,
    content: '离线评论',
  });
  const rating = await submitGameRating({
    token: 'fake-token',
    identity,
    rating: 5,
  });

  assert.equal(comment.ok, false);
  assert.equal(comment.message, 'upstream down');
  assert.equal(rating.ok, false);
  assert.equal(rating.summary, null);
  assert.deepEqual(gameReviewStorageKeys(), []);
});

test('一次评论提交只请求一次，且使用规范路径', async () => {
  const result = await submitGameReviewComment({
    token: 'fake-token',
    identity,
    content: '只发一次',
  });

  assert.equal(result.ok, false);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/game/reviews/comments');
  assert.equal(requests[0].init.method, 'POST');
});

test('邮件偏好保存失败返回 ok:false，不写本地缓存', async () => {
  const result = await updateGameReviewEmailPreference({
    token: 'fake-token',
    enabled: true,
  });

  assert.deepEqual(result, { ok: false, message: 'upstream down' });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/users/preferences/game-reviews');
  assert.equal(requests[0].init.method, 'PATCH');
  assert.deepEqual(gameReviewStorageKeys(), []);
});

test('管理员邮件开关仅在 PATCH 成功后写入本地缓存', async () => {
  const failed = await updateGameReviewAdminEmailSwitch({
    token: 'fake-token',
    enabled: true,
  });

  assert.deepEqual(failed, { ok: false, message: 'upstream down' });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/game/reviews/admin/settings');
  assert.equal(requests[0].init.method, 'PATCH');
  assert.deepEqual(gameReviewStorageKeys(), []);

  requests.length = 0;
  apiStub.handler = async () => jsonResponse(200, {
    code: 0,
    message: 'saved',
    data: { community_reply_email_enabled: true },
  });

  const saved = await updateGameReviewAdminEmailSwitch({
    token: 'fake-token',
    enabled: true,
  });

  assert.deepEqual(saved, {
    ok: true,
    enabled: true,
    source: 'remote',
    message: 'saved',
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/game/reviews/admin/settings');
  assert.equal(requests[0].init.method, 'PATCH');
  assert.equal(storage.get('game-review:admin-email-switch'), '1');
});

test('code=0 且带 data 的成功响应继续正常解析', async () => {
  apiStub.handler = async (path) => {
    if (path.startsWith('/game/reviews/summary?')) {
      return jsonResponse(200, {
        code: 0,
        data: {
          rating: 4.3,
          rating_count: 2,
          my_rating: 5,
        },
      });
    }
    return jsonResponse(200, {
      code: 0,
      data: { id: 'comment-1' },
    });
  };

  const comment = await submitGameReviewComment({
    token: 'fake-token',
    identity,
    content: '正常评论',
  });
  const summary = await getGameReviewSummary(identity);

  assert.equal(comment.ok, true);
  assert.ok(summary);
  assert.equal(summary.ratingCount, 2);
  assert.equal(summary.myRating, 5);
  assert.match(requests[1].path, /^\/game\/reviews\/summary\?/);
});

test('summary 带 token 时发送 Authorization，不带 token 时不发送', async () => {
  apiStub.handler = async () => jsonResponse(200, {
    code: 0,
    data: {
      rating: 4.3,
      rating_count: 1,
    },
  });

  await getGameReviewSummary(identity, 'fake-token');
  await getGameReviewSummary(identity);

  assert.equal(
    requests[0].init.headers.Authorization,
    'Bearer fake-token',
  );
  assert.equal(requests[1].init.headers.Authorization, undefined);
});

test('无 code 且不含 data/result 的响应仍判为失败', async () => {
  apiStub.handler = async () => jsonResponse(200, {
    message: 'not a success envelope',
  });

  const result = await submitGameReviewComment({
    token: 'fake-token',
    identity,
    content: '错误包装',
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, 'not a success envelope');
});
