import assert from 'node:assert/strict';
import test from 'node:test';

import { buildScreenViewProps } from '../src/lib/screen-view-props.ts';

test('详情页带 pkg，便于按游戏聚合浏览', () => {
  const props = buildScreenViewProps('/app/com.tencent.ig', '', '');
  assert.equal(props.route_template, '/app/[id]');
  assert.equal(props.pkg, 'com.tencent.ig');
  assert.equal(props.post_id, undefined);
});

test('帖子页带 post_id，stats.community 直接用这个维度去重', () => {
  const postId = '507f1f77bcf86cd799439011';
  const props = buildScreenViewProps(`/community/post/${postId}`, '', '');
  assert.equal(props.route_template, '/community/post/[id]');
  assert.equal(props.post_id, postId);
  assert.equal(props.pkg, undefined);
});

test('帖子 id 含转义字符时按解码后的值上报', () => {
  const props = buildScreenViewProps('/community/post/%E4%B8%AD%E6%96%87', '', '');
  assert.equal(props.post_id, '中文');
});

test('其它页面不带 pkg/post_id，UTM 照常进 props', () => {
  const props = buildScreenViewProps('/rankings', '?utm_source=wechat&utm_medium=cpc', 'https://example.com');
  assert.equal(props.route_template, '/rankings');
  assert.equal(props.pkg, undefined);
  assert.equal(props.post_id, undefined);
  assert.equal(props.utm_source, 'wechat');
  assert.equal(props.utm_medium, 'cpc');
  assert.equal(props.referer, 'https://example.com');
});

test('带站内入口参数的话题页：透传 from/pkg/topic_slug 并归为 internal_entry', () => {
  const props = buildScreenViewProps(
    '/community/topic/game-com-tencent-ig',
    '?from=detail_tab&pkg=com.tencent.ig&topic_slug=game-com-tencent-ig',
    '',
  );
  assert.equal(props.route_template, '/community/topic/[idOrSlug]');
  assert.equal(props.from, 'detail_tab');
  assert.equal(props.pkg, 'com.tencent.ig');
  assert.equal(props.topic_slug, 'game-com-tencent-ig');
  assert.equal(props.traffic_class, 'internal_entry');
});

test('空入口参数 + 站外 referer：natural_external', () => {
  const props = buildScreenViewProps(
    '/community/topic/game-com-tencent-ig',
    '',
    'https://www.bing.com/search?q=pubg',
  );
  assert.equal(props.traffic_class, 'natural_external');
  // 没有查询参数时，话题 slug 从路径补，审计仍能按话题聚合。
  assert.equal(props.topic_slug, 'game-com-tencent-ig');
});

test('空 referer 只能记 unknown，不能冒充自然流量', () => {
  const props = buildScreenViewProps('/community/topic/game-com-tencent-ig', '', '');
  assert.equal(props.traffic_class, 'unknown');

  const malformed = buildScreenViewProps(
    '/community/topic/game-com-tencent-ig',
    '',
    'not a url',
  );
  assert.equal(malformed.traffic_class, 'unknown');
});

test('同站 referer 但无入口参数：internal_entry', () => {
  for (const referer of ['https://apks.cc/community', 'https://m.apks.cc/community/topics']) {
    const props = buildScreenViewProps('/community/topic/game-com-tencent-ig', '', referer);
    assert.equal(props.traffic_class, 'internal_entry', referer);
  }
});

test('详情页路径推导的 pkg 不算入口参数，traffic_class 只看查询与 referer', () => {
  const props = buildScreenViewProps('/app/com.tencent.ig', '', '');
  assert.equal(props.pkg, 'com.tencent.ig');
  assert.equal(props.from, undefined);
  assert.equal(props.traffic_class, 'unknown');
});
