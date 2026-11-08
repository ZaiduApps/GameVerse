/**
 * 社区入口 B 档：固定话题 URL 与 link_click 归因字段（提案 2026-11-08 §1.4 / §2）。
 *
 * 这些字段是 7 天实验判定线（M1/M2/D1）的唯一数据来源，口径一旦漂移，
 * hk `event-logs` 就无法按 pkg / entry_action 分组，实验直接判「不可判」。
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  appendCommunityEntryParams,
  buildCommunityPostHref,
  buildGameTopicHref,
  buildGameTopicPath,
  buildLinkClickProps,
  toTrackingTarget,
  topicSlugFromPkg,
} from '../src/lib/community-entry.ts';

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

test('包名归一化与 interface GameTopicSyncService 规则一致', () => {
  const cases = [
    ['com.tencent.ig', 'game-com-tencent-ig'],
    ['com.droiddeck.launcher', 'game-com-droiddeck-launcher'],
    ['com.ScarletWork.CounterFlame', 'game-com-scarletwork-counterflame'],
    ['com.supercell.clashroyale', 'game-com-supercell-clashroyale'],
    ['com.tencent.mhadv', 'game-com-tencent-mhadv'],
    ['com.wemadeconnect.aos.makedrama.google', 'game-com-wemadeconnect-aos-makedrama-google'],
  ];
  for (const [pkg, slug] of cases) {
    assert.equal(topicSlugFromPkg(pkg), slug, pkg);
  }
  assert.equal(topicSlugFromPkg(''), '');
  assert.equal(topicSlugFromPkg(null), '');
  assert.equal(buildGameTopicPath(''), '');
});

test('固定话题链接带 from/pkg/topic_slug，落地页可直接生成 traffic_class', () => {
  const href = buildGameTopicHref('com.tencent.ig', { from: 'detail_tab' });
  assert.equal(
    href,
    '/community/topic/game-com-tencent-ig?from=detail_tab&pkg=com.tencent.ig&topic_slug=game-com-tencent-ig',
  );
  assert.equal(buildGameTopicHref('', { from: 'detail_tab' }), '');
});

test('帖子链接按入口带来源参数；to 只取路径', () => {
  const href = buildCommunityPostHref('507f1f77bcf86cd799439011', {
    from: 'topic_board',
    pkg: 'com.tencent.ig',
    topicSlug: 'game-com-tencent-ig',
  });
  assert.equal(
    href,
    '/community/post/507f1f77bcf86cd799439011?from=topic_board&pkg=com.tencent.ig&topic_slug=game-com-tencent-ig',
  );
  assert.equal(toTrackingTarget(href), '/community/post/507f1f77bcf86cd799439011');
  assert.equal(buildCommunityPostHref(''), '');
});

test('appendCommunityEntryParams 不覆盖已有查询串', () => {
  assert.equal(
    appendCommunityEntryParams('/x?utm_source=wechat', { from: 'a', pkg: '', topicSlug: '' }),
    '/x?utm_source=wechat&from=a',
  );
});

test('link_click props 字段齐全，空值不落库', () => {
  assert.deepEqual(
    buildLinkClickProps({
      entryAction: 'detail_post_click',
      from: 'detail_section',
      to: '/community/post/507f1f77bcf86cd799439011',
      pkg: 'com.tencent.ig',
      topicSlug: 'game-com-tencent-ig',
    }),
    {
      entry_action: 'detail_post_click',
      from: 'detail_section',
      to: '/community/post/507f1f77bcf86cd799439011',
      pkg: 'com.tencent.ig',
      topic_slug: 'game-com-tencent-ig',
    },
  );

  assert.deepEqual(
    buildLinkClickProps({
      entryAction: 'detail_tab',
      from: 'detail_tab',
      to: '/community/topic/game-com-tencent-ig',
      pkg: null,
      topicSlug: undefined,
    }),
    {
      entry_action: 'detail_tab',
      from: 'detail_tab',
      to: '/community/topic/game-com-tencent-ig',
    },
  );
});

test('详情页把三个入口都接到固定话题，移动端 Tab 改为路由跳转', async () => {
  const [viewSource, sectionSource, feedSource, tabsSource] = await Promise.all([
    readSource('../src/app/app/[id]/GameDetailView.tsx'),
    readSource('../src/app/app/[id]/GameCommunitySection.tsx'),
    readSource('../src/app/app/[id]/GameCommunityFeed.client.tsx'),
    readSource('../src/app/app/[id]/GameDetailMobileTabs.client.tsx'),
  ]);

  assert.match(viewSource, /buildGameTopicHref\(game\.pkg, \{ from: 'detail_guide' \}\)/);
  assert.match(viewSource, /buildGameTopicHref\(game\.pkg, \{ from: 'detail_tab' \}\)/);
  assert.match(sectionSource, /buildGameTopicHref\(game\.pkg, \{ from: 'detail_section' \}\)/);
  assert.match(feedSource, /onClick=\{handleSectionEntryClick\}/);
  assert.match(feedSource, /entryAction: 'detail_post_click'/);
  assert.match(tabsSource, /router\.push\(communityHref\)/);
  assert.match(tabsSource, /entryAction: 'detail_tab'/);
});

test('话题页帖子列表与公告带 topic_post_click / topic_announcement_cta', async () => {
  const boardSource = await readSource(
    '../src/app/community/topic/[idOrSlug]/CommunityTopicBoardView.tsx',
  );
  assert.match(boardSource, /entryAction: 'topic_post_click'/);
  assert.match(boardSource, /entryAction: 'topic_announcement_cta'/);
  assert.match(boardSource, /linkTracking=\{\{/);
});
