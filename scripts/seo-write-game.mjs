import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const apiUrl = (process.env.API_BASE_URL || 'https://api.hk.apks.cc').replace(/\/$/, '');
const siteUrl = (process.env.SITE_URL || 'https://apks.cc').replace(/\/$/, '');
const runId = process.env.SEO_RUN_ID || `seo-write-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const outputPath = resolve(process.env.SEO_WRITE_OUTPUT || `seo-write-${runId}.json`);
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'socks5h://127.0.0.1:7897';

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function usage() {
  console.log([
    '用法:',
    '  node scripts/seo-write-game.mjs --pkg <packageName> --seo-file <json> [--apply]',
    '',
    '默认只做参数校验，不写入。--apply 才会执行授权、before 快照、SEO-only PUT 和回读。',
    '密码只从 INTERFACE_ADMIN_PASSWORD 读取，代理从 HTTPS_PROXY/HTTP_PROXY 读取。',
  ].join('\n'));
}

function fail(message) {
  throw new Error(message);
}

function normalizeSeo(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('SEO 文件必须是对象或包含 seo 对象的对象');
  const source = value.seo && typeof value.seo === 'object' && !Array.isArray(value.seo) ? value.seo : value;
  const allowed = ['title', 'description', 'keywords', 'highlights'];
  const unknown = Object.keys(source).filter((key) => !allowed.includes(key));
  if (unknown.length) fail(`SEO 文件包含不允许的字段: ${unknown.join(', ')}`);
  const seo = {};
  if (source.title !== undefined) {
    if (typeof source.title !== 'string' || !source.title.trim()) fail('seo.title 必须是非空字符串');
    seo.title = source.title.trim();
  }
  if (source.description !== undefined) {
    if (typeof source.description !== 'string' || !source.description.trim()) fail('seo.description 必须是非空字符串');
    seo.description = source.description.trim();
  }
  for (const key of ['keywords', 'highlights']) {
    if (source[key] !== undefined) {
      if (!Array.isArray(source[key]) || source[key].some((item) => typeof item !== 'string' || !item.trim())) {
        fail(`seo.${key} 必须是非空字符串数组`);
      }
      seo[key] = source[key].map((item) => item.trim());
    }
  }
  if (!Object.keys(seo).length) fail('SEO 文件至少需要一个 SEO 字段');
  return seo;
}

function unwrap(payload) {
  return payload && typeof payload === 'object' && payload.data !== undefined ? payload.data : payload;
}

function pickGame(payload) {
  const data = unwrap(payload);
  return data?.game || data?.app || data?.item || data;
}

function pickId(payload) {
  const game = pickGame(payload);
  return String(game?._id || game?.id || game?.objectId || '').trim();
}

function pickPackage(payload) {
  const game = pickGame(payload);
  return String(game?.pkg || game?.packageName || game?.package_name || '').trim();
}

function pickSeo(payload) {
  const game = pickGame(payload);
  return game?.seo && typeof game.seo === 'object' ? game.seo : {};
}

function pickBusinessSnapshot(payload) {
  const game = pickGame(payload);
  const fields = [
    'pkg', 'packageName', 'version', 'developer', 'description', 'summary',
    'icon', 'header_image', 'video_image', 'resource', 'resources',
    'category', 'category_name', 'type', 'status',
  ];
  return Object.fromEntries(fields.filter((key) => game?.[key] !== undefined).map((key) => [key, game[key]]));
}

function changedKeys(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

function pickToken(payload) {
  const data = unwrap(payload);
  return String(data?.access_token || data?.accessToken || data?.token || '').trim();
}

function pickUser(payload) {
  const data = unwrap(payload);
  return data?.user || data?.profile || data;
}

function containsPermission(payload, permission) {
  const data = unwrap(payload);
  const values = [];
  const collect = (value) => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (typeof value === 'string') values.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(data);
  return values.includes(permission);
}

async function curlJson(method, url, { token, body } = {}) {
  const temp = await mkdtemp(resolve(tmpdir(), 'gameverse-seo-write-'));
  const bodyPath = resolve(temp, 'body.json');
  const headerPath = resolve(temp, 'headers.txt');
  const args = [
    '--socks5-hostname', new URL(proxyUrl).hostname + ':' + (new URL(proxyUrl).port || '7897'),
    '--silent', '--show-error', '--max-time', '30',
    '--request', method,
    '--dump-header', headerPath,
    '--output', bodyPath,
    '--write-out', '%{http_code}',
    '-H', 'Accept: application/json',
  ];
  if (token) args.push('-H', `Authorization: Bearer ${token}`);
  if (body !== undefined) args.push('-H', 'Content-Type: application/json', '--data-binary', JSON.stringify(body));
  args.push(url);
  if (process.platform === 'win32') args.unshift('--ssl-no-revoke');
  try {
    const { stdout } = await execFileAsync(process.platform === 'win32' ? 'curl.exe' : 'curl', args, { maxBuffer: 8 * 1024 * 1024 });
    const raw = await readFile(bodyPath, 'utf8');
    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = { raw: raw.slice(0, 2000) }; }
    return { status: Number(stdout.trim()), body: parsed, raw };
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function readHtmlMeta(html, name) {
  const pattern = new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*\\bcontent=["']([^"']*)["'][^>]*>`, 'i');
  const reversePattern = new RegExp(`<meta\\b[^>]*\\bcontent=["']([^"']*)["'][^>]*\\bname=["']${name}["'][^>]*>`, 'i');
  return decodeHtml(html.match(pattern)?.[1] || html.match(reversePattern)?.[1] || '');
}

function readHtmlCanonical(html) {
  return decodeHtml(html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1]
    || html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["'][^>]*>/i)?.[1] || '');
}

function readHtmlTitle(html) {
  return decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) return usage();
  const pkg = String(argValue('--pkg') || '').trim();
  const seoFile = argValue('--seo-file');
  const apply = hasFlag('--apply');
  if (!pkg || !seoFile) fail('--pkg 和 --seo-file 必须同时提供');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(pkg)) fail('packageName 格式不合法');
  const seo = normalizeSeo(JSON.parse(await readFile(resolve(seoFile), 'utf8')));
  const beforePage = await curlJson('GET', `${apiUrl}/seo/game-page?pkg=${encodeURIComponent(pkg)}&qualityVersion=2`);
  if (beforePage.status < 200 || beforePage.status >= 300) fail(`before SEO 快照失败: HTTP ${beforePage.status}`);
  const record = {
    runId,
    packageName: pkg,
    timestamp: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry-run',
    proxy: proxyUrl.replace(/:\/\/.*@/, '://<redacted>@'),
    before: beforePage.body,
    requested: { seo },
    status: 'dry-run',
  };
  if (!apply) {
    await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    console.log(`SEO dry-run 已写入 ${outputPath}`);
    return;
  }
  const password = process.env.INTERFACE_ADMIN_PASSWORD;
  if (!password) fail('INTERFACE_ADMIN_PASSWORD 未配置；拒绝写入');
  const login = await curlJson('POST', `${apiUrl}/auth/login`, {
    body: {
      username: process.env.INTERFACE_ADMIN_USERNAME || 'zaidu',
      password,
      device_id: `seo-runner-${runId}`,
      device_name: 'SEO target agent',
    },
  });
  const token = pickToken(login.body);
  if (login.status < 200 || login.status >= 300 || !token) fail(`Interface 登录失败: HTTP ${login.status}`);
  const me = await curlJson('GET', `${apiUrl}/auth/me`, { token });
  const codes = await curlJson('GET', `${apiUrl}/auth/codes`, { token });
  const user = pickUser(me.body);
  const expectedUsername = process.env.INTERFACE_ADMIN_USERNAME || 'zaidu';
  const actualUsername = String(user?.username || user?.loginName || '').trim();
  if (actualUsername && actualUsername !== expectedUsername) fail(`登录身份不匹配: ${actualUsername}`);
  if (user?.isActive === false || user?.isBlocked === true) fail('账号未启用或已被封禁');
  if (me.status !== 200 || codes.status !== 200 || !containsPermission(codes.body, 'app:update')) {
    fail('账号未通过 /auth/me、/auth/codes 或缺少 app:update 权限');
  }
  const info = await curlJson('GET', `${apiUrl}/game/info?pkg=${encodeURIComponent(pkg)}`, { token });
  const objectId = pickId(info.body);
  if (info.status !== 200 || !objectId) fail(`游戏详情读取失败或缺少 objectId: HTTP ${info.status}`);
  const infoPkg = pickPackage(info.body);
  if (infoPkg && infoPkg !== pkg) fail(`objectId 对应包名不一致: ${infoPkg}`);
  record.beforeInfo = {
    objectId,
    packageName: infoPkg || pkg,
    seo: pickSeo(info.body),
    business: pickBusinessSnapshot(info.body),
  };
  const existingSeo = record.beforeInfo.seo;
  const requestedChanges = Object.keys(seo).filter(
    (key) => JSON.stringify(existingSeo[key]) !== JSON.stringify(seo[key]),
  );
  if (!requestedChanges.length) {
    record.status = 'unchanged';
    record.skippedReason = 'requested SEO equals current SEO; PUT and IndexNow skipped';
    await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    console.log(`SEO 未变化，已跳过写入并记录 ${outputPath}`);
    return;
  }
  record.requested.changedFields = requestedChanges;
  const update = await curlJson('PUT', `${apiUrl}/game/${encodeURIComponent(objectId)}`, { token, body: { seo } });
  record.response = { status: update.status, body: update.body };
  const afterPage = await curlJson('GET', `${apiUrl}/seo/game-page?pkg=${encodeURIComponent(pkg)}&qualityVersion=2`);
  record.after = afterPage.body;
  const afterSeo = pickSeo(afterPage.body);
  record.changedFields = Object.keys(seo).filter((key) => JSON.stringify(afterSeo[key]) !== JSON.stringify(seo[key]));
  const ssrResponse = await curlJson('GET', `${siteUrl}/app/${encodeURIComponent(pkg)}?seo_run=${encodeURIComponent(runId)}`);
  const html = ssrResponse.raw || '';
  record.ssr = {
    status: ssrResponse.status,
    title: readHtmlTitle(html),
    description: readHtmlMeta(html, 'description'),
    canonical: readHtmlCanonical(html),
    robots: readHtmlMeta(html, 'robots'),
  };
  record.ssrMatches = {
    status: ssrResponse.status === 200,
    title: seo.title === undefined || record.ssr.title === seo.title,
    description: seo.description === undefined || record.ssr.description === seo.description,
    canonical: record.ssr.canonical === `${siteUrl}/app/${pkg}`,
    robots: !record.ssr.robots || !/noindex/i.test(record.ssr.robots),
  };
  const afterInfo = await curlJson('GET', `${apiUrl}/game/info?pkg=${encodeURIComponent(pkg)}`, { token });
  record.afterInfo = {
    status: afterInfo.status,
    business: pickBusinessSnapshot(afterInfo.body),
  };
  record.businessChangedFields = changedKeys(record.beforeInfo.business, record.afterInfo.business);
  record.status = update.status >= 200 && update.status < 300 && afterPage.status >= 200
    && afterInfo.status === 200 && !record.changedFields.length && !record.businessChangedFields.length
    && Object.values(record.ssrMatches).every(Boolean)
    ? 'processed'
    : 'implemented but not observable';
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  console.log(`SEO 写入记录已写入 ${outputPath}`);
  if (record.status !== 'processed') process.exitCode = 2;
}

main().catch((error) => {
  console.error(`[seo-write-game] ${error.message}`);
  process.exitCode = 1;
});
