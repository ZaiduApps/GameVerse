/**
 * 社区队列/草稿测试的浏览器环境桩：内存 localStorage + `window`。
 * 不引入依赖，只在测试进程内替换全局对象。
 */

export function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, String(value));
    },
  };
}

/** 安装 `window` / `localStorage`，返回还原函数。 */
export function installBrowserEnv() {
  const storage = createMemoryStorage();
  const windowObject = { localStorage: storage };
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: windowObject,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: storage,
  });

  return { storage, windowObject, hadWindow, previousWindow, previousStorage };
}

export function restoreBrowserEnv(env) {
  if (env.hadWindow) {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: env.previousWindow,
    });
  } else {
    delete globalThis.window;
  }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: env.previousStorage,
  });
}

/** 清空内存 IndexedDB 桩里的数据；桩模块被解析后才可用。 */
export function resetCommunityIdb() {
  const runtime = globalThis.__COMMUNITY_IDB_STUB__;
  if (runtime?.reset) runtime.reset();
}
