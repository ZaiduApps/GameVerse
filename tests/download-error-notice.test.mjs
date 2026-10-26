import assert from 'node:assert/strict';
import test from 'node:test';

import * as downloadErrorState from '../src/lib/download-error-state.ts';
import {
  DOWNLOAD_CHANNELS_ANCHOR,
  DOWNLOAD_VERSIONS_ANCHOR,
  buildDownloadErrorActions,
  describeDownloadError,
  isDownloadErrorFlag,
  parseDownloadErrorReason,
  resolveDownloadErrorState,
} from '../src/lib/download-error-state.ts';
import { renderTsx } from './helpers/render-tsx.mjs';

const NOTICE_VIEW = new URL('../src/app/app/[id]/DownloadErrorNotice.client.tsx', import.meta.url).pathname;

const renderNotice = (props) =>
  renderTsx(NOTICE_VIEW, props, {
    pick: (exports) => exports.DownloadErrorNoticeView,
    modules: { '@/lib/download-error-state': downloadErrorState },
  });

test('download_error 标记只认 1/true', () => {
  assert.equal(isDownloadErrorFlag('1'), true);
  assert.equal(isDownloadErrorFlag('true'), true);
  assert.equal(isDownloadErrorFlag('0'), false);
  assert.equal(isDownloadErrorFlag(''), false);
  assert.equal(isDownloadErrorFlag(null), false);
});

test('失败原因归一化：只认 resource，其余按渠道不可用兜底', () => {
  assert.equal(parseDownloadErrorReason('resource'), 'resource');
  assert.equal(parseDownloadErrorReason('RESOURCE'), 'resource');
  assert.equal(parseDownloadErrorReason('channel'), 'channel');
  assert.equal(parseDownloadErrorReason(''), 'channel');
  assert.equal(parseDownloadErrorReason(null), 'channel');
});

test('三条可操作路径的链接：渠道锚点、反馈预填、版本锚点', () => {
  const actions = buildDownloadErrorActions({
    gameName: '示例游戏',
    pageUrl: '/app/com.demo.game',
    reason: 'resource',
  });

  assert.deepEqual(actions.map((action) => action.label), ['换渠道重试', '反馈失效', '查看其他版本']);
  assert.equal(actions[0].href, `#${DOWNLOAD_CHANNELS_ANCHOR}`);
  assert.equal(actions[2].href, `#${DOWNLOAD_VERSIONS_ANCHOR}`);

  const report = new URL(actions[1].href, 'https://apks.cc');
  assert.equal(report.pathname, '/submit-resource');
  assert.equal(report.searchParams.get('resourceName'), '示例游戏');
  assert.equal(report.searchParams.get('sourceUrl'), '/app/com.demo.game');
  assert.equal(report.searchParams.get('reason'), 'resource');
});

test('两条失败原因的文案不同', () => {
  const channel = describeDownloadError('channel');
  const resource = describeDownloadError('resource');

  assert.notEqual(channel.title, resource.title);
  assert.match(channel.title, /渠道/);
  assert.match(resource.title, /资源/);
  assert.notEqual(channel.description, resource.description);
});

test('resolveDownloadErrorState 从查询串读出失败态', () => {
  const failed = resolveDownloadErrorState(new URLSearchParams('download_error=1&download_error_reason=resource'));
  assert.deepEqual(failed, { failed: true, reason: 'resource' });

  const legacy = resolveDownloadErrorState(new URLSearchParams('download_error=1'));
  assert.deepEqual(legacy, { failed: true, reason: 'channel' });

  const normal = resolveDownloadErrorState(new URLSearchParams('from=push'));
  assert.equal(normal.failed, false);
});

test('渠道不可用态渲染三条出口与渠道文案', async () => {
  const html = await renderNotice({ reason: 'channel', gameName: '示例游戏', pageUrl: '/app/com.demo.game' });

  assert.match(html, /这个下载渠道暂时不可用/);
  assert.match(html, /换渠道重试/);
  assert.match(html, /反馈失效/);
  assert.match(html, /查看其他版本/);
  assert.match(html, new RegExp(`href="#${DOWNLOAD_CHANNELS_ANCHOR}"`));
  assert.match(html, new RegExp(`href="#${DOWNLOAD_VERSIONS_ANCHOR}"`));
  assert.match(html, /href="\/submit-resource\?[^"]*resourceName=/);
  assert.doesNotMatch(html, /这个资源暂时失效了/);
});

test('资源失效态渲染资源文案，三条出口保持完整', async () => {
  const html = await renderNotice({ reason: 'resource', gameName: '示例游戏', pageUrl: '/app/com.demo.game' });

  assert.match(html, /这个资源暂时失效了/);
  assert.match(html, /换渠道重试/);
  assert.match(html, /反馈失效/);
  assert.match(html, /查看其他版本/);
  assert.doesNotMatch(html, /这个下载渠道暂时不可用/);
});

test('未带失败原因时按渠道不可用展示', async () => {
  const html = await renderNotice({ reason: 'channel' });
  assert.match(html, /这个下载渠道暂时不可用/);
});
