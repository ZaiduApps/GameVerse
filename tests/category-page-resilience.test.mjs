import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CATEGORY_PAGE_API_TIMEOUT_MS,
  CATEGORY_PAGE_RETRY_TIMEOUT_MS,
  classifyCategoryPageResponse,
  emptyCategoryPayload,
  loadCategoryPageWithRetry,
} from '../src/lib/category-page-resilience.ts';

const PAGE_SIZE = 24;

function okPayload(overrides = {}) {
  return {
    code: 0,
    data: {
      list: [{ _id: 'a1', pkg: 'com.example.a' }],
      total: 90,
      publishedTotal: 100,
      page: 3,
      pageSize: PAGE_SIZE,
      ...overrides,
    },
  };
}

function silentLogger() {
  const calls = { warn: 0, error: 0 };
  return {
    calls,
    warn: () => {
      calls.warn += 1;
    },
    error: () => {
      calls.error += 1;
    },
  };
}

test('超时常量与被测模块一致，不会一处 6s 一处 5s', () => {
  assert.equal(CATEGORY_PAGE_API_TIMEOUT_MS, 6000);
  assert.equal(CATEGORY_PAGE_RETRY_TIMEOUT_MS, 5000);
});

test('首次成功：只请求一次 primary，不触发降级', async () => {
  const attempts = [];
  const logger = silentLogger();
  const result = await loadCategoryPageWithRetry({
    page: 3,
    pageSize: PAGE_SIZE,
    logger,
    load: async (attempt) => {
      attempts.push(attempt);
      return { status: 200, payload: okPayload() };
    },
  });

  assert.deepEqual(attempts, ['primary']);
  assert.equal(result.kind, 'ok');
  assert.equal(result.data.payload.total, 90);
  assert.equal(result.data.payload.page, 3);
  assert.equal(result.data.totalPages, 4);
  assert.deepEqual(logger.calls, { warn: 0, error: 0 });
});

test('首次 504：用 retry 再取一次，成功后正常渲染', async () => {
  const attempts = [];
  const logger = silentLogger();
  const result = await loadCategoryPageWithRetry({
    page: 3,
    pageSize: PAGE_SIZE,
    logger,
    load: async (attempt) => {
      attempts.push(attempt);
      if (attempt === 'primary') return { status: 504 };
      return { status: 200, payload: okPayload() };
    },
  });

  assert.deepEqual(attempts, ['primary', 'retry']);
  assert.equal(result.kind, 'ok');
  assert.equal(logger.calls.warn, 1);
  assert.equal(logger.calls.error, 0);
});

test('旧版「HTTP 200 + code 502」也按失败处理并重取（清掉缓存毒化）', async () => {
  const attempts = [];
  const result = await loadCategoryPageWithRetry({
    page: 3,
    pageSize: PAGE_SIZE,
    logger: silentLogger(),
    load: async (attempt) => {
      attempts.push(attempt);
      if (attempt === 'primary') {
        return { status: 200, payload: { code: 502, message: '分类查询失败' } };
      }
      return { status: 200, payload: okPayload() };
    },
  });

  assert.deepEqual(attempts, ['primary', 'retry']);
  assert.equal(result.kind, 'ok');
});

test('两次都失败：返回 unavailable（上层渲染 200 空态页），不再抛错', async () => {
  const attempts = [];
  const logger = silentLogger();
  const result = await loadCategoryPageWithRetry({
    page: 3,
    pageSize: PAGE_SIZE,
    logger,
    load: async (attempt) => {
      attempts.push(attempt);
      return { status: attempt === 'primary' ? 503 : 504 };
    },
  });

  assert.deepEqual(attempts, ['primary', 'retry']);
  assert.equal(result.kind, 'unavailable');
  assert.equal(logger.calls.warn, 1);
  assert.equal(logger.calls.error, 1);
});

test('请求抛错（超时/网络异常）同样进入降级重取', async () => {
  const attempts = [];
  const result = await loadCategoryPageWithRetry({
    page: 1,
    pageSize: PAGE_SIZE,
    logger: silentLogger(),
    load: async (attempt) => {
      attempts.push(attempt);
      if (attempt === 'primary') {
        throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
      }
      return { status: 200, payload: okPayload({ page: 1 }) };
    },
  });

  assert.deepEqual(attempts, ['primary', 'retry']);
  assert.equal(result.kind, 'ok');
});

test('HTTP 400 是确定性结论：直接 missing，不浪费第二次请求', async () => {
  const attempts = [];
  const result = await loadCategoryPageWithRetry({
    page: 1,
    pageSize: PAGE_SIZE,
    logger: silentLogger(),
    load: async (attempt) => {
      attempts.push(attempt);
      return { status: 400 };
    },
  });

  assert.deepEqual(attempts, ['primary']);
  assert.equal(result.kind, 'missing');
});

test('业务码 400（分类不存在）→ missing，不重取', async () => {
  const result = await classifyCategoryPageResponse(
    { status: 200, payload: { code: 400, message: '缺少分类名' } },
    1,
    PAGE_SIZE,
  );
  assert.equal(result.kind, 'missing');
});

test('页码越界 → missing，不渲染空网格也不算上游故障', async () => {
  const result = await classifyCategoryPageResponse(
    { status: 200, payload: okPayload({ page: 9 }) },
    9,
    PAGE_SIZE,
  );
  assert.equal(result.kind, 'missing');
});

test('未达收录阈值的分类 → missing', async () => {
  const result = await classifyCategoryPageResponse(
    { status: 200, payload: okPayload({ total: 3, publishedTotal: 5 }) },
    1,
    PAGE_SIZE,
  );
  assert.equal(result.kind, 'missing');
});

test('结构异常（data 缺失）按失败处理，值得重取一次', async () => {
  const result = await classifyCategoryPageResponse({ status: 200, payload: { code: 0 } }, 1, PAGE_SIZE);
  assert.equal(result.kind, 'failed');
});

test('空态数据不声明任何总量，只保留页码', () => {
  assert.deepEqual(emptyCategoryPayload(7, PAGE_SIZE), {
    list: [],
    total: 0,
    publishedTotal: 0,
    page: 7,
    pageSize: PAGE_SIZE,
  });
});
