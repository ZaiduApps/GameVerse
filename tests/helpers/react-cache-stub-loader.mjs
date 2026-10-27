import { register } from 'node:module';

register('./react-cache-stub-loader.mjs', import.meta.url);

// site-config.ts 用 react 的 cache() 做请求内记忆——那是 Next 打包进运行时（React 19）的导出，
// 而 node_modules 里的 react 18.3.1 没有 cache，直接跑 node 测试会在模块初始化时抛错。
// 这里只给测试一个透传实现：不记忆，等于每次调用都真实执行，正好用来观察逐次请求。
const reactStubUrl = `data:text/javascript,${encodeURIComponent(`
export function cache(fn) {
  return fn;
}
`)}`;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'react') {
    return { url: reactStubUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
