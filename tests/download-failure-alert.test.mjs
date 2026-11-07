import assert from 'node:assert/strict';
import test from 'node:test';

import React from 'react';

import { renderTsx } from './helpers/render-tsx.mjs';

const ALERT_VIEW = new URL('../src/components/download-failure-alert.tsx', import.meta.url).pathname;

// 只替换 UI 原子：保留 role / data-* 与 children，其余按仓库既有方式透传。
function passthrough(tag, extraProps = {}) {
  return ({ className, children, ...rest }) =>
    React.createElement(tag, { ...extraProps, className, ...rest }, children);
}

const alertModule = {
  Alert: passthrough('div', { role: 'alert' }),
  AlertTitle: passthrough('h5'),
  AlertDescription: passthrough('div'),
};
const buttonModule = {
  Button: passthrough('button'),
};

const renderAlert = (props) =>
  renderTsx(ALERT_VIEW, props, {
    modules: {
      '@/components/ui/alert': alertModule,
      '@/components/ui/button': buttonModule,
    },
  });

test('失败提示是可见 alert，重试与备用渠道是两个独立动作', async () => {
  const html = await renderAlert({
    message: '「官方渠道」暂时不可用：资源不存在',
    retryLabel: '重试',
    onRetry: () => {},
    backupLabel: '备用渠道「备用渠道」',
    onBackup: () => {},
  });

  assert.match(html, /role="alert"/);
  assert.match(html, /下载失败/);
  assert.match(html, /「官方渠道」暂时不可用：资源不存在/);
  assert.match(html, /重试/);
  assert.match(html, /备用渠道「备用渠道」/);
  assert.match(html, /data-acbox-action="game_download_retry"/);
  assert.match(html, /data-acbox-action="game_download_backup"/);
});

test('没有备用渠道时只渲染重试按钮', async () => {
  const html = await renderAlert({
    message: '「官方渠道」暂时没有响应（HTTP 502），可以重试或稍后再试',
    retryLabel: '重试',
    onRetry: () => {},
    backupLabel: null,
  });

  assert.match(html, /game_download_retry/);
  assert.doesNotMatch(html, /game_download_backup/);
});

test('参数缺失等没有可操作目标时不渲染按钮', async () => {
  const html = await renderAlert({
    message: '下载参数缺失，请刷新页面后重试',
    retryLabel: null,
    backupLabel: null,
  });

  assert.match(html, /下载参数缺失/);
  assert.doesNotMatch(html, /game_download_retry/);
  assert.doesNotMatch(html, /game_download_backup/);
});
