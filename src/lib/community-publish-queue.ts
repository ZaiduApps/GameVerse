'use client';

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import { trackedApiFetch } from '@/lib/api';
import { createCommunityPost } from '@/lib/community-api';

export interface CommunityPublishImage {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
}

export type CommunityPublishStatus = 'done' | 'failed' | 'pending' | 'running';

export interface CommunityPublishJob {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  status: CommunityPublishStatus;
  attempts: number;
  nextAttemptAt?: number;
  lastError?: string;
  title: string;
  content: string;
  topicIds: string[];
  topicNames: string[];
  appId?: string;
  source: string;
  images: CommunityPublishImage[];
  result?: {
    postId: string;
    reviewStatus: string;
    status: number;
  };
}

export type CommunityPublishEvent =
  | { type: 'auth_required' }
  | { type: 'edit_job'; job: CommunityPublishJob }
  | { type: 'job_done'; job: CommunityPublishJob }
  | { type: 'job_failed'; job: CommunityPublishJob }
  | { type: 'job_updated'; job: CommunityPublishJob };

interface PublishDB extends DBSchema {
  jobs: {
    key: string;
    value: CommunityPublishJob;
    indexes: { 'by-user': string };
  };
}

const DB_NAME = 'community-publish';
const DB_VERSION = 1;
const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 300_000, 600_000];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

let dbPromise: null | Promise<IDBPDatabase<PublishDB>> = null;
let running = false;
let ticker: null | ReturnType<typeof setInterval> = null;
const listeners = new Set<(event: CommunityPublishEvent) => void>();

function getDb() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<PublishDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('jobs', { keyPath: 'id' });
        store.createIndex('by-user', 'userId');
      },
    });
  }
  return dbPromise;
}

function emit(event: CommunityPublishEvent) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // 单个订阅者异常不影响队列本身。
    }
  }
}

export function subscribePublishQueue(
  listener: (event: CommunityPublishEvent) => void,
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestEditPublishJob(job: CommunityPublishJob) {
  emit({ type: 'edit_job', job });
}

export async function savePublishJob(job: CommunityPublishJob) {
  const db = getDb();
  if (!db) return;
  await (await db).put('jobs', job);
}

export async function deletePublishJob(jobId: string) {
  const db = getDb();
  if (!db) return;
  await (await db).delete('jobs', jobId);
}

export async function listPublishJobs(userId: string) {
  const db = getDb();
  if (!db || !userId) return [] as CommunityPublishJob[];
  const rows = await (await db).getAllFromIndex('jobs', 'by-user', userId);
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function uploadCommunityPostImage(
  token: string,
  image: CommunityPublishImage,
): Promise<string> {
  if (Number(image.size || 0) > MAX_IMAGE_BYTES) {
    throw new Error('单张图片不能超过 10MB');
  }
  const formData = new FormData();
  formData.append('files', image.blob, image.name || 'image');
  formData.append('scene', 'post_image');
  const res = await trackedApiFetch('/upload/public', {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: 120_000,
    logKey: 'community-post-image-upload',
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok || json?.code !== 0) {
    throw new Error(
      String(json?.message || json?.error || `图片上传失败（HTTP ${res.status}）`),
    );
  }
  const url = String(json?.data?.urls?.[0] || '').trim();
  if (!url) {
    throw new Error('图片上传未返回地址');
  }
  return url;
}

function isRetryable(statusCode: number | undefined, message: string) {
  if (!statusCode) return true;
  if (statusCode === 401 || statusCode === 403) return false;
  if (statusCode === 429) return true;
  if (statusCode >= 500) return true;
  if (statusCode >= 400) return false;
  return !/不能超过|最多|不支持|不能为空|过长/.test(message);
}

async function runJob(job: CommunityPublishJob, token: string) {
  const next: CommunityPublishJob = {
    ...job,
    status: 'running',
    attempts: job.attempts + 1,
    updatedAt: Date.now(),
    lastError: '',
  };
  delete next.nextAttemptAt;
  await savePublishJob(next);
  emit({ type: 'job_updated', job: next });

  try {
    let content = next.content;
    for (const image of next.images) {
      const marker = `local-image://${image.id}`;
      if (!content.includes(marker)) continue;
      const url = await uploadCommunityPostImage(token, image);
      content = content.split(marker).join(url);
    }

    const result = await createCommunityPost({
      token,
      title: next.title,
      content,
      topicIds: next.topicIds,
      topicNames: next.topicNames,
      appId: next.appId,
      source: next.source,
      clientRequestId: next.id,
    });

    if (!result.ok || !result.postId) {
      if (result.statusCode === 401) {
        throw new Error('UNAUTHORIZED');
      }
      const failure = new Error(result.message || '发布失败');
      (failure as Error & { statusCode?: number }).statusCode =
        result.statusCode;
      throw failure;
    }

    const done: CommunityPublishJob = {
      ...next,
      content,
      status: 'done',
      updatedAt: Date.now(),
      result: {
        postId: result.postId,
        reviewStatus: result.reviewStatus || 'pending',
        status: Number.isFinite(Number(result.status)) ? Number(result.status) : 0,
      },
    };
    await deletePublishJob(done.id);
    emit({ type: 'job_done', job: done });
  } catch (error) {
    const message = String((error as Error)?.message || '发布失败');
    if (message === 'UNAUTHORIZED') {
      await savePublishJob({
        ...next,
        status: 'pending',
        updatedAt: Date.now(),
        attempts: Math.max(0, next.attempts - 1),
        lastError: '登录已过期，请重新登录后继续发布',
      });
      emit({ type: 'auth_required' });
      return;
    }

    const statusCode =
      (error as Error & { statusCode?: number })?.statusCode || undefined;
    const retryable = isRetryable(statusCode, message);
    if (retryable && next.attempts < MAX_ATTEMPTS) {
      const delay =
        RETRY_DELAYS_MS[Math.min(next.attempts - 1, RETRY_DELAYS_MS.length - 1)];
      const pending: CommunityPublishJob = {
        ...next,
        status: 'pending',
        updatedAt: Date.now(),
        lastError: message,
        nextAttemptAt: Date.now() + delay,
      };
      await savePublishJob(pending);
      emit({ type: 'job_updated', job: pending });
      return;
    }

    const failed: CommunityPublishJob = {
      ...next,
      status: 'failed',
      updatedAt: Date.now(),
      lastError: message,
    };
    await savePublishJob(failed);
    emit({ type: 'job_failed', job: failed });
  }
}

export async function processPublishQueue(userId: string, token: string) {
  if (running || !userId || !token) return;
  running = true;
  try {
    const jobs = await listPublishJobs(userId);
    for (const job of jobs) {
      if (job.status === 'done' || job.status === 'failed') continue;
      if (job.nextAttemptAt && job.nextAttemptAt > Date.now()) continue;
      await runJob(job, token);
    }
  } finally {
    running = false;
  }
}

/**
 * 页面内常驻调度：登录后立即跑一次，之后每 15 秒检查一次，
 * 页面重新可见时也立即检查（刷新/切回标签页即可续传）。
 */
let authProvider: null | (() => null | { token: string; userId: string }) = null;

export function startPublishQueueTicker(
  getAuth: () => null | { token: string; userId: string },
) {
  if (typeof window === 'undefined') return;
  // 每次调用都更新 provider，token 刷新后定时器仍能拿到最新凭证。
  authProvider = getAuth;
  const tick = () => {
    const auth = authProvider?.();
    if (auth?.userId && auth?.token) {
      void processPublishQueue(auth.userId, auth.token);
    }
  };
  tick();
  if (ticker) return;
  ticker = setInterval(tick, 15_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick();
  });
}
