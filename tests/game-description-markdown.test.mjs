import assert from 'node:assert/strict';
import test from 'node:test';

import { formatDescriptionHtml } from '../src/app/app/[id]/game-detail-presenter.ts';

// 样本按线上 com.droiddeck.launcher 的 GitHub Release 正文结构内联：HTML 骨架 +
// Markdown 内容混排（线上原文被截断在最后一行的链接里，这里保留了完整句子）。
const MIXED_SAMPLE = `<p align="center"><a href="https://discord.gg/example"><img src="https://img.shields.io/badge/Discord-Join-blue" alt="Join the Discord"></a></p>

### Features

- Added **SteamVR on Meta Quest 3 and 3S** from the standard APK. (@Jagger15, [#642](https://github.com/Droid-Deck/DroidDeck/pull/642))

  <details>
  <summary>Flat games on Quest with hand tracking</summary>

  <img src="https://example.com/quest-flat-hands.gif" width="50%" alt="Flat games on Quest">
  </details>
- Added **Meta Quest 2** support.
`;

test('混合样本按 Markdown 渲染，标签进 HTML', () => {
  const html = formatDescriptionHtml(MIXED_SAMPLE);

  assert.match(html, /<h3[\s>]/, '### Features 应渲染成 h3');
  assert.match(html, /<strong>SteamVR on Meta Quest 3 and 3S<\/strong>/, '** 应渲染成 strong');
  assert.doesNotMatch(html, /^###/m, '不应残留行首 ###');
  assert.equal(html.includes('**'), false, '不应残留 **');
  assert.equal(html.includes('<details'), false, 'details 骨架应被移除');
  assert.equal(html.includes('&lt;'), false, '行内标签不应被转义成可见文本');
  assert.match(html, /<a href="https:\/\/discord\.gg\/example">/, '行内 <a> 应原样保留');
  assert.equal((html.match(/<img/g) || []).length, 2, '两张 <img> 都应保留');
  assert.match(html, /<li[\s>]/, '连字符列表应渲染成 li');
});

test('混合正文里的花色行内标签不被转义成可见文本', () => {
  // 线上 com.com2us.starseed.android.google.global.normal 的描述结构：
  // `**` 触发 Markdown 分支，同时正文自带 <font color>/<b> 这类白名单外的标签。
  const html = formatDescriptionHtml(
    '**加粗标题**\n<font color="#2478FF"><b>⭐100% 免费 SSR</b></font><br>正文',
  );

  // 整行加粗会被 detail preset 提升为标题（src/lib/utils.ts 的 inferredHeading 规则），
  // 这里断言的是「`**` 被消费掉」，不是残留成字面量。
  assert.match(html, /<h3[^>]*>加粗标题<\/h3>/, '整行 ** 应被渲染器消费');
  assert.equal(html.includes('**'), false, '不应残留 **');
  assert.match(html, /<font color="#2478FF">/, '<font> 应原样保留');
  assert.match(html, /<b>⭐100% 免费 SSR<\/b>/, '<b> 应原样保留');
  assert.equal(html.includes('&lt;font'), false, '<font> 不应被转义');
  assert.equal(html.includes('&lt;b&gt;'), false, '<b> 不应被转义');
  assert.equal(html.includes('免费 SSR'), true, '标签内文本应保留');

  // 行内加粗与花色标签同段混排：** 仍应渲染成 <strong>，<font>/<b> 不被转义。
  const inline = formatDescriptionHtml(
    '正文 **加粗** <font color="#2478FF"><b>高亮</b></font>',
  );
  assert.match(inline, /<strong>加粗<\/strong>/, '** 应渲染成 strong');
  assert.match(inline, /<font color="#2478FF">/, '行内样本 <font> 应原样保留');
  assert.match(inline, /<b>高亮<\/b>/, '行内样本 <b> 应原样保留');
  assert.equal(inline.includes('&lt;font'), false, '行内样本不应转义 <font>');
  assert.equal(inline.includes('&lt;b&gt;'), false, '行内样本不应转义 <b>');
});

test('纯 HTML 描述保持原路径，不被 Markdown 渲染器改写', () => {
  const html = formatDescriptionHtml('<p>a<br>b</p>');

  assert.equal(html.includes('<p>'), true, '应保留原有 <p>');
  assert.equal(html.includes('<h3'), false, '不应凭空出现 h3');
  assert.equal(html.includes('<br />'), false, 'HTML 描述走原有富文本分支');
});

test('混合正文里的脚本标签被移除', () => {
  const html = formatDescriptionHtml('### t<script>alert(1)</script>');

  assert.equal(html.includes('<script'), false, '不应输出 <script');
  assert.match(html, /<h3[\s>]/, '标题本身仍应渲染');
});

test('纯文本描述仍用 <br /> 换行', () => {
  const html = formatDescriptionHtml('第一行\n第二行');

  assert.equal(html, '第一行<br />第二行');
});

test('空描述返回空串', () => {
  assert.equal(formatDescriptionHtml('   '), '');
  assert.equal(formatDescriptionHtml(undefined), '');
});
