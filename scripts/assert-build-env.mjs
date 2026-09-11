#!/usr/bin/env node
// 校验 Next 生产构建产物是否按 .env.production 把 NEXT_PUBLIC_* 内联进客户端包。
//
// 背景（2026-09-11 实测）：发布流程在本机跑 pnpm build、只上传 .next 到服务器，
// 而 NEXT_PUBLIC_* 是构建期写死进客户端包的常量 —— 服务器 .env 改不了它。
// 一旦构建机上 .env 是开发值（例如 NEXT_PUBLIC_API_BASE_URL=/api），线上浏览器
// 的实际 API 基址就会被静默改掉。本脚本把这类漂移变成构建失败。
//
// 判定依据：Next 只会内联「已定义」的 NEXT_PUBLIC_ 变量；未定义的键会以
// process.env.XXX 形式残留在产物里。因此：
//   1) .env.production 中定义的每个 NEXT_PUBLIC_ 键，产物里不得再出现同名 token；
//   2) 当 NEXT_PUBLIC_API_USE_PROXY=false（浏览器直连 API）时，产物里必须出现
//      NEXT_PUBLIC_API_BASE_URL 的字面值。

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.production');

function fail(message) {
    console.error('[assert-build-env] ' + message);
    process.exit(1);
}

function parseEnvFile(filePath) {
    const result = new Map();
    const text = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const index = line.indexOf('=');
        if (index <= 0) continue;
        const key = line.slice(0, index).trim();
        // 去掉可选的引号，保持与 dotenv 一致的取值语义
        const value = line
            .slice(index + 1)
            .trim()
            .replace(/^(['"])(.*)\1$/, '$2');
        result.set(key, value);
    }
    return result;
}

function listChunkFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const files = [];
    const walk = (current) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith('.js')) files.push(full);
        }
    };
    walk(dir);
    return files;
}

if (!fs.existsSync(envPath)) {
    fail('缺少 .env.production：生产构建必须由该文件固定 NEXT_PUBLIC_* 取值（见 AC-GameVerse/AGENTS.md）');
}

const env = parseEnvFile(envPath);
const publicKeys = [...env.keys()].filter((key) => key.startsWith('NEXT_PUBLIC_'));
if (publicKeys.length === 0) {
    fail('.env.production 未定义任何 NEXT_PUBLIC_ 变量，构建值无法校验');
}

const distDir = String(process.env.NEXT_DIST_DIR || '.next').trim() || '.next';
const staticDir = path.join(root, distDir, 'static');
const chunks = listChunkFiles(staticDir);
if (chunks.length === 0) {
    fail('未找到客户端产物：' + path.relative(root, staticDir) + '，请先执行 pnpm build');
}

const contents = chunks.map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }));

// 1) 已定义的 NEXT_PUBLIC_ 键必须已被内联，不得以 token 形式残留
const leaked = [];
for (const key of publicKeys) {
    for (const chunk of contents) {
        if (chunk.text.includes(key)) {
            leaked.push(key + ' @ ' + path.relative(root, chunk.file));
            break;
        }
    }
}
if (leaked.length > 0) {
    fail(
        '客户端产物中仍存在未内联的 NEXT_PUBLIC_ 变量，说明构建未加载 .env.production：\n  ' +
            leaked.join('\n  '),
    );
}

// 2) 浏览器直连 API 时，必须能看到生产 API 基址
const useProxy = String(env.get('NEXT_PUBLIC_API_USE_PROXY') || 'true')
    .trim()
    .toLowerCase();
const apiBaseUrl = String(env.get('NEXT_PUBLIC_API_BASE_URL') || '').trim();
if (useProxy === 'false') {
    if (!apiBaseUrl) {
        fail('NEXT_PUBLIC_API_USE_PROXY=false 时必须同时配置 NEXT_PUBLIC_API_BASE_URL');
    }
    const hit = contents.find((chunk) => chunk.text.includes(apiBaseUrl));
    if (!hit) {
        fail('客户端产物中未找到生产 API 基址 ' + apiBaseUrl + '，浏览器将无法直连接口');
    }
    console.log('[assert-build-env] 浏览器 API 基址已内联：' + apiBaseUrl + ' @ ' + path.relative(root, hit.file));
}

console.log(
    '[assert-build-env] 通过：' +
        publicKeys.length +
        ' 个 NEXT_PUBLIC_ 变量已按 .env.production 内联（代理模式=' +
        useProxy +
        '）',
);
