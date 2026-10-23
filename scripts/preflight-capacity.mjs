#!/usr/bin/env node
// 构建前容量护栏：构建输出目录所在分区可用空间低于阈值时直接失败，
// 避免磁盘写满把 Next 构建（以及同机其它服务）拖垮。
//
// 判定对象（两种）：
//   本机（默认）：next.config.ts 的 distDir 取值，即 NEXT_DIST_DIR（缺省 .next），
//     相对路径按仓库根解析。输出目录可能位于另一块盘（例如把 .next 指向数据盘），
//     因此以「输出目录实际所在分区」为准，而不是固定看仓库分区。
//  目标机（--host <ssh别名>，例如 --host hk）：真实部署是「本机 build → rsync 到 hk」，
//     本机余量充足不代表目标机装得下，这时必须判定目标机根分区（ssh 只读 df/du）。
//
// 重要：package.json 的 prebuild 只跑本机判定（快速失败，不发 ssh——本机无网/无钥时会误拦）；
// 部署前必须在发起 rsync 的机器上显式跑 `node scripts/preflight-capacity.mjs --host hk`。
//
// 阈值：PREFLIGHT_MIN_FREE_GB（默认 3 GB）。临时放行：--force（只留痕，不阻断）。

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_TAG = '[preflight-capacity]';
const DEFAULT_MIN_FREE_GB = 3;
const TOP_USAGE_LIMIT = 5;
const DU_TIMEOUT_MS = 30_000;
const SSH_TIMEOUT_MS = 15_000;
// 只扫这些「同盘关键目录」，避免 du 全盘拖慢构建前置步骤。
const KEY_DIRS = ['/root', '/var/lib/docker', '/var/log', '/tmp', '/opt', '/srv', '/home'];
// 目标机只扫这三处（服务根目录、站点目录、系统目录），输出按 MB 倒序取 Top 5。
const REMOTE_KEY_DIRS = ['/root', '/www', '/var'];

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function log(message) {
    console.log(SCRIPT_TAG + ' ' + message);
}

function fail(message) {
    console.error(SCRIPT_TAG + ' ' + message);
    process.exit(1);
}

function formatGb(bytes) {
    return (bytes / 1024 ** 3).toFixed(2);
}

function parseMinFreeGb() {
    const raw = String(process.env.PREFLIGHT_MIN_FREE_GB ?? '').trim();
    if (!raw) return DEFAULT_MIN_FREE_GB;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
        fail('PREFLIGHT_MIN_FREE_GB 非法：' + raw + '（应为非负数字，单位 GB）');
    }
    return value;
}

// --host hk 与 --host=hk 都接受；给出空值时立刻报错，避免静默退回本机判定。
function parseHostArg(argv) {
    const inline = argv.find((arg) => arg.startsWith('--host='));
    if (inline) {
        const value = inline.slice('--host='.length).trim();
        if (!value) fail('--host 需要 ssh 别名，例如 --host hk');
        return value;
    }
    const index = argv.indexOf('--host');
    if (index === -1) return null;
    const value = String(argv[index + 1] ?? '').trim();
    if (!value || value.startsWith('--')) fail('--host 需要 ssh 别名，例如 --host hk');
    return value;
}

function resolveDistDir() {
    const configured = String(process.env.NEXT_DIST_DIR || '').trim() || '.next';
    return path.isAbsolute(configured) ? path.normalize(configured) : path.join(repoRoot, configured);
}

// statfsSync 要求路径存在；输出目录首次构建前通常不存在，向上找到最近的已存在祖先。
function nearestExistingPath(target) {
    let current = target;
    while (!fs.existsSync(current)) {
        const parent = path.dirname(current);
        if (parent === current) {
            fail('无法定位输出目录的已存在祖先：' + target);
        }
        current = parent;
    }
    return current;
}

function freeBytesAt(target) {
    try {
        const stats = fs.statfsSync(target);
        return Number(stats.bavail) * Number(stats.bsize);
    } catch (error) {
        fail('读取分区可用空间失败（' + target + '）：' + error.message);
    }
}

function deviceOf(target) {
    return fs.statSync(target).dev;
}

function printDfRow(target) {
    const result = spawnSync('df', ['-h', target], { encoding: 'utf8', timeout: 10_000 });
    if (result.error || result.status !== 0 || !result.stdout) {
        log('df 执行失败，跳过该行：' + (result.error?.message || result.stderr?.trim() || 'unknown'));
        return;
    }
    for (const line of result.stdout.trimEnd().split(/\r?\n/)) {
        console.log(line);
    }
}

function collectDuEntries(dir) {
    const result = spawnSync('du', ['-x', '-d1', '-m', dir], {
        encoding: 'utf8',
        timeout: DU_TIMEOUT_MS,
        maxBuffer: 8 * 1024 * 1024,
    });
    if (result.error || !result.stdout) return [];
    const entries = [];
    for (const line of result.stdout.split(/\r?\n/)) {
        const match = /^(\d+)\t(.+)$/.exec(line);
        if (!match) continue;
        const target = match[2];
        // 去掉候选目录自身（深度 0），只留其下一层
        if (path.resolve(target) === path.resolve(dir)) continue;
        entries.push({ mb: Number(match[1]), dir: target });
    }
    return entries;
}

function printTopUsage(targetDev) {
    const candidates = [path.dirname(repoRoot), ...KEY_DIRS];
    const scanned = [];
    const entries = [];

    for (const candidate of [...new Set(candidates)]) {
        let stats;
        try {
            stats = fs.statSync(candidate);
        } catch {
            continue;
        }
        if (!stats.isDirectory() || stats.dev !== targetDev) continue;
        scanned.push(candidate);
        entries.push(...collectDuEntries(candidate));
    }

    if (entries.length === 0) {
        log('占用 Top ' + TOP_USAGE_LIMIT + '：未能获取（du 无结果）');
        return;
    }

    entries.sort((a, b) => b.mb - a.mb);
    const top = [];
    for (const entry of entries) {
        // 祖先目录已入选时跳过其子目录，避免同一份占用重复出现
        const covered = top.some(
            (picked) => entry.dir === picked.dir || entry.dir.startsWith(picked.dir + path.sep),
        );
        if (covered) continue;
        top.push(entry);
        if (top.length >= TOP_USAGE_LIMIT) break;
    }

    log('占用 Top ' + TOP_USAGE_LIMIT + '（单位 MB，du -x -d1，仅扫同盘关键目录：' + scanned.join(' ') + '）');
    top.forEach((entry, index) => {
        log('  ' + (index + 1) + '. ' + entry.mb + ' MB  ' + entry.dir);
    });
}

// 只跑只读命令；BatchMode 避免卡在交互式密码/确认提示，超时后 kill。
function runSsh(host, remoteCommand, timeoutMs) {
    const result = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', host, remoteCommand], {
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 8 * 1024 * 1024,
    });
    if (result.error) {
        const reason =
            result.error.code === 'ETIMEDOUT'
                ? '超时 ' + Math.round(timeoutMs / 1000) + 's 未返回'
                : result.error.message;
        fail('连接目标机 ' + host + ' 失败（ssh）：' + reason + '；无法判定目标机容量，按失败处理');
    }
    if (result.status !== 0) {
        const detail = String(result.stderr || '').trim() || '无 stderr 输出';
        fail('连接目标机 ' + host + ' 失败（ssh rc=' + result.status + '）：' + detail);
    }
    return String(result.stdout || '');
}

// 诊断专用 ssh：任何失败都只回传结果，绝不 fail()/exit。
// 容量结论在诊断开始前已经形成，诊断取不到数据只能少给信息，不能改判结论。
function runSshQuiet(host, remoteCommand, timeoutMs) {
    const result = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', host, remoteCommand], {
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 8 * 1024 * 1024,
    });
    if (result.error) {
        const reason =
            result.error.code === 'ETIMEDOUT'
                ? '超时 ' + Math.round(timeoutMs / 1000) + 's 未返回'
                : result.error.message;
        return { ok: false, stdout: '', reason };
    }
    if (result.status !== 0) {
        const detail = String(result.stderr || '').trim();
        return { ok: false, stdout: '', reason: 'ssh rc=' + result.status + (detail ? '：' + detail : '') };
    }
    return { ok: true, stdout: String(result.stdout || ''), reason: '' };
}

// `df -P -m / | tail -1` → 文件系统 总MB 已用MB 可用MB 使用率 挂载点
function parseRemoteDfLine(line) {
    const fields = line.trim().split(/\s+/);
    if (fields.length < 6) {
        fail('目标机 df 输出无法解析：' + line.trim());
    }
    const availableMb = Number(fields[3]);
    if (!Number.isFinite(availableMb)) {
        fail('目标机 df 可用空间无法解析：' + line.trim());
    }
    return availableMb;
}

function printRemoteTopUsage(host) {
    // 远端自己限时，避免 du 在满盘机上拖住 ssh 通道；管道末端是 head，退出码不可靠，
    // 因此「没有输出」也按诊断失败处理。
    const remoteTimeoutSec = Math.max(1, Math.ceil(DU_TIMEOUT_MS / 3000));
    const command =
        'timeout ' +
        remoteTimeoutSec +
        ' du -x -d1 -m ' +
        REMOTE_KEY_DIRS.join(' ') +
        ' 2>/dev/null | sort -rn | head -' +
        TOP_USAGE_LIMIT;
    const result = runSshQuiet(host, command, DU_TIMEOUT_MS + 5000);
    const output = result.ok ? result.stdout.trimEnd() : '';
    if (!output) {
        const reason = result.ok ? 'du 超时或无结果（远端 timeout ' + remoteTimeoutSec + 's）' : result.reason;
        log('诊断获取失败（不影响上面的容量判定）：目标机 ' + host + '，' + reason);
        return;
    }
    log(
        '占用 Top ' + TOP_USAGE_LIMIT + '（目标机 ' + host + '，单位 MB，du -x -d1，扫描：' + REMOTE_KEY_DIRS.join(' ') + '）',
    );
    for (const line of output.split(/\r?\n/)) {
        const match = /^(\d+)\t(.+)$/.exec(line);
        console.log(match ? '  ' + match[2] + '  ' + match[1] + ' MB' : '  ' + line);
    }
}

function reportAndExit(code, details) {
    if (code === 0) {
        log('通过：可用 ' + details.availableGb + ' GB >= 阈值 ' + details.minFreeGb + ' GB');
        process.exit(0);
    }
    if (details.force) {
        log('已绕过（--force）：剩余 ' + details.availableGb + ' GB < 阈值 ' + details.minFreeGb + ' GB，风险自负');
        process.exit(0);
    }
    console.error(
        SCRIPT_TAG +
            ' 磁盘余量不足：需要 ' +
            details.minFreeGb +
            ' GB，实有 ' +
            details.availableGb +
            ' GB（差 ' +
            formatGb(Math.max(0, details.minFreeGb * 1024 ** 3 - details.availableBytes)) +
            ' GB）',
    );
    details.printDiagnostics();
    console.error(SCRIPT_TAG + ' 处理建议：清理上述目录中的旧构建产物（.next/.next-dev/.cache 等）后重试；临时放行加 --force');
    process.exit(1);
}

function checkLocal(minFreeGb, force) {
    const distDir = resolveDistDir();
    const existingPath = nearestExistingPath(distDir);
    const availableBytes = freeBytesAt(existingPath);
    const availableGb = formatGb(availableBytes);
    const repoDev = deviceOf(repoRoot);
    const distDev = deviceOf(existingPath);
    const sameDeviceAsRepo = repoDev === distDev;

    log('判定：本机');
    log('构建输出目录：' + distDir);
    log(
        '判断依据：' +
            (sameDeviceAsRepo
                ? '输出目录与仓库根同分区，按该分区可用空间判断'
                : '输出目录不在仓库根分区（' + distDir + ' 在另一块盘），按其实际所在分区判断'),
    );

    reportAndExit(availableBytes >= minFreeGb * 1024 ** 3 ? 0 : 1, {
        availableBytes,
        availableGb,
        minFreeGb,
        force,
        printDiagnostics: () => {
            printDfRow(existingPath);
            printTopUsage(distDev);
        },
    });
}

function checkRemote(host, minFreeGb, force) {
    log('判定：目标机 ' + host + '（ssh）');
    const dfOutput = runSsh(host, 'df -P -m / | tail -1', SSH_TIMEOUT_MS).trim();
    const dfLine = dfOutput.split(/\r?\n/).filter(Boolean).pop() || '';
    console.log(dfLine);
    const availableMb = parseRemoteDfLine(dfLine);
    const availableBytes = availableMb * 1024 ** 2;
    const availableGb = formatGb(availableBytes);

    reportAndExit(availableBytes >= minFreeGb * 1024 ** 3 ? 0 : 1, {
        availableBytes,
        availableGb,
        minFreeGb,
        force,
        printDiagnostics: () => printRemoteTopUsage(host),
    });
}

const args = process.argv.slice(2);
const minFreeGb = parseMinFreeGb();
const force = args.includes('--force');
const host = parseHostArg(args);

if (host) {
    checkRemote(host, minFreeGb, force);
} else {
    checkLocal(minFreeGb, force);
}
