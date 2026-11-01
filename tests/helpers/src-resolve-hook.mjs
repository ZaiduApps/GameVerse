import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * 把 `@/...` 解析到真实 `src/` 源码，不做任何桩替换。
 *
 * `alias-resolve-hook.mjs` 会把 `@/lib/api` 换成桩（被测模块自己不想发请求时用）；
 * 要测 `src/lib/api.ts` 本身就得用这一份。
 *
 * 相对导入同理：源码里写的是 `./game-detail-presenter`（交给 tsc / Next 解析），
 * 裸 node + 类型剥离只认带扩展名的路径，所以这里按「同目录下存在同名 .ts」补扩展名，
 * 不存在就交回默认解析，不影响 node_modules 与真实文件。
 */
const sourceRoot = new URL('../../src/', import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    return {
      url: pathToFileURL(`${new URL(specifier.slice(2), sourceRoot).pathname}.ts`).href,
      shortCircuit: true,
    };
  }
  if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/i.test(specifier) && context.parentURL) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) {
      return { url: candidate.href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
