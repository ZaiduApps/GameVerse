'use client';

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface CommunityDraft {
  version: 1;
  userId: string;
  title: string;
  content: string;
  topicIds: string[];
  topicNames: string[];
  updatedAt: number;
}

export interface CommunityDraftImageMeta {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface DraftImageRecord {
  key: string;
  draftKey: string;
  blob: Blob;
  meta: CommunityDraftImageMeta;
}

interface CommunityDraftDB extends DBSchema {
  images: {
    key: string;
    value: DraftImageRecord;
    indexes: { 'by-draft': string };
  };
}

const DRAFT_KEY_PREFIX = 'community:draft:v1:';
const DEVICE_KEY = 'community:draft-device';
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DB_NAME = 'community-drafts';
const DB_VERSION = 1;

let dbPromise: null | Promise<IDBPDatabase<CommunityDraftDB>> = null;

function getDb() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<CommunityDraftDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('images', { keyPath: 'key' });
        store.createIndex('by-draft', 'draftKey');
      },
    });
  }
  return dbPromise;
}

function readDeviceId() {
  try {
    const existing = String(localStorage.getItem(DEVICE_KEY) || '').trim();
    if (existing) return existing;
    const created = `draft-dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_KEY, created);
    return created;
  } catch {
    return 'draft-device';
  }
}

/** 登录用户按用户 ID 隔离；未登录按设备隔离，避免共享设备串草稿。 */
export function resolveDraftKey(userId?: null | string) {
  const normalized = String(userId || '').trim();
  if (normalized) return `${DRAFT_KEY_PREFIX}u:${normalized}`;
  return `${DRAFT_KEY_PREFIX}d:${readDeviceId()}`;
}

function normalizeDraft(raw: any): CommunityDraft | null {
  if (!raw || raw.version !== 1) return null;
  const updatedAt = Number(raw.updatedAt || 0);
  if (!updatedAt || Date.now() - updatedAt > DRAFT_TTL_MS) return null;
  return {
    version: 1,
    userId: String(raw.userId || ''),
    title: String(raw.title || ''),
    content: String(raw.content || ''),
    topicIds: Array.isArray(raw.topicIds) ? raw.topicIds.map(String) : [],
    topicNames: Array.isArray(raw.topicNames) ? raw.topicNames.map(String) : [],
    updatedAt,
  };
}

export function readDraft(draftKey: string): CommunityDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;
    const draft = normalizeDraft(JSON.parse(raw));
    if (!draft) {
      window.localStorage.removeItem(draftKey);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function writeDraft(draftKey: string, draft: CommunityDraft) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  } catch {
    // 本地存储已满或被禁用时静默降级，不阻断发帖。
  }
}

export async function clearDraft(draftKey: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(draftKey);
  } catch {
    // ignore
  }
  const db = getDb();
  if (!db) return;
  try {
    const records = await (await db).getAllFromIndex('images', 'by-draft', draftKey);
    const tx = (await db).transaction('images', 'readwrite');
    await Promise.all([
      ...records.map((record) => tx.store.delete(record.key)),
      tx.done,
    ]);
  } catch {
    // ignore
  }
}

export async function putDraftImage(
  draftKey: string,
  meta: CommunityDraftImageMeta,
  blob: Blob,
) {
  const db = getDb();
  if (!db) return;
  await (await db).put('images', {
    key: `${draftKey}|${meta.id}`,
    draftKey,
    blob,
    meta,
  });
}

export async function deleteDraftImage(draftKey: string, imageId: string) {
  const db = getDb();
  if (!db) return;
  await (await db).delete('images', `${draftKey}|${imageId}`);
}

export async function readDraftImages(
  draftKey: string,
): Promise<Map<string, { blob: Blob; meta: CommunityDraftImageMeta }>> {
  const result = new Map<string, { blob: Blob; meta: CommunityDraftImageMeta }>();
  const db = getDb();
  if (!db) return result;
  const records = await (await db).getAllFromIndex('images', 'by-draft', draftKey);
  for (const record of records) {
    result.set(record.meta.id, { blob: record.blob, meta: record.meta });
  }
  return result;
}

/** 清理超过 7 天的草稿文本与图片。 */
export async function pruneExpiredDrafts() {
  if (typeof window === 'undefined') return;
  const keys: string[] = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(DRAFT_KEY_PREFIX)) keys.push(key);
    }
  } catch {
    return;
  }
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (!normalizeDraft(parsed)) {
        await clearDraft(key);
      }
    } catch {
      await clearDraft(key);
    }
  }
}
