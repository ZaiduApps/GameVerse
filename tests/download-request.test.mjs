import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DOWNLOAD_REQUEST_TIMEOUT_MS,
  requestDownloadUrl,
} from '../src/lib/download-request.ts';

const input = {
  appId: '67f0a66d0b2f421bca0a0001',
  pkg: 'com.demo.one',
  channelId: '67f0a66d0b2f421bca0a0002',
  channelName: '官方渠道',
};

const reply = (body, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => body,
});

test('成功时返回可下发的地址，并给请求设 3 秒上限', async () => {
  const calls = [];
  const result = await requestDownloadUrl(
    { ...input, path: '/app/com.demo.one' },
    async (path, init) => {
      calls.push({ path, body: JSON.parse(init.body), headers: init.headers, timeoutMs: init.timeoutMs });
      return reply({ code: 0, data: { url: 'https://cdn.example/a.apk' } });
    },
  );

  assert.deepEqual(result, { ok: true, url: 'https://cdn.example/a.apk' });
  assert.equal(calls[0].path, '/game/getAppDownload');
  assert.equal(calls[0].headers['x-ac-surface'], 'detail_dialog');
  assert.equal(calls[0].headers['x-ac-path'], '/app/com.demo.one');
  assert.equal(calls[0].timeoutMs, DOWNLOAD_REQUEST_TIMEOUT_MS);
  // 2500ms + 500ms 渲染余量 = 用户 3 秒内看到失败态。
  assert.equal(DOWNLOAD_REQUEST_TIMEOUT_MS, 2500);
  assert.equal(calls[0].body.channel_id, input.channelId);
  // 老调用方不传 dedupeKey 时不发这个头，保持旧行为。
  assert.equal(calls[0].headers['x-ac-dedupe-key'], undefined);
});

test('带 dedupeKey 时下发 x-ac-dedupe-key，供服务端关联点击与签发', async () => {
  const calls = [];
  await requestDownloadUrl(
    {
      ...input,
      dedupeKey: 'web-abc|2026-11-04|67f0a66d0b2f421bca0a0001|detail_dialog',
    },
    async (path, init) => {
      calls.push({ path, headers: init.headers });
      return reply({ code: 0, data: { url: 'https://cdn.example/a.apk' } });
    },
  );

  assert.equal(
    calls[0].headers['x-ac-dedupe-key'],
    'web-abc|2026-11-04|67f0a66d0b2f421bca0a0001|detail_dialog',
  );
  assert.equal(calls[0].headers['x-ac-surface'], 'detail_dialog');
});

test('失败后换渠道重试成功：第二次请求返回地址', async () => {
  const replies = [
    reply({ code: 404, message: '资源不存在' }),
    reply({ code: 0, data: { url: 'https://cdn.example/b.apk' } }),
  ];
  const send = async () => replies.shift();

  const first = await requestDownloadUrl(input, send);
  assert.equal(first.ok, false);
  assert.equal(first.reasonCode, 404);
  assert.equal(first.reasonKind, 'no_channel');
  assert.match(first.message, /「官方渠道」暂时不可用：资源不存在/);

  const retry = await requestDownloadUrl(input, send);
  assert.deepEqual(retry, { ok: true, url: 'https://cdn.example/b.apk' });
});

test('非 2xx 归类为 http_status，文案只描述症状、不承诺换源', async () => {
  const failure = await requestDownloadUrl(input, async () =>
    reply({}, { ok: false, status: 502 }),
  );
  assert.equal(failure.ok, false);
  assert.equal(failure.reasonCode, 'http_502');
  assert.equal(failure.reasonKind, 'http_status');
  assert.match(failure.message, /HTTP 502/);
  assert.match(failure.message, /可以重试或稍后再试/);
  assert.doesNotMatch(failure.message, /换一个渠道/);
  assert.doesNotMatch(failure.message, /机型|系统版本/);
});

test('业务失败与无地址归为 no_channel', async () => {
  const businessFailure = await requestDownloadUrl(input, async () =>
    reply({ code: 404, message: '资源不存在' }),
  );
  assert.equal(businessFailure.reasonKind, 'no_channel');
  assert.equal(businessFailure.reasonCode, 404);

  const noUrl = await requestDownloadUrl(input, async () => reply({ code: 0 }));
  assert.equal(noUrl.ok, false);
  assert.equal(noUrl.reasonCode, 'no_url');
  assert.equal(noUrl.reasonKind, 'no_channel');
});

test('超时归为 timeout，网络异常归为 network', async () => {
  const timeout = await requestDownloadUrl(input, async () => {
    const error = new Error('The operation was aborted due to timeout after 3000ms');
    error.name = 'TimeoutError';
    throw error;
  });
  assert.equal(timeout.ok, false);
  assert.equal(timeout.reasonCode, 'timeout');
  assert.equal(timeout.reasonKind, 'timeout');
  assert.match(timeout.message, /响应超时/);
  assert.match(timeout.message, /可以重试或稍后再试/);

  const network = await requestDownloadUrl(input, async () => {
    throw new Error('网络中断');
  });
  assert.equal(network.ok, false);
  assert.equal(network.reasonCode, 'exception');
  assert.equal(network.reasonKind, 'network');
  assert.match(network.message, /网络中断/);
});
