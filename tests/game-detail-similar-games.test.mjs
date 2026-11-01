/**
 * 详情页「相似推荐」的渲染数据（src/app/app/[id]/game-detail-stitch-mapper.ts）。
 *
 * 历史缺陷：真实推荐为空时用稿件三款示例游戏撑版式，条目 `href: ''`——页面渲染出
 * 3 个点不动的死链卡片，爬虫也会把它们当链接看。现在空列表必须返回空数组，
 * 让 SimilarGamesCard 走 `items.length === 0` 不渲染整块。
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

// 被测模块是 TS 且用无扩展名的相对导入；裸 node 只认带扩展名的路径。
register('./helpers/src-resolve-hook.mjs', import.meta.url);

const { buildSimilarGames } = await import(
  '../src/app/app/[id]/game-detail-stitch-mapper.ts'
);

test('buildSimilarGames: 没有真实推荐时返回空数组，不造占位卡片', () => {
  assert.deepEqual(buildSimilarGames([]), []);
});

test('buildSimilarGames: 真实推荐逐条映射成 /app/<pkg> 链接，无空 href', () => {
  const items = [
    { _id: 'id-a', pkg: 'com.example.alpha', name: 'Alpha', star: 4.5, summary: '阿尔法游戏', icon: 'https://img.example/a.png' },
    { _id: 'id-b', pkg: 'com.example.beta', name: 'Beta', star: '4', summary: '', icon: '' },
    { _id: 'id-c', pkg: 'com.example.gamma', name: 'Gamma', star: null, summary: '伽马', icon: 'https://img.example/c.png' },
  ];

  const views = buildSimilarGames(items);

  assert.equal(views.length, 3);
  assert.deepEqual(
    views.map((item) => item.href),
    [
      '/app/com.example.alpha',
      '/app/com.example.beta',
      '/app/com.example.gamma',
    ],
  );
  for (const view of views) {
    assert.ok(view.href.startsWith('/app/'), `href 必须是详情页内链：${view.href}`);
    assert.notEqual(view.href, '');
    assert.ok(view.name);
    assert.ok(view.key);
  }
  // 包名要按 URL 规则编码，避免 / 等字符把路径拆开
  assert.equal(
    buildSimilarGames([{ _id: 'x', pkg: 'com.example/a b', name: 'X' }])[0].href,
    '/app/com.example%2Fa%20b',
  );
});
