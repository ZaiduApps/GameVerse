import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import {
  listPublishJobs,
  processPublishQueue,
  retryPublishJob,
  savePublishJob,
  subscribePublishQueue,
} from '../src/lib/community-publish-queue.ts';
import {
  installBrowserEnv,
  resetCommunityIdb,
  restoreBrowserEnv,
} from './helpers/community-test-env.mjs';

const BASE_NOW = 1_700_000_000_000;
const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 300_000, 600_000];

const realNow = Date.now;

let currentNow = BASE_NOW;
let browserEnv = null;
let unsubscribe = null;
let createCalls = [];
let uploadCalls = [];
let events = [];

function installCreateStub(handler) {
  globalThis.__COMMUNITY_CREATE_POST_STUB__ = {
    create: async (params) => {
      createCalls.push(params);
      return handler(params);
    },
  };
}

function installFetchStub(handler) {
  globalThis.__COMMUNITY_QUEUE_FETCH_STUB__ = {
    fetch: async (path, init) => {
      uploadCalls.push({ path, init });
      return handler(path, init);
    },
  };
}

function listenQueue() {
  unsubscribe = subscribePublishQueue((event) => events.push(event));
}

function makeJob(overrides = {}) {
  return {
    id: 'job-1',
    userId: 'user-1',
    createdAt: currentNow,
    updatedAt: currentNow,
    status: 'pending',
    attempts: 0,
    title: '测试标题',
    content: '测试正文',
    topicIds: [],
    topicNames: [],
    source: 'web',
    images: [],
    ...overrides,
  };
}

beforeEach(() => {
  currentNow = BASE_NOW;
  Date.now = () => currentNow;
  browserEnv = installBrowserEnv();
  resetCommunityIdb();
  createCalls = [];
  uploadCalls = [];
  events = [];
  installCreateStub(async () => {
    throw new Error('createCommunityPost stub is not configured');
  });
  installFetchStub(async () => {
    throw new Error('trackedApiFetch stub is not configured');
  });
});

afterEach(() => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  Date.now = realNow;
  delete globalThis.__COMMUNITY_CREATE_POST_STUB__;
  delete globalThis.__COMMUNITY_QUEUE_FETCH_STUB__;
  restoreBrowserEnv(browserEnv);
  browserEnv = null;
});

test('重试状态重置：失败后 attempts+1、回到 pending、nextAttemptAt 按 attempts 取退避', async () => {
  installCreateStub(async () => ({
    ok: false,
    message: '服务繁忙',
    statusCode: 503,
  }));
  listenQueue();
  await savePublishJob(makeJob({ id: 'job-retry-1' }));

  await processPublishQueue('user-1', 'token-1');

  const jobs = await listPublishJobs('user-1');
  assert.equal(jobs.length, 1);
  const [stored] = jobs;
  assert.equal(stored.status, 'pending');
  assert.equal(stored.attempts, 1);
  assert.equal(stored.lastError, '服务繁忙');
  assert.equal(stored.nextAttemptAt, BASE_NOW + RETRY_DELAYS_MS[0]);

  const pendingEvent = events
    .filter((event) => event.type === 'job_updated')
    .at(-1);
  assert.equal(pendingEvent.job.status, 'pending');
  assert.equal(pendingEvent.job.nextAttemptAt, BASE_NOW + RETRY_DELAYS_MS[0]);

  // 未到 nextAttemptAt 时再跑一次不会发请求。
  await processPublishQueue('user-1', 'token-1');
  assert.equal(createCalls.length, 1);
});

test('重试退避按 attempts 递增：第 3 次失败等 120 秒', async () => {
  installCreateStub(async () => ({
    ok: false,
    message: '服务繁忙',
    statusCode: 502,
  }));
  await savePublishJob(makeJob({ id: 'job-retry-3', attempts: 2 }));

  await processPublishQueue('user-1', 'token-1');

  const [stored] = await listPublishJobs('user-1');
  assert.equal(stored.attempts, 3);
  assert.equal(stored.status, 'pending');
  assert.equal(stored.nextAttemptAt, BASE_NOW + RETRY_DELAYS_MS[2]);
});

test('达到 MAX_ATTEMPTS 后转 failed 且不再排期', async () => {
  installCreateStub(async () => ({
    ok: false,
    message: '服务繁忙',
    statusCode: 500,
  }));
  listenQueue();
  await savePublishJob(makeJob({ id: 'job-max', attempts: 4 }));

  await processPublishQueue('user-1', 'token-1');

  const [stored] = await listPublishJobs('user-1');
  assert.equal(stored.attempts, 5);
  assert.equal(stored.status, 'failed');
  assert.equal(stored.nextAttemptAt, undefined);
  assert.equal(stored.lastError, '服务繁忙');
  assert.equal(
    events.filter((event) => event.type === 'job_failed').length,
    1,
  );
});

test('retryPublishJob 清空 attempts/nextAttemptAt 后重新入队', async () => {
  installCreateStub(async () => ({
    ok: true,
    message: '发布成功',
    postId: 'post-retry',
    reviewStatus: 'pending',
    status: 1,
  }));
  listenQueue();
  const failedJob = makeJob({
    id: 'job-manual-retry',
    status: 'failed',
    attempts: 5,
    nextAttemptAt: BASE_NOW + RETRY_DELAYS_MS[4],
    lastError: '服务繁忙',
  });
  await savePublishJob(failedJob);

  // 空 token 只做状态重置，不触发 processPublishQueue。
  await retryPublishJob(failedJob, '');
  const [reset] = await listPublishJobs('user-1');
  assert.equal(reset.status, 'pending');
  assert.equal(reset.attempts, 0);
  assert.equal(reset.nextAttemptAt, undefined);
  assert.equal(reset.lastError, '');
  assert.equal(
    events.filter((event) => event.type === 'job_updated').length,
    1,
  );

  // 带 token 时重新入队并成功发布。
  await retryPublishJob(reset, 'token-1');
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].clientRequestId, 'job-manual-retry');
  assert.deepEqual(await listPublishJobs('user-1'), []);
});

test('401（发帖接口）不消耗重试次数，回退 attempts 并发出 auth_required', async () => {
  installCreateStub(async () => ({
    ok: false,
    message: '未登录或登录已过期',
    statusCode: 401,
  }));
  listenQueue();
  await savePublishJob(makeJob({ id: 'job-401' }));

  await processPublishQueue('user-1', 'token-1');
  let [stored] = await listPublishJobs('user-1');
  assert.equal(stored.status, 'pending');
  assert.equal(stored.attempts, 0);
  assert.equal(stored.lastError, '登录已过期，请重新登录后继续发布');
  assert.equal(stored.nextAttemptAt, undefined);
  assert.equal(
    events.filter((event) => event.type === 'auth_required').length,
    1,
  );
  assert.equal(
    events.filter((event) => event.type === 'job_failed').length,
    0,
  );

  // 再次 401 仍然是 0 次消耗。
  await processPublishQueue('user-1', 'token-1');
  [stored] = await listPublishJobs('user-1');
  assert.equal(stored.attempts, 0);
  assert.equal(stored.status, 'pending');
  assert.equal(
    events.filter((event) => event.type === 'auth_required').length,
    2,
  );
});

test('图片上传 401 同样暂停任务且不消耗重试次数', async () => {
  installFetchStub(async () => new Response('{}', { status: 401 }));
  installCreateStub(async () => ({
    ok: true,
    message: '发布成功',
    postId: 'post-never',
  }));
  listenQueue();
  await savePublishJob(
    makeJob({
      id: 'job-upload-401',
      content: '看图 local-image://img-1',
      images: [
        {
          id: 'img-1',
          name: 'a.png',
          type: 'image/png',
          size: 1,
          blob: new Blob(['x'], { type: 'image/png' }),
        },
      ],
    }),
  );

  await processPublishQueue('user-1', 'token-1');

  const [stored] = await listPublishJobs('user-1');
  assert.equal(stored.status, 'pending');
  assert.equal(stored.attempts, 0);
  assert.equal(stored.lastError, '登录已过期，请重新登录后继续发布');
  assert.equal(uploadCalls.length, 1);
  assert.equal(uploadCalls[0].path, '/upload/public');
  assert.equal(createCalls.length, 0);
  assert.equal(
    events.filter((event) => event.type === 'auth_required').length,
    1,
  );
});

test('发布成功时 clientRequestId 等于 job.id，任务随后移出队列', async () => {
  installCreateStub(async () => ({
    ok: true,
    message: '发布成功',
    postId: 'post-ok',
    reviewStatus: 'approved',
    status: 1,
  }));
  listenQueue();
  await savePublishJob(makeJob({ id: 'job-idem-success' }));

  await processPublishQueue('user-1', 'token-1');

  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].clientRequestId, 'job-idem-success');
  assert.equal(createCalls[0].token, 'token-1');
  assert.deepEqual(await listPublishJobs('user-1'), []);

  const doneEvents = events.filter((event) => event.type === 'job_done');
  assert.equal(doneEvents.length, 1);
  assert.equal(doneEvents[0].job.result.postId, 'post-ok');
});

test('同一任务跨重试不换幂等键：两次 createCommunityPost 的 clientRequestId 一致', async () => {
  let attempt = 0;
  installCreateStub(async () => {
    attempt += 1;
    if (attempt === 1) {
      return { ok: false, message: '服务繁忙', statusCode: 503 };
    }
    return {
      ok: true,
      message: '发布成功',
      postId: 'post-after-retry',
      reviewStatus: 'pending',
      status: 1,
    };
  });
  await savePublishJob(makeJob({ id: 'job-idem-retry' }));

  await processPublishQueue('user-1', 'token-1');
  const [pending] = await listPublishJobs('user-1');
  assert.equal(pending.status, 'pending');
  assert.equal(pending.nextAttemptAt, BASE_NOW + RETRY_DELAYS_MS[0]);

  currentNow = pending.nextAttemptAt + 1;
  await processPublishQueue('user-1', 'token-1');

  assert.equal(createCalls.length, 2);
  assert.deepEqual(
    createCalls.map((call) => call.clientRequestId),
    ['job-idem-retry', 'job-idem-retry'],
  );
  assert.deepEqual(await listPublishJobs('user-1'), []);
});
