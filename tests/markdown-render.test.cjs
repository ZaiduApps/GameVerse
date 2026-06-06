const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadRenderMarkdown() {
  const filePath = path.join(process.cwd(), 'src/lib/utils.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: (id) => {
      if (id === 'clsx') return { clsx: (...args) => args.filter(Boolean).join(' ') };
      if (id === 'tailwind-merge') return { twMerge: (v) => v };
      return require(id);
    },
  };

  vm.runInNewContext(compiled, sandbox);
  return moduleObj.exports.renderMarkdown;
}

function loadMarkdownDocumentBuilder() {
  const filePath = path.join(process.cwd(), 'src/lib/utils.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: (id) => {
      if (id === 'clsx') return { clsx: (...args) => args.filter(Boolean).join(' ') };
      if (id === 'tailwind-merge') return { twMerge: (v) => v };
      return require(id);
    },
  };

  vm.runInNewContext(compiled, sandbox);
  return moduleObj.exports.buildRenderedMarkdownDocument;
}

function loadSeoUtils() {
  const filePath = path.join(process.cwd(), 'src/lib/seo.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require,
    process,
  };

  vm.runInNewContext(compiled, sandbox);
  return moduleObj.exports;
}

function loadCommunityApiUtils(trackedApiFetch = async () => { throw new Error('mocked'); }) {
  const filePath = path.join(process.cwd(), 'src/lib/community-api.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: (id) => {
      if (id === '@/lib/api') return { trackedApiFetch };
      if (id === '@/lib/tracking-headers') return { buildTrackingHeaders: () => ({}) };
      return require(id);
    },
    URL,
    console,
    process,
  };

  vm.runInNewContext(compiled, sandbox);
  return moduleObj.exports;
}

function loadCommunitySeoUtils() {
  const filePath = path.join(process.cwd(), 'src/lib/community-seo.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: (id) => {
      if (id === '@/lib/community-profile') return loadCommunityProfileUtils();
      if (id === '@/lib/seo') return loadSeoUtils();
      return require(id);
    },
    process,
  };

  vm.runInNewContext(compiled, sandbox);
  return moduleObj.exports;
}

function loadCommunityProfileUtils() {
  const filePath = path.join(process.cwd(), 'src/lib/community-profile.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require,
  };

  vm.runInNewContext(compiled, sandbox);
  return moduleObj.exports;
}

const renderMarkdown = loadRenderMarkdown();
const buildRenderedMarkdownDocument = loadMarkdownDocumentBuilder();
const { sanitizeSeoText } = loadSeoUtils();
const {
  resolveCommunityPostViewSource,
  stripCommunityMarkdownCodeSegments,
  toCommentThreads,
  toCommunityPost,
} = loadCommunityApiUtils();
const { getCommunityAuthorProfileHref } = loadCommunityProfileUtils();
const { buildCommunityPostDiscussionJsonLd } = loadCommunitySeoUtils();

function plainJsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}

test('markdown regression: code + https link + hr', () => {
  const input = [
    '#### 四级标题',
    '',
    '```bash',
    'pnpm build',
    '```',
    '',
    '[官方文档](https://example.com/docs)',
    '',
    '---',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /<h4 class="text-lg font-semibold my-2">四级标题<\/h4>/);
  assert.match(html, /<pre class="bg-muted/);
  assert.match(html, /<a href="https:\/\/example.com\/docs"/);
  assert.match(html, /<hr class="my-6" \/>/);
});

test('markdown regression: defined-image html compatibility', () => {
  const input =
    '<p class="defined-image"><img src="https://uu.fp.ps.netease.com/file/678df67414dda3f1c43bc49bkJDlgYay06" /></p>';
  const html = renderMarkdown(input).__html;
  assert.match(html, /<img alt="内容配图" src="https:\/\/uu\.fp\.ps\.netease\.com\/file\/678df67414dda3f1c43bc49bkJDlgYay06"/);
});

test('markdown regression: acbox scheme mapped to safe trigger', () => {
  const input = '[在 App 打开](acbox://jump?type=post&id=123)';
  const html = renderMarkdown(input).__html;
  assert.match(html, /data-app-link="acbox:\/\/jump\?type=post&amp;id=123"/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test('markdown regression: uu-mobile scheme mapped to app prompt', () => {
  const input = '[帮助反馈](uu-mobile://user_feedback "点击前往【帮助和反馈】")';
  const html = renderMarkdown(input).__html;
  assert.match(html, /data-app-link="uu-mobile:\/\/user_feedback"/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test('markdown regression: link tracking attributes are emitted', () => {
  const input = [
    '[HTTPS](https://example.com/page?q=1)',
    '',
    '[HTTP](http://example.com/page)',
    '',
    '[App](acbox://jump?type=post&id=123)',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /data-acbox-action="markdown_https_link"/);
  assert.match(html, /data-acbox-label="https:\/\/example\.com\/page\?q=1"/);
  assert.match(html, /rel="noopener noreferrer ugc"/);
  assert.match(html, /data-acbox-action="markdown_http_link"/);
  assert.match(html, /rel="noopener noreferrer nofollow ugc"/);
  assert.match(html, /data-acbox-action="markdown_app_link"/);
  assert.match(html, /data-acbox-label="acbox:\/\/jump\?type=post&amp;id=123"/);
});

test('markdown regression: non-whitelisted scheme rendered as text only', () => {
  const input = '[危险链接](javascript:evil)';
  const html = renderMarkdown(input).__html;
  assert.match(html, /\(javascript:evil\)/);
  assert.doesNotMatch(html, /href="javascript:/);
});

test('markdown regression: blocked hosts cover http and subdomains', () => {
  const input = [
    '[巴哈姆特](http://acg.gamer.com.tw/search.php?kw=eFootball)',
    '',
    '[子域名](https://www.facebook.com/demo)',
    '',
    'https://www.konami.com/efootball/en/。',
  ].join('\n');

  const html = renderMarkdown(input, {
    blockedLinkHosts: ['acg.gamer.com.tw', 'facebook.com'],
    preset: 'detail',
  }).__html;

  assert.match(html, />巴哈姆特<\/span>/);
  assert.match(html, />子域名<\/span>/);
  assert.doesNotMatch(html, /href="http:\/\/acg\.gamer\.com\.tw/);
  assert.doesNotMatch(html, /href="https:\/\/www\.facebook\.com/);
  assert.match(html, /href="https:\/\/www\.konami\.com\/efootball\/en\/"/);
  assert.match(html, /rel="noopener noreferrer ugc"/);
  assert.match(html, /https:\/\/www\.konami\.com\/efootball\/en\/<\/a>。/);
});

test('markdown regression: bare links trim punctuation and autolinks work', () => {
  const input = [
    '<https://example.com/path?q=1>',
    '',
    '参考链接：https://example.com/demo)。',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /href="https:\/\/example\.com\/path\?q=1"/);
  assert.match(html, /href="https:\/\/example\.com\/demo"/);
  assert.match(html, /https:\/\/example\.com\/demo<\/a>\)。/);
});

test('markdown regression: code spans and fences do not autolink urls', () => {
  const input = [
    '`https://example.com/inline`',
    '',
    '```bash',
    'curl https://example.com/api',
    '```',
    '',
    '正文 https://example.com/page',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /<code[^>]*>https:\/\/example\.com\/inline<\/code>/);
  assert.match(html, /<code class="language-bash">curl https:\/\/example\.com\/api<\/code>/);
  assert.doesNotMatch(html, /href="https:\/\/example\.com\/inline"/);
  assert.doesNotMatch(html, /href="https:\/\/example\.com\/api"/);
  assert.match(html, /href="https:\/\/example\.com\/page"/);
});

test('markdown regression: code spans and fences keep markdown link syntax inert', () => {
  const input = [
    '`[内联](https://example.com/inline)`',
    '',
    '```md',
    '## 代码块标题',
    '- 代码块列表',
    '[代码块链接](https://example.com/fence)',
    '![代码块图片](https://example.com/fence.png)',
    '```',
    '',
    '[正文链接](https://example.com/body)',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /<pre class="bg-muted/);
  assert.match(html, /<code[^>]*>\[内联\]\(https:\/\/example\.com\/inline\)<\/code>/);
  assert.match(html, /<code class="language-md">## 代码块标题\n- 代码块列表\n\[代码块链接\]\(https:\/\/example\.com\/fence\)\n!\[代码块图片\]\(https:\/\/example\.com\/fence\.png\)<\/code>/);
  assert.doesNotMatch(html, /<h2[^>]*>代码块标题<\/h2>/);
  assert.doesNotMatch(html, /<li[^>]*>代码块列表<\/li>/);
  assert.doesNotMatch(html, /href="https:\/\/example\.com\/inline"/);
  assert.doesNotMatch(html, /href="https:\/\/example\.com\/fence"/);
  assert.doesNotMatch(html, /src="https:\/\/example\.com\/fence\.png"/);
  assert.match(html, /href="https:\/\/example\.com\/body"/);
});

test('markdown regression: html inside code spans and fences stays escaped', () => {
  const input = [
    '`<img src="https://example.com/inline.png">`',
    '',
    '```html',
    '<h2>代码标题</h2>',
    '<img src="https://example.com/fence.png">',
    '```',
    '',
    '<h2>正文标题</h2>',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /<code[^>]*>&lt;img src=&quot;https:\/\/example\.com\/inline\.png&quot;&gt;<\/code>/);
  assert.match(html, /<code class="language-html">&lt;h2&gt;代码标题&lt;\/h2&gt;\n&lt;img src=&quot;https:\/\/example\.com\/fence\.png&quot;&gt;<\/code>/);
  assert.doesNotMatch(html, /<img src="https:\/\/example\.com\/fence\.png"/);
  assert.match(html, /<h2[^>]*>正文标题<\/h2>/);
});

test('markdown document builder: heading toc text restores inline link tokens', () => {
  const doc = buildRenderedMarkdownDocument('## [游戏官网](https://example.com/game)', {
    injectHeadingAnchors: true,
  });

  assert.equal(doc.headings.length, 1);
  assert.equal(doc.headings[0].text, '游戏官网');
  assert.match(doc.html, /id="post-heading-0"/);
  assert.match(doc.html, /href="https:\/\/example\.com\/game"/);
});

test('markdown regression: insecure images render as safe text', () => {
  const input = '![unsafe](http://example.com/image.png)';
  const html = renderMarkdown(input).__html;
  assert.match(html, /\[图片链接已拦截: http:\/\/example\.com\/image\.png\]/);
  assert.doesNotMatch(html, /<img/);
});

test('markdown regression: link and image attributes are escaped', () => {
  const input = [
    '[安全链接](https://example.com/path?q=%22%20onclick=alert(1))',
    '',
    '![alt" onerror="alert(1)](https://example.com/image.png)',
    '',
    '[App 打开](acbox://jump?name=%22%20onclick=alert(1))',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /href="https:\/\/example\.com\/path\?q=%22%20onclick=alert\(1\)"/);
  assert.match(html, /alt="alt&quot; onerror=&quot;alert\(1\)"/);
  assert.match(html, /data-app-link="acbox:\/\/jump\?name=%22%20onclick=alert\(1\)"/);
  assert.doesNotMatch(html, /"\s+onclick=/);
  assert.doesNotMatch(html, /"\s+onerror=/);
});

test('markdown regression: parting-line html compatibility', () => {
  const input = '<p class="parting-line"><span>历史问题分割线</span></p>';
  const html = renderMarkdown(input).__html;
  assert.match(html, /<hr class="my-6" \/>/);
  assert.match(html, /历史问题分割线/);
});

test('markdown regression: quote heading with paragraph', () => {
  const input = [
    '> ## Excerpt',
    '',
    '> 最近在寻找存储空间，3天前找到了 100GB 的免费 WebDAV 空间，',
  ].join('\n');

  const html = renderMarkdown(input).__html;
  assert.match(html, /<blockquote class="border-l-4 border-primary[^\"]*"><h2 class="text-2xl font-bold my-1">Excerpt<\/h2><\/blockquote>/);
  assert.match(html, /<blockquote class="border-l-4 border-primary[^\"]*">最近在寻找存储空间，3天前找到了 100GB 的免费 WebDAV 空间，<\/blockquote>/);
});

test('markdown detail preset: upgraded section headings and unordered list items', () => {
  const input = [
    '## 功能概览',
    '',
    '- 第一条提示',
    '- 第二条提示',
    '',
    '> 引用说明',
    '',
    '```ts',
    'const value = 1;',
    '```',
    '',
    '![内容配图](https://example.com/image.png)',
    '',
    '| 名称 | 数值 |',
    '| --- | --- |',
    '| 评分 | 9 |',
    '',
    '---',
  ].join('\n');

  const html = renderMarkdown(input, { preset: 'detail' }).__html;
  assert.match(html, /<ul class="my-4 list-none space-y-3 pl-0">/);

  const h2Class = html.match(/<h2 class="([^"]+)">功能概览<\/h2>/)?.[1] || '';
  const listItemClass = html.match(/<li class="([^"]+)">第一条提示<\/li>/)?.[1] || '';
  const quoteClass = html.match(/<blockquote class="([^"]+)">引用说明<\/blockquote>/)?.[1] || '';
  const codeClass = html.match(/<pre class="([^"]+)"><code class="language-ts">/)?.[1] || '';
  const imageClass = html.match(/<img alt="内容配图" src="https:\/\/example\.com\/image\.png" class="([^"]+)" \/>/)?.[1] || '';
  const thClass = html.match(/<th class="([^"]+)">名称<\/th>/)?.[1] || '';
  const tdClass = html.match(/<td class="([^"]+)">评分<\/td>/)?.[1] || '';
  const hrClass = html.match(/<hr class="([^"]+)" \/>/)?.[1] || '';

  [h2Class, listItemClass, quoteClass, codeClass, imageClass, thClass, tdClass, hrClass].forEach((value) => {
    assert.ok(value.length > 0);
    assert.doesNotMatch(value, /(^| )border(?:$|-|\[)/);
    assert.doesNotMatch(value, /(^| )border-l(?:$|-|\[)/);
    assert.doesNotMatch(value, /(^| )border-t(?:$|-|\[)/);
  });

  assert.match(h2Class, /bg-gradient-to-r/);
  assert.match(h2Class, /before:bg-primary\/75/);
  assert.match(listItemClass, /bg-gradient-to-r/);
  assert.match(listItemClass, /after:bg-primary\/80/);
  assert.match(quoteClass, /before:bg-accent\/65/);
  assert.match(codeClass, /bg-muted\/70/);
  assert.match(imageClass, /bg-muted\/20/);
  assert.match(hrClass, /bg-gradient-to-r/);
});

test('seo text sanitizer: strips markdown links, images and bare urls', () => {
  const input = [
    '由《[灌籃高手](https://acg.gamer.com.tw/search.php?kw=test)》團隊打造',
    '',
    '[https://www.facebook.com/demo](https://www.facebook.com/demo)',
    '',
    '![image](https://example.com/image.png)',
    '',
    '- 首日登入即送',
  ].join('\n');

  const output = sanitizeSeoText(input);
  assert.equal(output, '由《灌籃高手》團隊打造 首日登入即送');
  assert.doesNotMatch(output, /https?:\/\//);
  assert.doesNotMatch(output, /\[[^\]]+\]\(/);
});

test('seo text sanitizer: repairs truncated markdown link fragments', () => {
  const input =
    '由《灌籃高手》團隊打造的 3v3 手機遊戲《[超時空街球對決](';

  const output = sanitizeSeoText(input);
  assert.equal(output, '由《灌籃高手》團隊打造的 3v3 手機遊戲《超時空街球對決');
  assert.doesNotMatch(output, /\[[^\]]+\]\(/);
});

test('community view source resolver: classifies search, referral and direct', () => {
  assert.equal(resolveCommunityPostViewSource(''), 'direct');
  assert.equal(resolveCommunityPostViewSource('https://www.google.com/search?q=game'), 'search');
  assert.equal(resolveCommunityPostViewSource('https://cn.bing.com/search?q=game'), 'search');
  assert.equal(resolveCommunityPostViewSource('https://www.baidu.com/s?wd=game'), 'search');
  assert.equal(resolveCommunityPostViewSource('https://www.so.com/s?q=game'), 'search');
  assert.equal(resolveCommunityPostViewSource('https://example.com/post'), 'referral');
});

test('community markdown helper: strips code segments before preview extraction', () => {
  const text = [
    '`https://example.com/inline`',
    '',
    '```md',
    '![code](https://example.com/code.png)',
    'https://example.com/code-link',
    '```',
    '',
    '正文 https://example.com/body',
  ].join('\n');

  const stripped = stripCommunityMarkdownCodeSegments(text);
  assert.doesNotMatch(stripped, /inline/);
  assert.doesNotMatch(stripped, /code\.png/);
  assert.doesNotMatch(stripped, /code-link/);
  assert.match(stripped, /https:\/\/example\.com\/body/);
});

test('community post mapper: ignores code-block images when selecting cover', () => {
  const post = toCommunityPost({
    _id: 'post-1',
    content: [
      '```html',
      '<img src="https://example.com/code.png">',
      '```',
      '',
      '正文图片 ![cover](https://example.com/body.png)',
    ].join('\n'),
  });

  assert.equal(post.imageUrl, 'https://example.com/body.png');
  assert.deepEqual(plainJsonValue(post.previewImages), ['https://example.com/body.png']);
});

test('community post mapper: keeps link click ranking stats', () => {
  const post = toCommunityPost({
    _id: 'post-2',
    content: '正文 https://example.com/body',
    link_click_count: 5,
    link_clicks: {
      url_abc: 5,
    },
    link_click_stats: [
      {
        click_key: 'url_abc',
        count: 5,
        host: 'example.com',
        url: 'https://example.com/body',
      },
      {
        click_key: '',
        count: 10,
        host: 'invalid.example',
        url: 'https://invalid.example/',
      },
    ],
  });

  assert.equal(post.linkClickCount, 5);
  assert.deepEqual(plainJsonValue(post.linkClicks), { url_abc: 5 });
  assert.deepEqual(plainJsonValue(post.linkClickStats), [
    {
      click_key: 'url_abc',
      count: 5,
      host: 'example.com',
      url: 'https://example.com/body',
    },
  ]);
});

test('community author profile helper: prefers username over object id', () => {
  const post = toCommunityPost({
    _id: 'post-3',
    author_id: '111111111111111111111111',
    author_type: 'user',
    author_username: 'alice',
    author_name: 'Alice',
    content: '正文',
  });

  assert.equal(post.authorId, '111111111111111111111111');
  assert.equal(post.authorUsername, 'alice');
  assert.equal(getCommunityAuthorProfileHref(post), '/u/alice');
  assert.equal(
    getCommunityAuthorProfileHref({
      author_id: '222222222222222222222222',
      authorId: '222222222222222222222222',
      authorType: 'user',
    }),
    '/u/222222222222222222222222',
  );
  assert.equal(
    getCommunityAuthorProfileHref({
      authorId: 'admin-1',
      authorType: 'admin',
      authorUsername: 'admin',
    }),
    '',
  );
});

test('community link click reporter: sends keepalive payload', async () => {
  const calls = [];
  const { recordCommunityPostLinkClick } = loadCommunityApiUtils(async (path, init) => {
    calls.push({ path, init });
    return {
      ok: true,
      json: async () => ({
        code: 0,
        data: {
          link_click_count: 2,
          heat_score: 8,
        },
      }),
    };
  });

  const result = await recordCommunityPostLinkClick({
    postId: 'post-1',
    url: 'https://example.com/body',
    referrer: 'https://www.google.com/search?q=game',
  });

  assert.deepEqual(plainJsonValue(result), {
    link_click_count: 2,
    heat_score: 8,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/content/public/post-1/link-click');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.keepalive, true);
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    url: 'https://example.com/body',
    referrer: 'https://www.google.com/search?q=game',
  });
});

test('community comment mapper: keeps machine readable created time', () => {
  const threads = toCommentThreads([
    {
      _id: 'comment-1',
      user_id: '111111111111111111111111',
      user_username: 'commenter',
      user_name: '评论者',
      content: '评论正文',
      created_at: '2026-06-06T10:20:30.000Z',
      replies: [
        {
          _id: 'reply-1',
          user_id: '222222222222222222222222',
          user_name: '回复者',
          content: '回复正文',
          created_at: '2026-06-06T10:21:30.000Z',
        },
      ],
    },
  ]);

  assert.equal(threads[0].createdAt, '2026-06-06T10:20:30.000Z');
  assert.equal(threads[0].replies[0].createdAt, '2026-06-06T10:21:30.000Z');
  assert.equal(threads[0].user.profileHref, '/u/commenter');
  assert.equal(threads[0].replies[0].user.profileHref, '/u/222222222222222222222222');
});

test('community seo: builds discussion forum posting json-ld from visible data', () => {
  const post = {
    id: 'post-1',
    authorType: 'user',
    authorUsername: 'alice',
    user: {
      name: 'Alice',
      avatarUrl: '/favicon.ico',
    },
    title: '独立帖子标题',
    summary: '摘要',
    content: '正文 https://example.com/body',
    imageUrl: 'https://example.com/post.png',
    rawTimestamp: '2026-06-06T10:00:00.000Z',
    updatedAt: '2026-06-06T11:00:00.000Z',
    commentsCount: 2,
    likesCount: 3,
    viewsCount: 4,
    category: '游戏社区',
    tags: ['攻略'],
    linkPreviews: [
      {
        url: 'https://example.com/body',
        title: '外链标题',
        description: '外链摘要',
        icon: '/favicon.ico',
      },
    ],
  };
  const comments = [
    {
      id: 'comment-1',
      user: { name: '评论者', avatarUrl: '/favicon.ico' },
      timestamp: '06-06 10:20',
      createdAt: '2026-06-06T10:20:30.000Z',
      text: '有效评论',
      likeCount: 1,
      replies: [
        {
          id: 'reply-1',
          user: { name: '回复者', avatarUrl: '/favicon.ico' },
          timestamp: '06-06 10:21',
          createdAt: '2026-06-06T10:21:30.000Z',
          text: '有效回复',
          likeCount: 0,
        },
        {
          id: 'reply-2',
          user: { name: '无时间', avatarUrl: '/favicon.ico' },
          timestamp: '刚刚',
          text: '无时间回复',
          likeCount: 0,
        },
      ],
      replyTotal: 2,
      replyHasMore: false,
      replyPageSize: 20,
    },
    {
      id: 'comment-2',
      user: { name: '无时间', avatarUrl: '/favicon.ico' },
      timestamp: '刚刚',
      text: '无时间评论',
      likeCount: 0,
      replies: [],
      replyTotal: 0,
      replyHasMore: false,
      replyPageSize: 20,
    },
  ];

  const jsonLd = buildCommunityPostDiscussionJsonLd({
    post,
    comments,
    siteName: 'APKScc',
    siteLogoUrl: '/logo.png',
    canonicalUrl: 'https://apks.cc/community/post/post-1',
  });

  assert.equal(jsonLd['@type'], 'DiscussionForumPosting');
  assert.equal(jsonLd.headline, '独立帖子标题');
  assert.deepEqual(plainJsonValue(jsonLd.image), ['https://example.com/post.png']);
  assert.equal(jsonLd.author.url, 'https://apks.cc/u/alice');
  assert.equal(jsonLd.author.image, undefined);
  assert.equal(jsonLd.sharedContent[0].url, 'https://example.com/body');
  assert.equal(jsonLd.sharedContent[0].image, 'https://apks.cc/favicon.ico');
  assert.equal(jsonLd.comment.length, 1);
  assert.equal(jsonLd.comment[0].datePublished, '2026-06-06T10:20:30.000Z');
  assert.equal(jsonLd.comment[0].comment.length, 1);
  assert.equal(jsonLd.comment[0].comment[0].datePublished, '2026-06-06T10:21:30.000Z');
});
