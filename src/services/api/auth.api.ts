import {
  apiClient,
  clearRefreshCache,
  refreshAccessToken,
  setAdminSessionHint,
  setStoredRefreshToken,
} from './client';
import { ApiResponse, User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    clearRefreshCache();
    const res = await apiClient.post<ApiResponse<any>>('/auth/login', payload);
    const data = res.data.data;
    const rawUser = data.user || data.admin || {};
    const user: User = {
      _id: rawUser._id || rawUser.id || '',
      name: rawUser.name || rawUser.fullName || '',
      email: rawUser.email || '',
      role: rawUser.role || 'STAFF',
      permissions: rawUser.permissions || [],
      isActive: rawUser.isActive ?? (rawUser.status === 'ACTIVE' || true),
      requiresPasswordChange: rawUser.requiresPasswordChange ?? (data.admin?.requiresPasswordChange || false),
      createdAt: rawUser.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updatedAt || new Date().toISOString(),
    };
    const rawRefreshToken = data.refreshToken || data.rawRefreshToken;
    if (rawRefreshToken) {
      setStoredRefreshToken(rawRefreshToken);
    }
    setAdminSessionHint(true);
    return {
      user,
      accessToken: data.accessToken,
    };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearRefreshCache();
      setStoredRefreshToken(null);
      setAdminSessionHint(false);
    }
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post('/auth/change-password', payload);
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<any>>('/auth/me');
    const raw = res.data.data;
    const roleName = raw?.roleId?.name || raw?.role || 'STAFF';
    const permissions = raw?.roleId?.permissions || raw?.permissions || [];
    return {
      _id: raw?._id || raw?.id || '',
      name: raw?.fullName || raw?.name || '',
      email: raw?.email || '',
      role: roleName,
      permissions,
      isActive: raw?.status === 'ACTIVE' || raw?.isActive === true,
      requiresPasswordChange: raw?.requiresPasswordChange || false,
      createdAt: raw?.createdAt || new Date().toISOString(),
      updatedAt: raw?.updatedAt || new Date().toISOString(),
    };
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    const accessToken = await refreshAccessToken(false);
    return { accessToken };
  },
};
