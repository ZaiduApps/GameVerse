import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveHeroVideo } from '../src/app/app/[id]/game-detail-video.ts';

const YOUTUBE_EMBED = 'https://www.youtube.com/embed';

test('自托管 mp4 直链按文件解析，封面原样保留', () => {
  const view = resolveHeroVideo({
    video_preview: 'https://cdn.apks.cc/uploads/1075dc256e665d8039a474420d44597b.mp4',
    video_image: 'https://cdn.apks.cc/uploads/1075dc256e665d8039a474420d44597b.webp',
  });
  assert.deepEqual(view, {
    source: { kind: 'file', url: 'https://cdn.apks.cc/uploads/1075dc256e665d8039a474420d44597b.mp4' },
    poster: 'https://cdn.apks.cc/uploads/1075dc256e665d8039a474420d44597b.webp',
  });
});

test('mp4 带 query 仍识别为文件，且地址不被改写', () => {
  const url = 'https://cdn.apks.cc/uploads/down_1769349232366_949.mp4?type=ha';
  const view = resolveHeroVideo({ video_preview: url });
  assert.deepEqual(view, { source: { kind: 'file', url } });
});

test('YouTube /embed 链接规范化，视频 ID 不变', () => {
  const view = resolveHeroVideo({
    video_preview: 'https://www.youtube.com/embed/EXN0VgFIZWs?vq=large&rel=0',
  });
  assert.deepEqual(view, {
    source: {
      kind: 'embed',
      provider: 'youtube',
      url: `${YOUTUBE_EMBED}/EXN0VgFIZWs?rel=0&playsinline=1&modestbranding=1`,
    },
  });
});

test('youtu.be 短链与 /watch?v= 链接都规范化成 embed', () => {
  const shortLink = resolveHeroVideo({ video_preview: 'https://youtu.be/ieGBgaDAbYM?t=3' });
  assert.deepEqual(shortLink, {
    source: {
      kind: 'embed',
      provider: 'youtube',
      url: `${YOUTUBE_EMBED}/ieGBgaDAbYM?rel=0&playsinline=1&modestbranding=1`,
    },
  });

  const watchLink = resolveHeroVideo({
    video_preview: 'https://www.youtube.com/watch?v=7mgSwVAVi_E',
  });
  assert.deepEqual(watchLink, {
    source: {
      kind: 'embed',
      provider: 'youtube',
      url: `${YOUTUBE_EMBED}/7mgSwVAVi_E?rel=0&playsinline=1&modestbranding=1`,
    },
  });
});

test('GP 抓取残留的失效 .bin 链接不产生渲染入口', () => {
  const view = resolveHeroVideo({
    video_preview: 'https://play-lh.googleusercontent.com/down_1772701438419_667.bin?type=ha',
    video_image: 'https://play-lh.googleusercontent.com/cover_1772701438419_667.bin?type=ha',
  });
  assert.equal(view, null);
});

test('video_preview 为空 / null / 缺省时返回 null', () => {
  assert.equal(resolveHeroVideo({ video_preview: '' }), null);
  assert.equal(resolveHeroVideo({ video_preview: null }), null);
  assert.equal(resolveHeroVideo({}), null);
});

test('未解析的 asset:// 内部协议不放行', () => {
  assert.equal(resolveHeroVideo({ video_preview: 'asset://uploads/1075dc256e665d8039a474420d44597b.mp4' }), null);
});

test('封面不是 http(s) 或后缀不可识别时不带 poster 键', () => {
  const url = 'https://cdn.apks.cc/uploads/1075dc256e665d8039a474420d44597b.mp4';

  const binPoster = resolveHeroVideo({
    video_preview: url,
    video_image: 'https://cdn.apks.cc/uploads/cover_1772701438419_667.bin',
  });
  assert.ok(binPoster);
  assert.equal('poster' in binPoster, false);

  const nonHttpPoster = resolveHeroVideo({ video_preview: url, video_image: 'asset://uploads/cover.webp' });
  assert.ok(nonHttpPoster);
  assert.equal('poster' in nonHttpPoster, false);
});
