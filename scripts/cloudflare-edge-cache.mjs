#!/usr/bin/env node
/**
 * 给 apks.cc 下发「详情页 HTML 边缘缓存」的 Cloudflare Cache Rule。
 *
 * 默认 dry-run：只读现有规则 + 打印将要下发的请求体，不发写请求。
 * `--apply` 才真正 PUT 到 Cloudflare。
 *
 * 凭据只从环境变量 CF_API_TOKEN 或 ~/.config/apkscc/cloudflare.key 读，
 * 任何输出（含错误信息、日志、json 打印）都不回显 token。
 *
 * 退出码：
 *   0  成功（dry-run 成功 / apply 成功）
 *   1  其它失败
 *   4  凭据缺失或权限不足（站点级 rulesets 接口多为 403）→ 需要老板在面板操作
 */
import { readFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

import {
  CACHE_RULE_BODY,
  CACHE_RULE_DESCRIPTION,
  CACHE_RULE_EXPRESSION,
  CACHE_RULE_PHASE,
  validateRuleExpression,
} from './lib/edge-cache-policy.mjs';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_ZONE_ID = 'e7b3dd0389edcdc16406720de627258e';
const DEFAULT_TOKEN_FILE = path.join(homedir(), '.config', 'apkscc', 'cloudflare.key');
const RULE_DESCRIPTION = CACHE_RULE_DESCRIPTION;
const RULE_EXPRESSION = CACHE_RULE_EXPRESSION;
const PHASE = CACHE_RULE_PHASE;
const RULE_BODY = CACHE_RULE_BODY;

function printPanelSteps() {
  console.log(`
面板操作清单（Cloudflare Dashboard → apks.cc → Rules → Cache Rules → Create rule）：
  1. Rule name: ${RULE_DESCRIPTION}
  2. If incoming requests match… → Use expression builder，表达式原文：
       ${RULE_EXPRESSION}
     （等价于 Custom filter expression / Edit expression 粘贴上述表达式；
       not ... query contains "_rsc=" 用来排除 Next 的 RSC/预取请求）
  3. Cache eligibility: Eligible for cache
  4. Edge TTL: Use cache-control header if present, bypass cache if not（即 respect_origin）
  5. Browser TTL: Respect origin TTL
  6. （保持默认）Cache key 不做自定义：查询串参与 cache key；_rsc 请求已由表达式排除
  7. Deploy → 用 scripts/assert-edge-cache.mjs 复验

说明：源站已把详情页 HTML 的 Vary 收口成只剩 Accept-Encoding
（scripts/lib/html-vary.mjs），所以这里不需要额外的 Transform Rule。`);
}

function parseArgs(argv) {
  const options = { apply: false, zoneId: process.env.CF_ZONE_ID || DEFAULT_ZONE_ID };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') options.apply = true;
    else if (arg === '--dry-run') options.apply = false;
    else if (arg === '--zone') options.zoneId = argv[++index];
    else if (arg === '--help' || arg === '-h') options.help = true;
    else {
      console.error(`未知参数: ${arg}`);
      process.exit(1);
    }
  }
  return options;
}

async function resolveToken() {
  const fromEnv = String(process.env.CF_API_TOKEN || '').trim();
  if (fromEnv) return { token: fromEnv, source: '环境变量 CF_API_TOKEN' };

  const tokenFile = process.env.CF_TOKEN_FILE || DEFAULT_TOKEN_FILE;
  try {
    await access(tokenFile, fsConstants.R_OK);
  } catch {
    return { token: '', source: `未找到 ${tokenFile}` };
  }
  const token = (await readFile(tokenFile, 'utf8')).trim();
  // 只暴露文件名，不暴露内容。
  return { token, source: tokenFile };
}

function maskToken(text) {
  const raw = String(text || '');
  return raw.replace(/[A-Za-z0-9_-]{20,}/g, (match) => `${match.slice(0, 4)}***${match.slice(-2)}`);
}

async function callApi({ token, method, url, body }) {
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let payload = null;
  const text = await response.text();
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text.slice(0, 500) };
  }
  return { status: response.status, payload };
}

function isPermissionError(result) {
  if (result.status === 401 || result.status === 403) return true;
  const errors = result.payload?.errors;
  if (!Array.isArray(errors)) return false;
  return errors.some((error) => [10000, 9109, 9106].includes(Number(error?.code)));
}

function summarizeRules(rules) {
  if (!Array.isArray(rules) || rules.length === 0) return '（无规则）';
  return rules
    .map((rule, index) => {
      const ttl = rule?.action_parameters?.edge_ttl?.mode || 'default';
      const cache = rule?.action_parameters?.cache ?? 'default';
      return `  ${index + 1}. [${rule.enabled === false ? 'disabled' : 'enabled'}] ${rule.action || '?'} · cache=${cache} · edge_ttl=${ttl} · ${rule.description || '(无描述)'}\n     ${rule.expression || ''}`;
    })
    .join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`用法: node scripts/cloudflare-edge-cache.mjs [--apply] [--zone <zoneId>]

默认 dry-run：只读现有 Cache Rules 并打印将下发的规则体，不发写请求。
--apply 才真正下发（需要 Zone → Cache Rules / Rulesets 编辑权限）。

退出码: 0 成功 · 1 其它失败 · 4 凭据缺失或权限不足（需面板操作）`);
    return 0;
  }

  const { token, source } = await resolveToken();
  if (!token) {
    console.error(`[edge-cache] 缺少 Cloudflare API Token：${source}`);
    printPanelSteps();
    return 4;
  }

  const entrypointUrl = `${API_BASE}/zones/${options.zoneId}/rulesets/phases/${PHASE}/entrypoint`;
  console.log(`[edge-cache] zone=${options.zoneId} phase=${PHASE} token=${source} mode=${options.apply ? 'apply' : 'dry-run'}`);

  const expressionProblems = validateRuleExpression(RULE_EXPRESSION);
  if (expressionProblems.length > 0) {
    console.error(`[edge-cache] 规则表达式不合约定: ${expressionProblems.join('; ')}`);
    return 1;
  }

  const current = await callApi({ token, method: 'GET', url: entrypointUrl });
  if (isPermissionError(current)) {
    console.error('[edge-cache] 读 Cache Rules 被拒（站点级 rulesets 接口需要 Zone Rulesets 编辑权限）。');
    console.error(maskToken(`  status=${current.status} errors=${JSON.stringify(current.payload?.errors || [])}`));
    printPanelSteps();
    return 4;
  }
  if (current.status !== 200 && current.status !== 404) {
    console.error(maskToken(`[edge-cache] 读规则失败: status=${current.status} ${JSON.stringify(current.payload?.errors || current.payload || {})}`));
    return 1;
  }

  const existingRules = Array.isArray(current.payload?.result?.rules) ? current.payload.result.rules : [];
  const others = existingRules.filter((rule) => rule?.description !== RULE_DESCRIPTION);
  const mergedRules = [...others, RULE_BODY];

  console.log(`[edge-cache] 现有规则（${existingRules.length} 条）:`);
  console.log(summarizeRules(existingRules));
  console.log('[edge-cache] 下发后将保留的其它规则:');
  console.log(summarizeRules(others));
  console.log('[edge-cache] 本脚本负责的规则体:');
  console.log(JSON.stringify(RULE_BODY, null, 2));

  if (!options.apply) {
    console.log(`[edge-cache] dry-run：未发写请求。真正执行请加 --apply。`);
    console.log(`[edge-cache] 将调用: PUT ${entrypointUrl}`);
    console.log(`[edge-cache] 请求体: ${JSON.stringify({ rules: mergedRules })}`);
    return 0;
  }

  const applied = await callApi({
    token,
    method: 'PUT',
    url: entrypointUrl,
    body: { rules: mergedRules },
  });
  if (isPermissionError(applied)) {
    console.error('[edge-cache] 写 Cache Rules 被拒（403/权限不足）。');
    console.error(maskToken(`  status=${applied.status} errors=${JSON.stringify(applied.payload?.errors || [])}`));
    printPanelSteps();
    return 4;
  }
  if (applied.status < 200 || applied.status >= 300 || applied.payload?.success === false) {
    console.error(maskToken(`[edge-cache] 下发失败: status=${applied.status} ${JSON.stringify(applied.payload?.errors || {})}`));
    return 1;
  }

  const rules = Array.isArray(applied.payload?.result?.rules) ? applied.payload.result.rules : mergedRules;
  console.log('[edge-cache] 下发成功，当前规则:');
  console.log(summarizeRules(rules));
  console.log('[edge-cache] 下一步：node scripts/assert-edge-cache.mjs --url https://apks.cc/app/com.tencent.ig');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(maskToken(`[edge-cache] 未预期错误: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  });
