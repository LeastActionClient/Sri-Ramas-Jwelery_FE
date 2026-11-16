import { apiClient } from './client';
import { ApiResponse, Product } from '@/types';

export interface ProductFilters {
  category?: string;
  categoryId?: string;
  subcategoryId?: string;
  metalType?: string;
  purity?: string;
  gender?: string;
  collectionType?: string;
  visibility?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  minWeight?: number;
  maxWeight?: number;
  sort?: string;
  page?: number;
  limit?: number;
  search?: string;
  diamondCut?: string;
  diamondColor?: string;
  diamondClarity?: string;
  diamondShape?: string;
  diamondCert?: string;
  minCarat?: number;
  maxCarat?: number;
}

export function adaptProduct(raw: any): Product {
  if (!raw) return raw;
  const publicIds: string[] = Array.isArray(raw.imagePublicIds) ? raw.imagePublicIds : [];
  const images = (raw.images || [])
    .filter((img: any) => (typeof img === 'string' ? img.trim().length > 0 : Boolean(img?.url)))
    .map((img: any, idx: number) => {
      if (typeof img === 'string') {
        return {
          url: img,
          isPrimary: idx === (raw.primaryImageIndex || 0),
          altText: raw.name || raw.title || 'Sri Ramas Jewellery',
          publicId: publicIds[idx]
        };
      }
      return {
        url: img.url || '',
        isPrimary: Boolean(img.isPrimary || idx === (raw.primaryImageIndex || 0)),
        altText: img.altText || raw.name || raw.title || 'Sri Ramas Jewellery',
        publicId: img.publicId || publicIds[idx]
      };
    });

  const grossWeight = raw.grossWeightGrams ?? raw.metal?.grossWeightGrams ?? null;
  const netWeight = raw.netMetalWeightGrams ?? raw.metal?.netWeightGrams ?? null;
  const metalType = raw.metalType || raw.metal?.metalType || 'GOLD';
  const purity = (raw.purity || raw.metal?.purity || '').trim();

  const chargeType =
    raw.pricingModel?.makingChargeType === 'PERCENTAGE'
      ? 'PERCENTAGE'
      : raw.pricingModel?.makingChargeType === 'FIXED_AMOUNT'
      ? 'FLAT'
      : 'PER_GRAM';
  const chargeValue = raw.pricingModel?.makingChargeValue ?? raw.makingCharges?.value ?? 0;

  return {
    _id: raw._id?.toString() || raw.id || '',
    title: raw.name || raw.title || '',
    name: raw.name || raw.title || '',
    slug: raw.slug || '',
    sku: raw.sku || '',
    description: raw.description || '',
    categoryId: raw.categoryId?._id?.toString() || raw.categoryId?.toString() || '',
    category: raw.categoryId && typeof raw.categoryId === 'object' ? raw.categoryId : undefined,
    subcategoryId: raw.subcategoryId?._id?.toString() || raw.subcategoryId?.toString() || undefined,
    subcategory: raw.subcategoryId && typeof raw.subcategoryId === 'object' ? raw.subcategoryId : undefined,
    metal: {
      metalType,
      purity: purity || undefined,
      grossWeightGrams: grossWeight,
      netWeightGrams: netWeight
    },
    metalType,
    purity: purity || undefined,
    grossWeightGrams: grossWeight,
    netMetalWeightGrams: netWeight,
    hallmarkStatus: Boolean(raw.hallmarkStatus),
    huid: raw.huid ?? null,
    stones: raw.stones || [],
    makingCharges: {
      chargeType: raw.makingCharges?.chargeType || chargeType,
      value: raw.makingCharges?.value ?? chargeValue
    },
    wastagePercentage: raw.pricingModel?.wastageValue ?? raw.wastagePercentage ?? 0,
    pricingType: raw.pricingType || 'CALCULATED',
    fixedPricePaise: raw.fixedPricePaise,
    images,
    imagePublicIds: publicIds,
    gender: raw.gender,
    occasion: Array.isArray(raw.occasion) ? raw.occasion : [],
    collectionType: raw.collectionType,
    categoryAttributes: raw.categoryAttributes && typeof raw.categoryAttributes === 'object' ? raw.categoryAttributes : {},
    metalDetails: raw.metalDetails && typeof raw.metalDetails === 'object' ? raw.metalDetails : {},
    certification: raw.certification,
    stoneWeightGrams: raw.stoneWeightGrams ?? null,
    otherWeightGrams: raw.otherWeightGrams ?? null,
    actualWastagePercent: raw.actualWastagePercent ?? (typeof raw.actualWastage === 'number' ? raw.actualWastage : null),
    offerWastagePercent: raw.offerWastagePercent ?? (typeof raw.offerWastage === 'number' ? raw.offerWastage : null),
    stockQuantity: typeof raw.stockQuantity === 'number' ? raw.stockQuantity : 1,
    videos: Array.isArray(raw.videos) ? raw.videos : [],
    videoPublicIds: Array.isArray(raw.videoPublicIds) ? raw.videoPublicIds : [],
    media: Array.isArray(raw.media) ? raw.media : undefined,
    stockStatus: raw.stockStatus || 'IN_STOCK',
    isFeatured: Boolean(raw.isFeatured),
    isNewArrival: Boolean(raw.isNewArrival),
    displayOrder: typeof raw.displayOrder === 'number' ? raw.displayOrder : 0,
    isActive: raw.visibility ? raw.visibility === 'PUBLISHED' : Boolean(raw.isActive ?? true),
    visibility: raw.visibility || 'PUBLISHED',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString()
  };
}

export interface ProductAdminPayload {
  name: string;
  sku?: string;
  categoryId: string;
  subcategoryId?: string | null;
  metalType: string;
  purity?: string;
  description?: string;
  grossWeightGrams?: number | null;
  netMetalWeightGrams?: number | null;
  stoneWeightGrams?: number | null;
  actualWastagePercent?: number | null;
  offerWastagePercent?: number | null;
  stockQuantity?: number;
  hallmarkStatus?: boolean;
  huid?: string | null;
  gender?: 'WOMEN' | 'MEN' | 'UNISEX' | 'KIDS';
  occasion?: string[];
  categoryAttributes?: Record<string, any>;
  metalDetails?: Record<string, any>;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  displayOrder?: number;
  visibility?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  images?: string[];
  imagePublicIds?: string[];
  videos?: string[];
  videoPublicIds?: string[];
  media?: Array<{ type: 'IMAGE' | 'VIDEO'; url: string; publicId?: string; isPrimary?: boolean; order?: number }>;
  pricingModel?: {
    wastageType?: 'PERCENTAGE' | 'FIXED_WEIGHT';
    wastageValue?: number;
    makingChargeType?: 'PER_GRAM' | 'PERCENTAGE' | 'FIXED_AMOUNT';
    makingChargeValue?: number;
    stoneChargesPaise?: number;
    otherChargesPaise?: number;
  };
}

export function serializeProductPayload(
  data: Partial<ProductAdminPayload> | Partial<Product>,
  isPartial: boolean = false
) {
  const prodData = data as Partial<Product>;
  const adminData = data as Partial<ProductAdminPayload>;

  const imageUrls = Array.isArray(data.images)
    ? data.images
        .map((img: any) => (typeof img === 'string' ? img : img?.url))
        .filter((u: any): u is string => typeof u === 'string' && u.trim().length > 0)
    : [];

  const publicIds = Array.isArray(adminData.imagePublicIds)
    ? adminData.imagePublicIds
    : Array.isArray(data.images)
    ? data.images
        .map((img: any) => (typeof img === 'string' ? '' : img?.publicId || ''))
        .filter(Boolean)
    : [];

  const rawChargeType = prodData.makingCharges?.chargeType || adminData.pricingModel?.makingChargeType;
  const makingChargeType =
    rawChargeType === 'FLAT' || rawChargeType === 'FIXED_AMOUNT'
      ? 'FIXED_AMOUNT'
      : rawChargeType === 'PERCENTAGE'
      ? 'PERCENTAGE'
      : 'PER_GRAM';

  const gross = adminData.grossWeightGrams ?? prodData.metal?.grossWeightGrams;
  const net = adminData.netMetalWeightGrams ?? prodData.metal?.netWeightGrams;

  const payload: Record<string, any> = {};

  if (!isPartial || adminData.name !== undefined || prodData.title !== undefined) {
    payload.name = (adminData.name ?? prodData.title ?? '').trim();
  }
  if (data.sku !== undefined && String(data.sku).trim().length > 0) {
    payload.sku = String(data.sku).trim().toUpperCase();
  }
  if (!isPartial || data.categoryId !== undefined) {
    payload.categoryId = data.categoryId;
  }
  if (!isPartial || data.subcategoryId !== undefined) {
    payload.subcategoryId = data.subcategoryId || null;
  }
  if (!isPartial || adminData.metalType !== undefined || prodData.metal?.metalType !== undefined) {
    payload.metalType = adminData.metalType ?? prodData.metal?.metalType ?? 'GOLD';
  }
  if (!isPartial || adminData.purity !== undefined || prodData.metal?.purity !== undefined) {
    payload.purity = (adminData.purity ?? prodData.metal?.purity ?? '').trim();
  }
  if (!isPartial || data.description !== undefined) {
    payload.description = (data.description ?? '').trim();
  }
  if (!isPartial || adminData.grossWeightGrams !== undefined || prodData.metal?.grossWeightGrams !== undefined) {
    payload.grossWeightGrams = gross && gross > 0 ? Number(gross) : null;
  }
  if (!isPartial || adminData.netMetalWeightGrams !== undefined || prodData.metal?.netWeightGrams !== undefined) {
    payload.netMetalWeightGrams = net && net > 0 ? Number(net) : null;
  }
  if (!isPartial || data.hallmarkStatus !== undefined) {
    payload.hallmarkStatus = Boolean(data.hallmarkStatus);
  }
  if (!isPartial || data.huid !== undefined) {
    payload.huid = data.huid?.trim() || null;
  }
  if (!isPartial || data.isFeatured !== undefined) {
    payload.isFeatured = Boolean(data.isFeatured);
  }
  if (!isPartial || data.isNewArrival !== undefined) {
    payload.isNewArrival = Boolean(data.isNewArrival);
  }
  if (!isPartial || data.displayOrder !== undefined) {
    payload.displayOrder = Number(data.displayOrder ?? 0);
  }
  if (!isPartial || adminData.visibility !== undefined || prodData.isActive !== undefined) {
    payload.visibility =
      adminData.visibility ?? (prodData.isActive === false ? 'DRAFT' : 'PUBLISHED');
  }
  if (!isPartial || (data as any).stoneWeightGrams !== undefined) {
    const sw = (data as any).stoneWeightGrams;
    payload.stoneWeightGrams = sw && Number(sw) > 0 ? Number(sw) : 0;
  }
  if (!isPartial || (data as any).actualWastagePercent !== undefined) {
    const aw = (data as any).actualWastagePercent;
    payload.actualWastagePercent = aw != null && aw !== '' && !Number.isNaN(Number(aw)) ? Number(aw) : null;
  }
  if (!isPartial || (data as any).offerWastagePercent !== undefined) {
    const ow = (data as any).offerWastagePercent;
    payload.offerWastagePercent = ow != null && ow !== '' && !Number.isNaN(Number(ow)) ? Number(ow) : null;
  }
  if (!isPartial || (data as any).stockQuantity !== undefined) {
    const sq = (data as any).stockQuantity;
    payload.stockQuantity = sq != null && sq !== '' && !Number.isNaN(Number(sq)) ? Math.max(0, Math.trunc(Number(sq))) : 1;
  }
  if (!isPartial || (data as any).videos !== undefined) {
    payload.videos = Array.isArray((data as any).videos) ? (data as any).videos : [];
  }
  if (!isPartial || (data as any).videoPublicIds !== undefined) {
    payload.videoPublicIds = Array.isArray((data as any).videoPublicIds) ? (data as any).videoPublicIds : [];
  }
  if (!isPartial || (data as any).media !== undefined) {
    payload.media = Array.isArray((data as any).media) ? (data as any).media : undefined;
  }
  if (!isPartial || (data as any).gender !== undefined) {
    payload.gender = (data as any).gender || 'WOMEN';
  }
  if (!isPartial || (data as any).occasion !== undefined) {
    payload.occasion = Array.isArray((data as any).occasion) ? (data as any).occasion : [];
  }
  if (!isPartial || (data as any).categoryAttributes !== undefined) {
    payload.categoryAttributes = (data as any).categoryAttributes || {};
  }
  if (!isPartial || (data as any).metalDetails !== undefined) {
    payload.metalDetails = (data as any).metalDetails || {};
  }
  if (!isPartial || data.images !== undefined) {
    payload.images = imageUrls;
  }
  if (!isPartial || adminData.imagePublicIds !== undefined || data.images !== undefined) {
    payload.imagePublicIds = publicIds;
  }
  if (
    !isPartial ||
    adminData.pricingModel !== undefined ||
    prodData.makingCharges !== undefined ||
    prodData.wastagePercentage !== undefined
  ) {
    payload.pricingModel = {
      wastageType: adminData.pricingModel?.wastageType || 'PERCENTAGE',
      wastageValue: Number(prodData.wastagePercentage ?? adminData.pricingModel?.wastageValue ?? 0),
      makingChargeType,
      makingChargeValue: Number(prodData.makingCharges?.value ?? adminData.pricingModel?.makingChargeValue ?? 0),
      stoneChargesPaise: Number(adminData.pricingModel?.stoneChargesPaise ?? 0),
      otherChargesPaise: Number(adminData.pricingModel?.otherChargesPaise ?? 0)
    };
  }

  return payload;
}

export const productsApi = {
  getProducts: async (filters: ProductFilters = {}): Promise<{ products: Product[]; meta?: ApiResponse<any>['meta'] }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        const strVal = typeof val === 'string' ? val.trim() : String(val);
        if (strVal !== '') {
          params.append(key, strVal);
        }
      }
    });

    const res = await apiClient.get<ApiResponse<any[]>>(`/public/products?${params.toString()}`);
    return {
      products: (res.data.data || []).map(adaptProduct),
      meta: res.data.meta,
    };
  },

  getFeaturedProducts: async (options: { category?: string; limit?: number } = {}): Promise<Product[]> => {
    const params = new URLSearchParams();
    params.set('limit', String(options.limit ?? 24));
    if (options.category) {
      params.set('category', options.category);
    }
    const res = await apiClient.get<ApiResponse<any[]>>(`/public/products/featured?${params.toString()}`);
    return (res.data.data || []).map(adaptProduct);
  },

  getNewArrivals: async (): Promise<Product[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/public/products/new-arrivals');
    return (res.data.data || []).map(adaptProduct);
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const res = await apiClient.get<ApiResponse<any>>(`/public/products/${slug}`);
    return adaptProduct(res.data.data);
  },

  adminGetProducts: async (filters: ProductFilters = {}): Promise<{ products: Product[]; meta?: ApiResponse<any>['meta'] }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });

    const res = await apiClient.get<ApiResponse<any[]>>(`/admin/products?${params.toString()}`);
    return {
      products: (res.data.data || []).map(adaptProduct),
      meta: res.data.meta,
    };
  },

  adminGetProductById: async (id: string): Promise<Product> => {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/products/${id}`);
    return adaptProduct(res.data.data);
  },

  adminCreateProduct: async (data: Partial<ProductAdminPayload> | Partial<Product>): Promise<Product> => {
    const payload = serializeProductPayload(data, false);
    const res = await apiClient.post<ApiResponse<any>>('/admin/products', payload);
    return adaptProduct(res.data.data);
  },

  adminUpdateProduct: async (id: string, data: Partial<ProductAdminPayload> | Partial<Product>): Promise<Product> => {
    const payload = serializeProductPayload(data, true);
    const res = await apiClient.put<ApiResponse<any>>(`/admin/products/${id}`, payload);
    return adaptProduct(res.data.data);
  },

  adminUpdateVisibility: async (id: string, visibility: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'): Promise<Product> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/products/${id}/visibility`, { visibility });
    return adaptProduct(res.data.data);
  },

  adminDeleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  adminToggleProductStatus: async (id: string): Promise<Product> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/products/${id}/toggle-status`);
    return adaptProduct(res.data.data);
  },

  adminGenerateSku: async (categoryId?: string): Promise<string> => {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    const res = await apiClient.get<ApiResponse<{ sku: string }>>(
      `/admin/products/generate-sku?${params.toString()}`
    );
    return res.data.data?.sku || '';
  },
};
