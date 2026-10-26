import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanText, formatDescriptionHtml } from '../src/app/app/[id]/game-detail-presenter.ts';

// 每条 payload 都是线上抓取的描述里出现过的攻击面：清洗器必须让整段失效，
// 而不是只删掉某个写法。
const XSS_PAYLOADS = {
  onerror: '<p>图 <img src="https://cdn.example/a.png" onerror="alert(1)"></p>',
  javascriptProtocol: '<p><a href="javascript:alert(1)">点我</a></p>',
  script: '<p>正文</p><script>alert("xss")</script>',
  iframe: '<p>正文</p><iframe src="https://evil.example/frame"></iframe>',
  object: '<p>正文</p><object data="https://evil.example/x.swf"></object>',
};

for (const [name, payload] of Object.entries(XSS_PAYLOADS)) {
  test(`XSS payload 失效：${name}`, () => {
    const html = formatDescriptionHtml(payload);
    const lowered = html.toLowerCase();

    assert.equal(/onerror|onload|onclick/i.test(lowered), false, '事件属性必须被移除');
    assert.equal(lowered.includes('javascript:'), false, 'javascript: 协议必须被移除');
    assert.equal(lowered.includes('<script'), false, '<script> 必须被移除');
    assert.equal(lowered.includes('<iframe'), false, '<iframe> 必须被移除');
    assert.equal(lowered.includes('<object'), false, '<object> 必须被移除');
    assert.equal(lowered.includes('alert('), false, '内联脚本内容不应保留');
    assert.match(html, /图|点我|正文/, '正常文本仍应保留');
  });
}

test('大小写与编码变形的危险协议同样被拦', () => {
  const payloads = [
    '<a href="JaVaScRiPt:alert(1)">x</a>',
    '<a href="&#106;avascript:alert(1)">x</a>',
    '<img src="x" ONERROR=alert(1)>',
    '<svg onload="alert(1)"><circle /></svg>',
    '<p style="background:url(javascript:alert(1))">x</p>',
  ];

  for (const payload of payloads) {
    const lowered = formatDescriptionHtml(payload).toLowerCase();
    assert.equal(lowered.includes('javascript:'), false, `危险协议未清除：${payload}`);
    assert.equal(/on[a-z]+\s*=/.test(lowered), false, `事件属性未清除：${payload}`);
  }
});

test('常见排版标签与图片属性保留', () => {
  const html = formatDescriptionHtml(
    '<p><b>加粗</b> <u>下划线</u> <font color="#2478FF">花色</font> <img src="https://cdn.example/a.png" width="50%" alt="图"></p>',
  );

  assert.match(html, /<b>加粗<\/b>/);
  assert.match(html, /<u>下划线<\/u>/);
  assert.match(html, /<font color="#2478FF">花色<\/font>/);
  assert.match(html, /<img[^>]*width="50%"[^>]*alt="图"/);
});

test('h1 降级为 h2，注释被清除', () => {
  const html = formatDescriptionHtml('<h1>标题</h1><!-- 后台备注 --><p>正文</p>');

  assert.equal(html.includes('<h1'), false, '页面已有 h1，描述里的 h1 必须降级');
  assert.match(html, /<h2>标题<\/h2>/);
  assert.equal(html.includes('后台备注'), false, 'HTML 注释必须被移除');
});

test('Markdown 混排分支同样过白名单清洗', () => {
  const html = formatDescriptionHtml(
    '### Features\n\n<img src="https://cdn.example/a.png" onerror="alert(1)">\n\n- **加粗**项\n',
  );

  assert.match(html, /<h3[\s>]/, '### 应渲染成 h3');
  assert.match(html, /<strong>加粗<\/strong>/, '** 应渲染成 strong');
  assert.equal(html.toLowerCase().includes('onerror'), false, '混排分支也不能漏事件属性');
});

test('文本抽取不把 script/style 正文带进摘要', () => {
  assert.equal(
    cleanText('<style>.x{color:red}</style><p>正文</p><script>alert(1)</script>'),
    '正文',
  );
  assert.equal(cleanText('<strong>加粗</strong> 普通文本'), '加粗 普通文本');
});
