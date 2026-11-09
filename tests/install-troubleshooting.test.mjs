import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import React from 'react';

import { renderTsx } from './helpers/render-tsx.mjs';

const COMPONENT = new URL('../src/components/install-troubleshooting-dialog.tsx', import.meta.url).pathname;
const HELP_PAGE = new URL('../src/app/help/install/page.tsx', import.meta.url).pathname;

const OPTIONS = [
  {
    label: '解析包错误',
    symptom: '安装时提示解析包出错、安装包损坏',
    advice: '删掉这个文件重新下载一次',
  },
  {
    label: '装上了打不开',
    symptom: '安装完成后打不开、闪退或黑屏',
    advice: '清除应用数据后重新打开',
  },
  {
    label: '下载失败',
    symptom: '下载没反应、页面空白或一直加载',
    advice: '换一个浏览器，或关闭广告拦截插件后重试',
  },
];

/**
 * 用现有 renderTsx 的模块注入把 `selectedId` 预置成某个选项：
 * 组件里第一次 useState 是弹窗开关，第二次才是选中项，所以按调用顺序注入。
 * 这样无需为测试新增导出，也能断言「选中后」的渲染结果。
 */
function renderWithSelection(selectedId) {
  let useStateCall = 0;
  return renderTsx(COMPONENT, {}, {
    modules: {
      // 只回填纯函数；Dialog / Alert 继续用默认占位组件，children 会被原样渲染。
      '@/lib/utils': { cn: (...args) => args.flat().filter(Boolean).join(' ') },
      react: {
        ...React,
        useState: (initial) => {
          useStateCall += 1;
          return useStateCall === 2 ? [selectedId, () => {}] : [initial, () => {}];
        },
      },
    },
  });
}

test('「无法安装？」入口渲染三选一症状，初始态不展示建议', async () => {
  const html = await renderWithSelection(null);

  assert.match(html, /data-acbox-action="install_help_open"/);
  assert.match(html, /无法安装？/);
  assert.match(html, /装不上或打不开？/);

  for (const { label, symptom } of OPTIONS) {
    assert.match(html, new RegExp(symptom));
    assert.match(html, new RegExp(label));
  }

  // 三个入口都是按钮，并声明互斥的 pressed 状态；键盘焦点由浏览器冒烟验证。
  assert.equal((html.match(/data-acbox-action="install_help_option"/g) || []).length, 3);
  assert.equal((html.match(/aria-pressed="false"/g) || []).length, 3);

  // 每项都要给出完整排障页的落点，锚点必须与 /help/install 的章节 id 对齐。
  const moreLinks = [...html.matchAll(/data-href="([^"]*\/help\/install#[^"]*)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(moreLinks, [
    '/help/install#parse_error',
    '/help/install#incompatible',
    '/help/install#parse_error',
  ]);

  for (const { advice } of OPTIONS) {
    assert.doesNotMatch(html, new RegExp(advice));
  }
});

test('排障页新增 permission 锚点，弹窗与落地页的深链都能落到位（#179）', async () => {
  const source = await readFile(HELP_PAGE, 'utf8');

  // 权限一节：未知来源 / 安装权限被拒，文案与锚点都要在。
  assert.match(source, /id: 'permission'/);
  assert.match(source, /安装权限被拒/);
  assert.match(source, /未知来源/);

  // 弹窗里引用的每个 /help/install#anchor 都必须在页面里有对应章节 id。
  const html = await renderWithSelection(null);
  const anchors = [...html.matchAll(/\/help\/install#([a-z_]+)/g)].map((match) => match[1]);
  assert.ok(anchors.length > 0);
  for (const anchor of new Set(anchors)) {
    assert.match(source, new RegExp(`id: '${anchor}'`), `缺少章节 ${anchor}`);
  }
});

test('选中任一症状后只展示对应的 FAQ 建议', async () => {
  for (const [index, option] of OPTIONS.entries()) {
    const html = await renderWithSelection(
      ['parse_error', 'opens_crash', 'download_failed'][index],
    );

    assert.match(html, new RegExp(`${option.label}：先这样排查`));
    assert.match(html, new RegExp(option.advice));
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);

    for (const other of OPTIONS) {
      if (other.label === option.label) continue;
      assert.doesNotMatch(html, new RegExp(`${other.label}：先这样排查`));
      assert.doesNotMatch(html, new RegExp(other.advice));
    }
  }
});
