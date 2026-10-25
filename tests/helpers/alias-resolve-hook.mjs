import { pathToFileURL } from 'node:url';

const apiStubUrl = `data:text/javascript,${encodeURIComponent(`
export async function trackedApiFetch(path, init) {
  const stub = globalThis.__GAME_REVIEW_API_STUB__;
  if (!stub || typeof stub.fetch !== 'function') {
    throw new Error('game review API test stub is not configured');
  }
  return stub.fetch(path, init);
}
`)}`;

const sourceRoot = new URL('../../src/', import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@/lib/api') {
    return { url: apiStubUrl, shortCircuit: true };
  }
  if (specifier.startsWith('@/lib/')) {
    return {
      url: pathToFileURL(`${new URL(specifier.slice(2), sourceRoot).pathname}.ts`).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
