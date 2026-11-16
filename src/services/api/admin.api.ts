import { apiClient } from './client';
import { ApiResponse, DashboardStats, AuditLog, User } from '@/types';

export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/dashboard/summary');
    const data = res.data.data;
    const inv = data.inventory || {};
    const enq = data.enquiries || {};
    const rates = data.todayRates || {};

    const gold24 = rates.goldMap?.['24K'] || rates.gold?.find?.((r: any) => r.purity === '24K' || r.purity === '24K_FINE')?.ratePerGramPaise || 0;
    const gold22 = rates.goldMap?.['22K'] || rates.gold?.find?.((r: any) => r.purity === '22K' || r.purity === '22K_916')?.ratePerGramPaise || 0;
    const gold18 = rates.goldMap?.['18K'] || rates.gold?.find?.((r: any) => r.purity === '18K')?.ratePerGramPaise || 0;

    const silver999 = rates.silverMap?.['999'] || rates.silver?.find?.((r: any) => r.purity === '999' || r.purity === '999_FINE')?.ratePerGramPaise || 0;
    const silver925 = rates.silverMap?.['925'] || rates.silver?.find?.((r: any) => r.purity === '925_STERLING' || r.purity === '925')?.ratePerGramPaise || 0;

    const activeLeads = typeof enq.activeLeads === 'number'
      ? enq.activeLeads
      : ((enq.byStatus?.NEW || 0) + (enq.byStatus?.PENDING || 0) + (enq.byStatus?.CONTACTED || 0) + (enq.byStatus?.FOLLOW_UP || 0));

    const newToday = typeof enq.newToday === 'number'
      ? enq.newToday
      : (data.newEnquiriesToday ?? (enq.byStatus?.NEW || 0));

    return {
      totalProducts: inv.publishedProducts ?? inv.totalProducts ?? data.totalProducts ?? 0,
      activeEnquiries: activeLeads,
      newEnquiriesToday: newToday,
      resolvedEnquiries: (enq.byStatus?.RESOLVED || 0) + (enq.byStatus?.CLOSED || 0),
      currentRates: {
        gold: {
          '24K': gold24,
          '22K': gold22,
          '18K': gold18,
        },
        silver: {
          '999': silver999,
          '925': silver925,
        },
        effectiveDate: rates.effectiveDate || rates.timestamp || new Date().toISOString(),
        isOverride: Boolean(rates.isManualOverride || rates.isOverride),
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
