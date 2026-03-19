
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, ApiResponse, AuthData } from '@/types';
import { apiUrl } from '@/lib/api';
import { getDeviceHeaders } from '@/lib/auth-device';
import { buildTrackingHeaders } from '@/lib/tracking-headers';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthData) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = apiUrl('/auth');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuthData = useCallback((data: AuthData) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  }, []);

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser && storedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        // Clear corrupted storage data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((data: AuthData) => {
    applyAuthData(data);
  }, [applyAuthData]);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            ...getDeviceHeaders(),
            ...buildTrackingHeaders(),
          }
        });
      } catch (error) {
        // Continue logout even if API fails
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const meRes = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...buildTrackingHeaders(),
        }
      });
      const json: ApiResponse<User> = await meRes.json();

      if (json.code === 401) {
        const refreshRes = await fetch(`${API_BASE_URL}/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            ...getDeviceHeaders(),
            ...buildTrackingHeaders(),
          },
        });

        const refreshJson: ApiResponse<{ token: string }> = await refreshRes.json();
        if (refreshJson.code === 0 && refreshJson.data?.token) {
          localStorage.setItem('auth_token', refreshJson.data.token);
          setToken(refreshJson.data.token);

          const retryRes = await fetch(`${API_BASE_URL}/me`, {
            headers: {
              'Authorization': `Bearer ${refreshJson.data.token}`,
              ...buildTrackingHeaders(),
            }
          });
          const retryJson: ApiResponse<User> = await retryRes.json();
          if (retryJson.code === 0) {
            setUser(retryJson.data);
            localStorage.setItem('auth_user', JSON.stringify(retryJson.data));
            return;
          }
        }

        logout();
        return;
      }

      if (json.code === 0) {
        setUser(json.data);
        localStorage.setItem('auth_user', JSON.stringify(json.data));
      }
    } catch (error) {
      // Silently fail user refresh
    }
  }, [token, logout]);

  useEffect(() => {
    if (!isLoading && token) {
      refreshUser();
    }
  }, [isLoading, token, refreshUser]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
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
