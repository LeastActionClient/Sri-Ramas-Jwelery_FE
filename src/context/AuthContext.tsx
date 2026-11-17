import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { authApi, LoginPayload } from '@/services/api/auth.api';
import {
  setAccessToken,
  getAccessToken,
  hasAdminSessionHint,
  setAdminSessionHint,
  clearRefreshCache,
} from '@/services/api/client';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isProtectedAdminPath =
      pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

    const existingToken = getAccessToken();
    const hasHint = hasAdminSessionHint();

    // Avoid firing noisy unauthenticated calls on public or login routes
    // unless a prior admin session hint or token exists.
    if (!existingToken && !hasHint && !isProtectedAdminPath) {
      setAccessToken(null);
      setTokenState(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // 1. If an existing token is found, validate it directly with /auth/me
      if (existingToken) {
        setAccessToken(existingToken);
        setTokenState(existingToken);
        try {
          const currentUser = await authApi.getMe();
          setUser(currentUser);
          setAdminSessionHint(true);
          setIsLoading(false);
          return;
        } catch (meErr: any) {
          // If 401 Unauthorized, token has expired -> proceed to refresh below
          if (meErr?.response?.status && meErr.response.status !== 401) {
            throw meErr;
          }
        }
      }

      // 2. Access token is missing or expired: attempt refresh
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      setTokenState(accessToken);
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      setAdminSessionHint(true);
    } catch {
      // Session expired or unauthenticated
      setAccessToken(null);
      setTokenState(null);
      setUser(null);
      setAdminSessionHint(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleSessionExpired = () => {
      setAccessToken(null);
      setTokenState(null);
      setUser(null);
      setAdminSessionHint(false);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [checkAuth]);

  const login = async (credentials: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      clearRefreshCache();
      const response = await authApi.login(credentials);
      setAccessToken(response.accessToken);
      setTokenState(response.accessToken);
      setUser(response.user);
      setAdminSessionHint(true);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearRefreshCache();
      setAdminSessionHint(false);
      setAccessToken(null);
      setTokenState(null);
      setUser(null);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions?.includes(permission) || false;
  };

  const refreshUser = async () => {
    if (getAccessToken()) {
      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
      } catch {
        // silent fail
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
