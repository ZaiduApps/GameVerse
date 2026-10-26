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
