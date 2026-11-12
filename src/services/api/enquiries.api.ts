import { apiClient } from './client';
import { ApiResponse, Enquiry, EnquiryType, EnquiryStatus } from '@/types';

export interface SubmitEnquiryPayload {
  enquiryType: EnquiryType;
  customerName: string;
  customerMobile: string;
  customerPhone?: string;
  customerEmail?: string;
  preferredContactMethod?: 'CALL' | 'WHATSAPP' | 'EMAIL';
  preferredTimeSlot?: string;
  preferredContactTime?: string;
  city?: string;
  productId?: string;
  schemeId?: string;
  message?: string;
}

export interface EnquiryFilterParams {
  status?: EnquiryStatus;
  type?: EnquiryType;
  search?: string;
  page?: number;
  limit?: number;
}

export const enquiriesApi = {
  submitPublicEnquiry: async (payload: SubmitEnquiryPayload): Promise<{ enquiryNumber: string }> => {
    const res = await apiClient.post<ApiResponse<{ enquiryNumber: string }>>('/public/enquiries', payload);
    return res.data.data;
  },

  adminGetEnquiries: async (params: EnquiryFilterParams = {}): Promise<{ enquiries: Enquiry[]; meta?: ApiResponse<any>['meta'] }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });

    const res = await apiClient.get<ApiResponse<Enquiry[]>>(`/admin/enquiries?${query.toString()}`);
    return {
      enquiries: res.data.data,
      meta: res.data.meta,
    };
  },

  adminGetEnquiryById: async (id: string): Promise<Enquiry> => {
    const res = await apiClient.get<ApiResponse<Enquiry>>(`/admin/enquiries/${id}`);
    return res.data.data;
  },

  adminUpdateStatus: async (id: string, status: EnquiryStatus): Promise<Enquiry> => {
    const res = await apiClient.patch<ApiResponse<Enquiry>>(`/admin/enquiries/${id}/status`, { status });
    return res.data.data;
  },

  adminAddNote: async (id: string, note: string): Promise<Enquiry> => {
    const res = await apiClient.post<ApiResponse<Enquiry>>(`/admin/enquiries/${id}/notes`, { note });
    return res.data.data;
  },

  adminExportCsv: async (): Promise<Blob> => {
    const res = await apiClient.get('/admin/enquiries/export', { responseType: 'blob' });
    return res.data;
  },
};
