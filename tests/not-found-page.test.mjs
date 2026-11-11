/**
 * 404 页恢复入口（待决策 #203）。
 *
 * 三条硬约束：
 * 1. 仍是 404 语义：不 redirect、不改 200、不输出 JSON-LD，metadata 保持 noindex；
 * 2. 正文至少含站内搜索入口（GET /search?q=）；
 * 3. 同类游戏与热门下载 Top 5 都必须「取不到就整块不渲染」。
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import React from 'react';

import { renderTsx } from './helpers/render-tsx.mjs';
import {
  extractGameIdentifierFromPath,
  normalizeRecoveryGames,
} from '../src/lib/not-found-recovery.ts';

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

const VIEW_PATH = new URL('../src/components/not-found-view.tsx', import.meta.url).pathname;

function passthrough(tag, extraProps = {}) {
  // 吃掉 Button/Card 的非 DOM props，避免 React 在测试输出里刷警告。
  return ({ className, children, asChild, variant, size, ...rest }) =>
    React.createElement(tag, { ...extraProps, className, ...rest }, children);
}

const renderView = (props) =>
  renderTsx(VIEW_PATH, props, {
    modules: {
      '@/components/ui/button': { Button: passthrough('button') },
      '@/components/ui/card': {
        Card: passthrough('div'),
        CardContent: passthrough('div'),
        CardDescription: passthrough('p'),
        CardHeader: passthrough('div'),
      },
      '@/components/ui/input': { Input: passthrough('input') },
      '@/components/not-found-similar-games.client': {
        __esModule: true,
        default: () => React.createElement('div', { 'data-testid': 'similar-slot' }),
      },
      'next/link': { __esModule: true, default: passthrough('a') },
    },
  });

test('404 页仍然保留 noindex 语义，不跳转也不输出 JSON-LD', async () => {
  const source = await readSource('../src/app/not-found.tsx');
  assert.match(source, /index:\s*false/);
  assert.match(source, /follow:\s*true/);
  assert.doesNotMatch(source, /\bredirect\s*\(/);
  assert.doesNotMatch(source, /permanentRedirect\s*\(/);
  assert.doesNotMatch(source, /application\/ld\+json/);
  // 热门下载走服务端取数，失败时返回空数组而不是抛错打崩 404。
  assert.match(source, /\/game\/rankings\?limit=/);
  assert.match(source, /catch\s*\{\s*return \[\];/);
});

test('404 正文始终有站内搜索，热门榜有数据才渲染', async () => {
  const html = await renderView({
    hotGames: [
      { pkg: 'com.example.alpha', name: '阿尔法', downloads: '1,000+' },
      { pkg: 'com.example.beta', name: '贝塔' },
    ],
  });

  assert.match(html, /action="\/search"/);
  assert.match(html, /method="get"/);
  assert.match(html, /name="q"/);
  // 同类游戏挂载点始终在，内部取不到推荐时由组件自己返回 null。
  assert.match(html, /data-testid="similar-slot"/);
  // 热门下载 Top 5：条目链接到详情页，并带下载量文案。
  assert.match(html, /热门下载 Top 5/);
  assert.match(html, /href="\/app\/com.example.alpha"/);
  assert.match(html, /href="\/app\/com.example.beta"/);
  assert.match(html, /1,000\+ 下载/);
});

test('热门榜为空时整块不渲染，只剩搜索与同类入口', async () => {
  const html = await renderView({ hotGames: [] });
  assert.match(html, /action="\/search"/);
  assert.doesNotMatch(html, /热门下载 Top 5/);
  assert.doesNotMatch(html, /\/app\/com\.example/);
});

test('同类游戏只在失效的游戏详情路径上取推荐', async () => {
  const source = await readSource('../src/components/not-found-similar-games.client.tsx');
  assert.match(source, /usePathname/);
  assert.match(source, /extractGameIdentifierFromPath/);
  assert.match(source, /\/game\/recommendedApp\?param=/);
  // 空结果 / 失败返回 null（整块不渲染）。
  assert.match(source, /if \(games\.length === 0\) return null;/);
});

test('extractGameIdentifierFromPath 只认 /app/<单段>', () => {
  assert.equal(extractGameIdentifierFromPath('/app/com.example.game'), 'com.example.game');
  assert.equal(extractGameIdentifierFromPath('/app/com.example.game/'), 'com.example.game');
  assert.equal(extractGameIdentifierFromPath('/app/com.example.game?from=x'), 'com.example.game');
  assert.equal(extractGameIdentifierFromPath('/app'), null);
  assert.equal(extractGameIdentifierFromPath('/app/download/com.example.game'), null);
  assert.equal(extractGameIdentifierFromPath('/community/post/1'), null);
  assert.equal(extractGameIdentifierFromPath(''), null);
});

test('normalizeRecoveryGames 兼容榜单/推荐两种返回并去重', () => {
  const rankings = {
    code: 0,
    data: {
      downloads: [
        { pkg: 'com.a', name: 'Google Play A', metadata: { chs: '甲' } },
        { pkg: 'com.a', name: '重复包名' },
        { pkg: '', name: '无包名' },
        { pkg: 'com.b', name: '乙', download_count_show: '1 万+' },
      ],
    },
  };
  assert.deepEqual(normalizeRecoveryGames(rankings, 5), [
    { pkg: 'com.a', name: '甲', icon: '', downloads: undefined },
    { pkg: 'com.b', name: '乙', icon: '', downloads: '1 万+' },
  ]);

  // 推荐接口直接返回数组。
  assert.deepEqual(normalizeRecoveryGames([{ pkg: 'com.c', name: '丙' }], 1), [
    { pkg: 'com.c', name: '丙', icon: '', downloads: undefined },
  ]);
  assert.deepEqual(normalizeRecoveryGames(null, 5), []);
});
