import { apiClient } from './client';
import { ApiResponse, DashboardStats, AuditLog, User } from '@/types';

export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/dashboard/summary');
    const data = res.data.data;
    const inv = data.inventory || {};
    const enq = data.enquiries || {};
    const rates = data.todayRates || {};
    return {
      totalProducts: inv.totalProducts ?? data.totalProducts ?? 0,
      activeEnquiries: (enq.byStatus?.NEW || 0) + (enq.byStatus?.PENDING || 0) || (data.activeEnquiries ?? 0),
      newEnquiriesToday: enq.byStatus?.NEW ?? data.newEnquiriesToday ?? 0,
      resolvedEnquiries: (enq.byStatus?.RESOLVED || 0) + (enq.byStatus?.CLOSED || 0) || (data.resolvedEnquiries ?? 0),
      currentRates: {
        gold: {
          '24K': rates.gold?.find?.((r: any) => r.purity === '24K')?.ratePerGramPaise || 775000,
          '22K': rates.gold?.find?.((r: any) => r.purity === '22K')?.ratePerGramPaise || 712000,
          '18K': rates.gold?.find?.((r: any) => r.purity === '18K')?.ratePerGramPaise || 585000,
        },
        silver: {
          '999': rates.silver?.find?.((r: any) => r.purity === '999')?.ratePerGramPaise || 9800,
          '925': rates.silver?.find?.((r: any) => r.purity === '925_STERLING' || r.purity === '925')?.ratePerGramPaise || 9500,
        },
        effectiveDate: rates.timestamp || new Date().toISOString(),
        isOverride: false,
      },
      recentEnquiries: enq.recent || data.recentEnquiries || []
    };
  },

  getAuditLogs: async (params: { page?: number; limit?: number; module?: string; action?: string } = {}): Promise<{ logs: AuditLog[]; meta?: ApiResponse<any>['meta'] }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, String(v));
    });
    const res = await apiClient.get<ApiResponse<AuditLog[]>>(`/admin/audit-logs?${query.toString()}`);
    return {
      logs: res.data.data,
      meta: res.data.meta,
    };
  },

  getStaffList: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/admins');
    return (res.data.data || []).map((u: any) => ({
      _id: u._id || u.id,
      name: u.fullName || u.name,
      email: u.email,
      role: u.roleId?.name || u.role,
      permissions: u.roleId?.permissions || u.permissions || [],
      isActive: u.status === 'ACTIVE' || u.isActive === true,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));
  },

  createStaff: async (data: { name: string; email: string; password: string; role: string; permissions?: string[] }): Promise<User> => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/admins', {
      fullName: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      phone: '+919876543210'
    });
    const u = res.data.data;
    return {
      _id: u._id || u.id,
      name: u.fullName || u.name,
      email: u.email,
      role: u.roleId?.name || u.role,
      permissions: u.roleId?.permissions || u.permissions || [],
      isActive: u.status === 'ACTIVE' || u.isActive === true,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    };
  },

  toggleStaffStatus: async (id: string): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/admins/${id}/status`, { status: 'INACTIVE' });
    const u = res.data.data;
    return {
      _id: u._id || u.id,
      name: u.fullName || u.name,
      email: u.email,
      role: u.roleId?.name || u.role,
      permissions: u.roleId?.permissions || u.permissions || [],
      isActive: u.status === 'ACTIVE',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    };
  },
};
