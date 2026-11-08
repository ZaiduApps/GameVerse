/**
 * 社区发帖队列/本地草稿测试用的模块解析钩子（不引入新依赖）。
 *
 * 1. `idb` 换成内存桩：真实 `openDB` 依赖浏览器 IndexedDB，Node 下没有。
 * 2. `@/lib/api` 换成桩，`trackedApiFetch` 转发到 `globalThis.__COMMUNITY_QUEUE_FETCH_STUB__`。
 * 3. `@/lib/community-api` 换成桩，`createCommunityPost` 转发到
 *    `globalThis.__COMMUNITY_CREATE_POST_STUB__`，避免把整个真实 API 模块拖进来。
 *
 * 桩只在测试进程内生效，生产代码零改动。
 */

const idbStubUrl = `data:text/javascript,${encodeURIComponent(`
const databases = new Map();

function createDatabase(version, upgrade) {
  const stores = new Map();
  const db = {
    createObjectStore(storeName, options = {}) {
      if (stores.has(storeName)) {
        throw new Error('object store already exists: ' + storeName);
      }
      const store = { keyPath: options.keyPath, indexes: new Map(), records: new Map() };
      stores.set(storeName, store);
      return {
        createIndex(indexName, keyPath) {
          store.indexes.set(indexName, keyPath);
        },
      };
    },
  };
  if (typeof upgrade === 'function') upgrade(db);
  return { version, stores };
}

function storeOf(entry, storeName) {
  const store = entry.stores.get(storeName);
  if (!store) throw new Error('missing object store: ' + storeName);
  return store;
}

function recordKey(store, value) {
  if (Array.isArray(store.keyPath)) {
    return store.keyPath.map((key) => value[key]).join('|');
  }
  return value[store.keyPath];
}

function putRecord(entry, storeName, value) {
  const store = storeOf(entry, storeName);
  const key = recordKey(store, value);
  store.records.set(key, { ...value });
  return key;
}

function copy(row) {
  return { ...row };
}

function apiFor(entry) {
  return {
    put(storeName, value) {
      return Promise.resolve(putRecord(entry, storeName, value));
    },
    get(storeName, key) {
      return Promise.resolve(storeOf(entry, storeName).records.get(key));
    },
    getAll(storeName) {
      return Promise.resolve([...storeOf(entry, storeName).records.values()].map(copy));
    },
    delete(storeName, key) {
      return Promise.resolve(storeOf(entry, storeName).records.delete(key));
    },
    getAllFromIndex(storeName, indexName, value) {
      const store = storeOf(entry, storeName);
      const indexKeyPath = store.indexes.get(indexName);
      if (!indexKeyPath) throw new Error('missing index: ' + indexName);
      return Promise.resolve(
        [...store.records.values()]
          .filter((row) => row[indexKeyPath] === value)
          .map(copy),
      );
    },
    transaction(storeName) {
      const store = storeOf(entry, storeName);
      return {
        store: {
          put(value) {
            return Promise.resolve(putRecord(entry, storeName, value));
          },
          delete(key) {
            return Promise.resolve(store.records.delete(key));
          },
          get(key) {
            return Promise.resolve(store.records.get(key));
          },
        },
        done: Promise.resolve(),
      };
    },
    close() {},
  };
}

export function openDB(name, version, callbacks = {}) {
  let entry = databases.get(name);
  if (!entry || entry.version !== version) {
    entry = createDatabase(version, callbacks.upgrade);
    databases.set(name, entry);
  }
  if (!entry.api) entry.api = apiFor(entry);
  return Promise.resolve(entry.api);
}

globalThis.__COMMUNITY_IDB_STUB__ = {
  reset() {
    for (const entry of databases.values()) {
      for (const store of entry.stores.values()) store.records.clear();
    }
  },
};
`)}`;

const apiStubUrl = `data:text/javascript,${encodeURIComponent(`
export async function trackedApiFetch(path, init) {
  const stub = globalThis.__COMMUNITY_QUEUE_FETCH_STUB__;
  if (!stub || typeof stub.fetch !== 'function') {
    throw new Error('community queue fetch stub is not configured');
  }
  return stub.fetch(path, init);
}
`)}`;

const communityApiStubUrl = `data:text/javascript,${encodeURIComponent(`
export async function createCommunityPost(params) {
  const stub = globalThis.__COMMUNITY_CREATE_POST_STUB__;
  if (!stub || typeof stub.create !== 'function') {
    throw new Error('createCommunityPost stub is not configured');
  }
  return stub.create(params);
}
`)}`;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'idb') {
    return { url: idbStubUrl, shortCircuit: true };
  }
  if (specifier === '@/lib/api') {
    return { url: apiStubUrl, shortCircuit: true };
  }
  if (specifier === '@/lib/community-api') {
    return { url: communityApiStubUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
