
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, AuthData } from '@/types';
import { trackedApiFetch } from '@/lib/api';
import { getDeviceHeaders } from '@/lib/auth-device';
import { describeFetchException } from '@/lib/auth-errors';
import {
  AUTH_REQUEST_TIMEOUT_MS,
  AUTH_STORAGE_KEYS,
  clearStoredSession,
  persistSession,
  readStoredSession,
  refreshSession,
  subscribeStoredSession,
} from '@/lib/auth-session';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** 最近一次认证请求失败的可读原因；由 AuthStatusBanner 展示，可手动关闭。 */
  authError: string | null;
  clearAuthError: () => void;
  login: (data: AuthData) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  // 记录已经和 /auth/me 对过账的 token，避免刷新换 token 后再多打一次 /me。
  const verifiedTokenRef = useRef<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const applySession = useCallback((nextToken: string | null, nextUser: User | null) => {
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const applyAuthData = useCallback((data: AuthData) => {
    persistSession({ token: data.token, user: data.user });
    verifiedTokenRef.current = data.token;
    applySession(data.token, data.user);
    setAuthError(null);
  }, [applySession]);

  // Restore session on mount: localStorage 里损坏的 JSON 必须清掉，不能留一颗定时炸弹。
  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      applySession(stored.token, stored.user);
    } else {
      try {
        clearStoredSession();
      } catch {
        // 存储不可用（隐私模式）时无需清理。
      }
    }
    setIsLoading(false);
  }, [applySession]);

  // 本页内其它入口（如单飞刷新）落盘后同步内存态；别的标签页靠 storage 事件同步。
  useEffect(() => subscribeStoredSession((session) => {
    applySession(session?.token ?? null, session?.user ?? null);
  }), [applySession]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key && !AUTH_STORAGE_KEYS.includes(event.key)) return;
      const stored = readStoredSession();
      applySession(stored?.token ?? null, stored?.user ?? null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applySession]);

  const login = useCallback((data: AuthData) => {
    applyAuthData(data);
  }, [applyAuthData]);

  const logout = useCallback(async () => {
    let logoutFailure: string | null = null;
    if (token) {
      try {
        const res = await trackedApiFetch('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            ...getDeviceHeaders(),
          },
          timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
          logKey: 'auth.logout',
        });
        if (!res.ok && res.status >= 500) {
          logoutFailure = '已退出登录，但服务器暂时无法确认登出，稍后请检查登录设备列表。';
        }
      } catch (error) {
        // 本地登出必须完成；服务器未收到通知时把原因留给用户，而不是静默吞掉。
        const failure = describeFetchException(error, '网络连接失败');
        logoutFailure = `已退出登录，但服务器未收到登出通知（${failure.kind === 'timeout' ? '请求超时' : failure.message}）。`;
      }
    }
    verifiedTokenRef.current = null;
    clearStoredSession();
    applySession(null, null);
    setAuthError(logoutFailure);
  }, [applySession, token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    const result = await refreshSession(token);

    switch (result.status) {
      case 'refreshed':
        verifiedTokenRef.current = result.session.token;
        applySession(result.session.token, result.session.user);
        setAuthError(null);
        return;
      case 'unauthorized':
        // 刷新令牌也失效：清会话，提示重新登录。
        verifiedTokenRef.current = null;
        clearStoredSession();
        applySession(null, null);
        setAuthError('登录状态已失效，请重新登录。');
        return;
      case 'failed':
        // 超时 / 网络 / 5xx：保留现有会话，把失败原因暴露到 UI（可重试，不静默）。
        setAuthError(result.failure.message);
        return;
      default:
        return;
    }
  }, [applySession, token]);

  useEffect(() => {
    if (isLoading || !token) return;
    if (verifiedTokenRef.current === token) return;
    void refreshUser();
  }, [isLoading, token, refreshUser]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      authError,
      clearAuthError,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
