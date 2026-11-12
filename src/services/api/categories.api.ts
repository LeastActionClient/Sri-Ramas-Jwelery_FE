import { apiClient } from './client';
import { ApiResponse, Category } from '@/types';

interface BackendCategoryPayload {
  name?: string;
  sku?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Normalizes backend category fields (`displayOrder`, `parentId`) into the frontend `Category` shape.
 */
export function adaptCategory(raw: any): Category {
  const populatedParent =
    raw.parentId && typeof raw.parentId === 'object' ? raw.parentId : undefined;
  const parentId =
    raw.parentCategoryId ??
    (populatedParent ? populatedParent._id : raw.parentId ?? null);

  const sortOrder =
    typeof raw.displayOrder === 'number'
      ? raw.displayOrder
      : typeof raw.sortOrder === 'number'
        ? raw.sortOrder
        : 0;

  return {
    ...raw,
    sku: raw.sku || undefined,
    parentCategoryId: parentId,
    parentCategory: raw.parentCategory ?? populatedParent,
    imageUrl: raw.imageUrl || undefined,
    imagePublicId: raw.imagePublicId || undefined,
    sortOrder,
    displayOrder: sortOrder,
  };
}

function serializeCategoryPayload(data: Partial<Category>): BackendCategoryPayload {
  const payload: BackendCategoryPayload = {};

  if (data.name !== undefined) payload.name = data.name;
  if (typeof data.sku === 'string' && data.sku.trim().length > 0) {
    payload.sku = data.sku.trim().toUpperCase();
  }
  if (data.slug !== undefined) payload.slug = data.slug;
  if (data.description !== undefined) payload.description = data.description;
  if (data.isActive !== undefined) payload.isActive = data.isActive;

  if (data.parentCategoryId !== undefined) {
    payload.parentId = data.parentCategoryId || null;
  }

  if (data.displayOrder !== undefined || data.sortOrder !== undefined) {
    payload.displayOrder = Number(data.displayOrder ?? data.sortOrder ?? 0);
  }

  if (data.imageUrl !== undefined) {
    payload.imageUrl = data.imageUrl ? data.imageUrl.trim() : null;
  }

  if (data.imagePublicId !== undefined) {
    payload.imagePublicId = data.imagePublicId ? data.imagePublicId.trim() : null;
  }

  return payload;
}

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/public/categories');
    return (res.data.data || [])
      .map(adaptCategory)
      .filter((c) => c.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const res = await apiClient.get<ApiResponse<any>>(`/public/categories/${slug}`);
    return adaptCategory(res.data.data);
  },

  adminGetCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/categories');
    return (res.data.data || [])
      .map(adaptCategory)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  },

  adminCreateCategory: async (data: Partial<Category>): Promise<Category> => {
    const res = await apiClient.post<ApiResponse<any>>(
      '/admin/categories',
      serializeCategoryPayload(data)
    );
    return adaptCategory(res.data.data);
  },

  adminUpdateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const res = await apiClient.put<ApiResponse<any>>(
      `/admin/categories/${id}`,
      serializeCategoryPayload(data)
    );
    return adaptCategory(res.data.data);
  },

  adminDeleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },

  adminGenerateSku: async (name: string, excludeId?: string): Promise<string> => {
    const params = new URLSearchParams();
    if (name.trim()) params.set('name', name.trim());
    if (excludeId) params.set('excludeId', excludeId);
    const res = await apiClient.get<ApiResponse<{ sku: string }>>(
      `/admin/categories/generate-sku?${params.toString()}`
    );
    return res.data.data?.sku || '';
  },
};
