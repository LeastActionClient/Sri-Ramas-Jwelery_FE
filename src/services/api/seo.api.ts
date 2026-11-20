import { apiClient } from './client';
import { ApiResponse } from '@/types';

export interface IPageSeo {
  pageKey: string;
  pageName: string;
  path: string;
  title: string;
  description: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface ISeoSettings {
  _id?: string;
  siteDefaultTitle: string;
  siteDefaultDescription: string;
  siteDefaultOgImage: string;
  googleSearchConsoleVerification?: string;
  pages: IPageSeo[];
  updatedAt?: string;
  createdAt?: string;
}

export const seoApi = {
  getPublicSettings: async (): Promise<ISeoSettings> => {
    const res = await apiClient.get<ApiResponse<ISeoSettings>>('/public/seo/settings');
    return res.data.data;
  },

  getAdminSettings: async (): Promise<ISeoSettings> => {
    const res = await apiClient.get<ApiResponse<ISeoSettings>>('/admin/seo/settings');
    return res.data.data;
  },

  updateAdminSettings: async (payload: Partial<ISeoSettings>): Promise<ISeoSettings> => {
    const res = await apiClient.put<ApiResponse<ISeoSettings>>('/admin/seo/settings', payload);
    return res.data.data;
  }
};
