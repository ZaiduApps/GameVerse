import { pathToFileURL } from 'node:url';

/**
 * 把 `@/...` 解析到真实 `src/` 源码，不做任何桩替换。
 *
 * `alias-resolve-hook.mjs` 会把 `@/lib/api` 换成桩（被测模块自己不想发请求时用）；
 * 要测 `src/lib/api.ts` 本身就得用这一份。
 */
const sourceRoot = new URL('../../src/', import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    return {
      url: pathToFileURL(`${new URL(specifier.slice(2), sourceRoot).pathname}.ts`).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
