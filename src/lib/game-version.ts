/**
 * 版本号的「像不像版本号」判断，全站唯一口径。
 *
 * Google Play 对「App Bundle 按 SDK 分轨发布」的应用返回字面占位符 `VARY`，
 * 含义是「这个应用没有单一版本名」。interface 侧会把裸 VARY 升级成代理版本
 * `VARY@<epoch>` 供检测链路比较（见 interface/src/modules/resource-update/
 * resource-version.ts），两种形态都会原样流到 GameVerse。它们不是可读版本号，
 * 任何展示 / 模板拼接都必须当成「版本缺失」处理，否则页面会出现 `vVARY`。
 */

/** 占位符可能被上游或历史数据带上 `v` 前缀（`vVARY`），这里一并识别。 */
const PLACEHOLDER_VERSION_PATTERN = /^V*VARY(?:@.*)?$/i;

/** 是否为「无单一版本名」占位符，同时接受裸 VARY 与代理版本 VARY@<epoch>。 */
export function isPlaceholderVersion(value: unknown): boolean {
  return PLACEHOLDER_VERSION_PATTERN.test(String(value ?? '').trim());
}

/**
 * 展示口径的版本号：占位符与空值一律返回空串，调用方据此回落到既有缺失文案。
 * 只过滤已知占位符，不额外校验版本格式；需要「数字开头」等更严约束的调用方
 * 仍应在返回值上叠加自己的规则。
 */
export function resolveDisplayVersion(value: unknown): string {
  const text = String(value ?? '').trim();
  return text && !isPlaceholderVersion(text) ? text : '';
}
