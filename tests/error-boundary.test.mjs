import assert from 'node:assert/strict';

import test from 'node:test';

import { renderTsx } from './helpers/render-tsx.mjs';

const APP_ERROR = new URL('../src/app/error.tsx', import.meta.url).pathname;
const GLOBAL_ERROR = new URL('../src/app/global-error.tsx', import.meta.url).pathname;

function makeError(digest) {
  const error = new Error('boom');
  if (digest) error.digest = digest;
  return error;
}

test('路由级错误边界渲染重试、返回首页与错误编号', async () => {
  const html = await renderTsx(APP_ERROR, { error: makeError('abc123'), reset: () => {} });

  assert.match(html, /页面加载出错了/);
  assert.match(html, /重试/);
  assert.match(html, /返回首页/);
  assert.match(html, /错误编号：abc123/);
  assert.match(html, /data-href="\/"/);
});

test('路由级错误边界在没有 digest 时不渲染空错误编号', async () => {
  const html = await renderTsx(APP_ERROR, { error: makeError(), reset: () => {} });

  assert.doesNotMatch(html, /错误编号/);
  assert.match(html, /重试/);
});

test('全局错误边界自带 html/body 并给出重试出口', async () => {
  const html = await renderTsx(GLOBAL_ERROR, { error: makeError(), reset: () => {} });

  assert.match(html, /^<html lang="zh-CN">/);
  assert.match(html, /<body[^>]*>/);
  assert.match(html, /站点加载出错了/);
  assert.match(html, /重试/);
});

test('全局错误边界不依赖站点样式表（只用内联样式）', async () => {
  const html = await renderTsx(GLOBAL_ERROR, { error: makeError(), reset: () => {} });

  assert.match(html, /style="/);
  // 类名依赖 globals.css，根布局崩溃时样式表不在，出现 class 就说明退化成了裸样式。
  assert.doesNotMatch(html, /class="/);
});
