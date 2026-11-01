import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { pickDownloadRetryTarget } from '../src/lib/download-retry.ts';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

function resource(channelId, name) {
  return {
    _id: `res-${channelId}`,
    channel: { _id: channelId, name, icon: '', code: 'mt' },
  };
}

test('失败后优先换一个不同渠道重试', () => {
  const resources = [resource('ch-a', '官方渠道'), resource('ch-b', '备用渠道')];
  const target = pickDownloadRetryTarget(resources, 'ch-a');

  assert.ok(target);
  assert.equal(target.resource.channel._id, 'ch-b');
  assert.equal(target.label, '换「备用渠道」重试');
});

test('只有一个渠道时退回原渠道重试', () => {
  const resources = [resource('ch-a', '官方渠道')];
  const target = pickDownloadRetryTarget(resources, 'ch-a');

  assert.ok(target);
  assert.equal(target.resource.channel._id, 'ch-a');
  assert.equal(target.label, '重试');
});

test('没有失败渠道或没有资源时不给重试目标', () => {
  assert.equal(pickDownloadRetryTarget([resource('ch-a', '官方渠道')], null), null);
  assert.equal(pickDownloadRetryTarget([resource('ch-a', '官方渠道')], ''), null);
  assert.equal(pickDownloadRetryTarget([], 'ch-a'), null);
  assert.equal(pickDownloadRetryTarget(undefined, 'ch-a'), null);
});

test('弹窗把失败态接到可见提示、换渠道重试与 fail_reason 上报（源码级）', async () => {
  const source = await readSource('../src/components/game-download-dialog.tsx');

  assert.match(source, /pickDownloadRetryTarget\(resources, failedChannelId\)/);
  assert.match(source, /<DownloadFailureAlert/);
  assert.match(source, /onRetry=\{[^}]*handleDownloadClick\(retryTarget\.resource\)/s);
  assert.match(source, /reportDownloadFailure\(\{/);
  assert.match(source, /pump: 'web_detail_dialog'/);
  // 失败不是死链：不允许再只靠 throw 把错误吞到通用 catch。
  assert.doesNotMatch(source, /throw new Error\('网络请求失败'\)/);
});
