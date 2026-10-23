/**
 * 按作者闸门截取列表 —— 纯函数，零 import。
 *
 * 规则：
 * 1. 按给定顺序（调用方已按 publish_at 倒序）遍历，同一作者最多保留 `maxPerAuthor` 条；
 * 2. 不足 `limit` 条时回填：超限条目按作者分组入队，再按作者轮转各取 1 条，直到凑满 `limit`；
 *    只有一位作者时轮转退化为顺序回填；
 * 3. 没有作者名的条目直接入选，不参与计数。
 *
 * 去重键默认是 `author_name`，**不要传 `author_id`**：线上实测 `zaidu` 与「聪明牛🐮」
 * 共用同一个 `author_id`（69a407377bc9142200763b36），按 id 去重会把首页砍到 2 条。
 */
export function capByAuthor<T>(
  list: readonly T[],
  maxPerAuthor: number,
  limit: number,
  keys: readonly string[] = ['author_name'],
): T[] {
  const cap = Math.max(1, Math.floor(Number(maxPerAuthor) || 0) || 1);
  const take = Math.max(0, Math.floor(Number(limit) || 0));
  if (!Array.isArray(list) || list.length === 0 || take === 0) return [];

  const authorOf = (item: T): string => {
    if (!item || typeof item !== 'object') return '';
    const record = item as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim().toLowerCase();
    }
    return '';
  };

  const counts = new Map<string, number>();
  const selected: T[] = [];
  // 超限条目按作者分组，保留各自的原始顺序（Map 用首次出现顺序迭代，即轮转的出发点）。
  const overflowQueues = new Map<string, T[]>();
  for (const item of list) {
    const author = authorOf(item);
    if (!author) {
      selected.push(item);
      continue;
    }
    const used = counts.get(author) ?? 0;
    if (used < cap) {
      selected.push(item);
      counts.set(author, used + 1);
      continue;
    }
    const queue = overflowQueues.get(author);
    if (queue) queue.push(item);
    else overflowQueues.set(author, [item]);
  }
  if (selected.length >= take) return selected.slice(0, take);

  // 按作者轮转回填：每轮每位作者各取 1 条，避免回填又让单作者把首页占满。
  const queues = Array.from(overflowQueues.values());
  const cursors = new Array<number>(queues.length).fill(0);
  while (selected.length < take) {
    let tookInRound = false;
    for (let i = 0; i < queues.length && selected.length < take; i += 1) {
      const queue = queues[i];
      const cursor = cursors[i];
      if (cursor >= queue.length) continue;
      selected.push(queue[cursor]);
      cursors[i] = cursor + 1;
      tookInRound = true;
    }
    if (!tookInRound) break;
  }
  return selected.slice(0, take);
}
