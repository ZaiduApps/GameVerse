import assert from 'node:assert/strict';
import test from 'node:test';

import { requestDownloadUrl } from '../src/lib/download-request.ts';

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

test('成功时返回可下发的地址', async () => {
  const calls = [];
  const result = await requestDownloadUrl(input, async (path, init) => {
    calls.push({ path, body: JSON.parse(init.body), surface: init.headers['x-ac-surface'] });
    return reply({ code: 0, data: { url: 'https://cdn.example/a.apk' } });
  });

  assert.deepEqual(result, { ok: true, url: 'https://cdn.example/a.apk' });
  assert.equal(calls[0].path, '/game/getAppDownload');
  assert.equal(calls[0].surface, 'detail_dialog');
  assert.equal(calls[0].body.channel_id, input.channelId);
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
  assert.match(first.message, /「官方渠道」暂时不可用：资源不存在/);

  const retry = await requestDownloadUrl(input, send);
  assert.deepEqual(retry, { ok: true, url: 'https://cdn.example/b.apk' });
});

test('HTTP 非 2xx、业务失败、网络异常都转成可见失败原因', async () => {
  const httpFailure = await requestDownloadUrl(input, async () =>
    reply({}, { ok: false, status: 502 }),
  );
  assert.equal(httpFailure.ok, false);
  assert.equal(httpFailure.reasonCode, 'http_502');
  assert.match(httpFailure.message, /请换一个渠道重试/);

  const noUrl = await requestDownloadUrl(input, async () => reply({ code: 0 }));
  assert.equal(noUrl.ok, false);
  assert.equal(noUrl.reasonCode, 'no_url');

  const thrown = await requestDownloadUrl(input, async () => {
    throw new Error('网络中断');
  });
  assert.equal(thrown.ok, false);
  assert.equal(thrown.reasonCode, 'exception');
  assert.match(thrown.message, /网络中断/);
});
