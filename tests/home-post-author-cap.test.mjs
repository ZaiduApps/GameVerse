import test from 'node:test';
import assert from 'node:assert/strict';

// 纯函数直接按相对路径加载（Node 24 原生擦除类型），不走 alias-loader。
import { capByAuthor } from '../src/lib/home-post-author-cap.ts';

const post = (author_name, id) => ({ _id: id, author_name });

const authorsOf = (list) => list.map((item) => item.author_name ?? '');
const countOf = (list, author) => list.filter((item) => item.author_name === author).length;

test('cap 命中：同一作者 3 条只取 2 条', () => {
  const list = [post('A', 1), post('A', 2), post('A', 3)];
  const picked = capByAuthor(list, 2, 2);
  assert.deepEqual(
    picked.map((item) => item._id),
    [1, 2],
  );
});

test('轮转回填：2 位作者各 3 条、limit 6 → 3/3', () => {
  const list = [
    post('A', 1),
    post('A', 2),
    post('A', 3),
    post('B', 4),
    post('B', 5),
    post('B', 6),
  ];
  const picked = capByAuthor(list, 2, 6);
  assert.equal(picked.length, 6);
  assert.equal(countOf(picked, 'A'), 3);
  assert.equal(countOf(picked, 'B'), 3);
  // 先收 cap 段（各 2 条），回填按作者轮转：A 的第 3 条、B 的第 3 条。
  assert.deepEqual(
    picked.map((item) => item._id),
    [1, 2, 4, 5, 3, 6],
  );
});

test('轮转回填：单一作者时退化为顺序回填', () => {
  const list = [post('A', 1), post('A', 2), post('A', 3), post('A', 4)];
  const picked = capByAuthor(list, 2, 4);
  assert.deepEqual(
    picked.map((item) => item._id),
    [1, 2, 3, 4],
  );
});

test('空 author 直接入选，不参与计数也不被拦', () => {
  const list = [post('', 1), post('A', 2), post('A', 3), post('A', 4), post(null, 5)];
  const picked = capByAuthor(list, 2, 4);
  // 空作者：1 与 5 直接入选；A 最多 2 条（2、3）；4 被拦且未回填（已满 4 条）。
  assert.deepEqual(
    picked.map((item) => item._id),
    [1, 2, 3, 5],
  );
  assert.deepEqual(authorsOf(picked), ['', 'A', 'A', '']);
});

test('limit 大于池子：原样返回全部', () => {
  const list = [post('A', 1), post('B', 2)];
  const picked = capByAuthor(list, 2, 10);
  assert.deepEqual(
    picked.map((item) => item._id),
    [1, 2],
  );
});

test('limit = 0 返回空数组（不抛错）', () => {
  assert.deepEqual(capByAuthor([post('A', 1)], 2, 0), []);
  assert.deepEqual(capByAuthor([], 2, 6), []);
});

test('maxPerAuthor = 1：cap 段每位作者各 1 条，再轮转回填', () => {
  const list = [post('A', 1), post('A', 2), post('B', 3), post('B', 4), post('A', 5)];
  const picked = capByAuthor(list, 1, 4);
  assert.equal(picked.length, 4);
  // cap 段：A1、B3；回填轮转：A2、B4（A5 因已满 4 条不进）。
  assert.deepEqual(
    picked.map((item) => item._id),
    [1, 3, 2, 4],
  );
});

test('作者名大小写与首尾空格归一后仍算同一作者', () => {
  const list = [post('Zaidu', 1), post(' zaidu ', 2), post('ZAIDU', 3)];
  const picked = capByAuthor(list, 2, 2);
  assert.deepEqual(
    picked.map((item) => item._id),
    [1, 2],
  );
});

test('keys 可指定其它字段（例如 author_name 缺失时回退到 display_name）', () => {
  const list = [
    { _id: 1, nick: 'A' },
    { _id: 2, nick: 'A' },
    { _id: 3, nick: 'A' },
  ];
  const picked = capByAuthor(list, 2, 2, ['author_name', 'nick']);
  assert.deepEqual(
    picked.map((item) => item._id),
    [1, 2],
  );
});
