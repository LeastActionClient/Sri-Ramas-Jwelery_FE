import axios from 'axios';
import { apiClient } from './client';
import { ApiResponse } from '@/types';

export type StudioMediaFolder = 'categories' | 'products' | 'banners' | 'stores' | 'schemes' | 'digi';

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  isConfigured?: boolean;
}

export interface UploadedImageResult {
  secureUrl: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  storageProvider?: 'cloudinary' | 'local';
}

export const STUDIO_METAL_TYPES = ['GOLD', 'SILVER', 'DIAMOND', 'PLATINUM'] as const;
export type StudioMetalType = (typeof STUDIO_METAL_TYPES)[number];

export interface StudioMediaAsset {
  _id?: string;
  publicId: string;
  secureUrl: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  folder?: string;
  altText?: string;
  metalType?: StudioMetalType;
  createdAt?: string;
  source?: 'local-upload' | 'cloudinary' | 'public-static';
}

export interface SyncKeptLibrarySummary {
  scannedMissingCount: number;
  matchedCount: number;
  remainingMissingCount: number;
  availableLibraryCount: number;
  attached: Array<{
    productId: string;
    title: string;
    sku?: string;
    imageUrl: string;
    metalType: StudioMetalType;
  }>;
}

export interface StudioMediaStatus {
  cloudinaryConfigured: boolean;
  localStorageReady: boolean;
  aiImageGenerationConfigured: boolean;
  geminiConfigured: boolean;
  openaiConfigured: boolean;
  keptAssetCount: number;
}

export interface StudioLibraryResponse {
  assets: StudioMediaAsset[];
  status: StudioMediaStatus;
}

export interface GenerateProductImagePayload {
  productId?: string;
  productName: string;
  sku?: string;
  categoryName?: string;
  metalType?: string;
  purity?: string;
  description?: string;
  customPrompt?: string;
  backgroundStyle?: 'burgundy-velvet' | 'ivory-silk';
  provider?: 'auto' | 'gemini' | 'openai';
  apiKeyOverride?: string;
  saveToProduct?: boolean;
  keepExistingImages?: boolean;
}

export interface GenerateProductImageResponse {
  asset: StudioMediaAsset;
  secureUrl: string;
  publicId: string;
  prompt: string;
  providerUsed: 'gemini' | 'openai';
  modelUsed: string;
  product?: any;
}

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
  'image/gif',
]);

export const ALLOWED_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Validates file type and size before uploading to Cloudinary.
 */
export function validateImageFile(file: Blob): void {
  const type = file.type?.toLowerCase() || '';
  const isVideo = type.startsWith('video/') || ALLOWED_VIDEO_MIME_TYPES.has(type);
  const isImage = type.startsWith('image/') || ALLOWED_IMAGE_MIME_TYPES.has(type);

  if (!isVideo && !isImage) {
    throw new Error('Unsupported media format. Please upload PNG, JPG, WEBP, AVIF, MP4, WEBM, or MOV.');
  }

  const maxBytes = isVideo ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    throw new Error(
      `${isVideo ? 'Video' : 'Image'} file exceeds the ${isVideo ? '50MB' : '10MB'} upload limit.`
    );
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image data as base64.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read uploaded image file.'));
    reader.readAsDataURL(blob);
  });
}

interface MetalStudioSpec {
  label: string;
  defaultMetalDesc: string;
  craftFinish: string;
  lighting: string;
}

export const METAL_STUDIO_SPECS: Record<StudioMetalType, MetalStudioSpec> = {
  GOLD: {
    label: 'Gold',
    defaultMetalDesc: '22K traditional gold',
    craftFinish: 'crisp traditional nakshi metalwork and warm golden lustre reflections',
    lighting: 'balanced warm commercial softbox lighting',
  },
  SILVER: {
    label: 'Silver',
    defaultMetalDesc: '925 sterling silver',
    craftFinish: 'cool-toned sterling silver filigree, crisp oxidized detailing, and mirror-polished sheen',
    lighting: 'neutral-cool daylight studio softbox lighting',
  },
  DIAMOND: {
    label: 'Diamond',
    defaultMetalDesc: '18K gold set with VVS brilliant-cut diamonds',
    craftFinish: 'precision micro-pave diamond settings with sharp facet fire and crystalline sparkle',
    lighting: 'crisp multi-point diamond lighting highlighting high scintillation',
  },
  PLATINUM: {
    label: 'Platinum',
    defaultMetalDesc: 'Pt950 pure platinum',
    craftFinish: 'dense cool-white Pt950 platinum contours with mirror chamfer edges and satin accents',
    lighting: 'calibrated cool luxury studio lighting accentuating pure platinum depth',
  },
};

export function resolveClientMetalType(
  rawMetal?: string | null,
  fallbackText?: string
): StudioMetalType {
  const direct = (rawMetal || '').trim().toUpperCase();
  if ((STUDIO_METAL_TYPES as readonly string[]).includes(direct)) {
    return direct as StudioMetalType;
  }
  const combined = `${rawMetal || ''} ${fallbackText || ''}`.toLowerCase();
  if (/\b(platinum|pt950|pt[\s_-]*950)\b/i.test(combined)) return 'PLATINUM';
  if (/\b(diamond|solitaire|vvs|igi)\b/i.test(combined)) return 'DIAMOND';
  if (/\b(silver|sterling|925|anklet|payal)\b/i.test(combined)) return 'SILVER';
  return 'GOLD';
}

export function buildClientStudioPrompt(input: {
  productName: string;
  categoryName?: string;
  metalType?: string;
  purity?: string;
  description?: string;
  backgroundStyle?: 'burgundy-velvet' | 'ivory-silk';
}): string {
  const backdrop =
    input.backgroundStyle === 'ivory-silk'
      ? 'elegant warm ivory silk studio surface with gentle warm reflections'
      : 'deep burgundy crushed velvet jewellery surface with rich luxury folds';
  const resolvedMetal = resolveClientMetalType(
    input.metalType,
    `${input.purity || ''} ${input.productName || ''} ${input.categoryName || ''}`
  );
  const spec = METAL_STUDIO_SPECS[resolvedMetal];
  const metal =
    [input.purity?.trim(), input.metalType?.trim()].filter(Boolean).join(' ') ||
    spec.defaultMetalDesc;
  const category = input.categoryName?.trim() ? ` (${input.categoryName.trim()})` : '';
  const craft = input.description?.trim() ? ` ${input.description.trim()}` : '';

  return [
    `Ultra-realistic luxury South Indian jewellery studio photograph of "${input.productName || `Heritage ${spec.label} Jewellery`}"${category}.`,
    `Crafted in ${metal} with ${spec.craftFinish}.${craft}`,
    `Staged symmetrically in sharp macro focus on a ${backdrop}, ${spec.lighting}, 1:1 square product framing.`,
    'Strictly no humans, faces, hands, necks, mannequins, logos, watermarks, or text labels.',
  ]
    .filter(Boolean)
    .join(' ');
}

export const mediaApi = {
  getUploadSignature: async (folder: string = 'categories'): Promise<CloudinarySignatureResponse> => {
    const res = await apiClient.post<ApiResponse<CloudinarySignatureResponse>>(
      `/admin/media/upload-signature?folder=${encodeURIComponent(folder)}`,
      { folder }
    );
    return res.data.data;
  },

  listMedia: async (folder?: string): Promise<StudioLibraryResponse> => {
    const query = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    const res = await apiClient.get<ApiResponse<StudioLibraryResponse>>(`/admin/media${query}`);
    return res.data.data;
  },

  registerMedia: async (payload: {
    publicId: string;
    secureUrl: string;
    format?: string;
    width?: number;
    height?: number;
    bytes?: number;
    folder?: string;
    altText?: string;
  }): Promise<void> => {
    await apiClient.post('/admin/media/register', payload);
  },

  /**
   * Saves a dropped, browsed, or pasted image persistently to backend /uploads/<folder>/ storage
   * (or Cloudinary when configured) and optionally binds it to the target product record.
   */
  uploadLocalMedia: async (payload: {
    file?: Blob;
    dataUrl?: string;
    folder?: StudioMediaFolder;
    fileName?: string;
    altText?: string;
    productId?: string;
    keepExistingImages?: boolean;
  }): Promise<UploadedImageResult & { product?: any }> => {
    if (payload.file) {
      validateImageFile(payload.file);
    }

    const dataUrl = payload.dataUrl || (payload.file ? await blobToDataUrl(payload.file) : '');
    if (!dataUrl) {
      throw new Error('No image data supplied for upload.');
    }

    const res = await apiClient.post<
      ApiResponse<{
        asset: StudioMediaAsset;
        secureUrl: string;
        publicId: string;
        product?: any;
      }>
    >('/admin/media/local-upload', {
      dataUrl,
      folder: payload.folder || 'products',
      fileName: payload.fileName || (payload.file instanceof File ? payload.file.name : undefined),
      altText: payload.altText,
      productId: payload.productId,
      keepExistingImages: Boolean(payload.keepExistingImages),
    });

    const data = res.data.data;
    return {
      secureUrl: data.secureUrl,
      publicId: data.publicId,
      format: data.asset?.format,
      bytes: data.asset?.bytes,
      storageProvider: data.publicId.startsWith('local/') ? 'local' : 'cloudinary',
      product: data.product,
    };
  },

  /**
   * Executes signed Cloudinary upload when credentials are configured, or seamlessly persists via
   * backend /admin/media/local-upload studio storage so Admin uploads never fail in local environments.
   */
  uploadImageToCloudinary: async (
    file: Blob,
    folder: StudioMediaFolder = 'categories',
    altText?: string
  ): Promise<UploadedImageResult> => {
    validateImageFile(file);

    const sig = await mediaApi.getUploadSignature(folder);
    if (sig.isConfigured === false) {
      return mediaApi.uploadLocalMedia({
        file,
        folder,
        fileName: file instanceof File ? file.name : undefined,
        altText,
      });
    }

    const isVideo = file.type?.toLowerCase().startsWith('video/') || false;
    const resourceType = isVideo ? 'video' : 'image';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', String(sig.timestamp));
    formData.append('signature', sig.signature);
    formData.append('folder', sig.folder);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(sig.cloudName)}/${resourceType}/upload`;

    let uploadRes;
    try {
      uploadRes = await axios.post(cloudinaryUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch {
      // Fallback: Upload through authenticated backend service directly into Cloudinary
      return mediaApi.uploadLocalMedia({
        file,
        folder,
        fileName: file instanceof File ? file.name : undefined,
        altText,
      });
    }

    const { secure_url, public_id, format, width, height, bytes } = uploadRes.data || {};
    if (!secure_url || !public_id) {
      throw new Error('Cloudinary did not return a secure URL and public ID.');
    }

    await mediaApi.registerMedia({
      publicId: public_id,
      secureUrl: secure_url,
      format,
      width,
      height,
      bytes,
      folder: sig.folder,
      altText,
    });

    return {
      secureUrl: secure_url,
      publicId: public_id,
      format,
      width,
      height,
      bytes,
      storageProvider: 'cloudinary',
    };
  },

  deleteMediaByPublicId: async (publicId: string): Promise<void> => {
    if (!publicId) return;
    await apiClient.post('/admin/media/delete-by-public-id', { publicId });
  },

  generateProductImage: async (
    payload: GenerateProductImagePayload
  ): Promise<GenerateProductImageResponse> => {
    const res = await apiClient.post<ApiResponse<GenerateProductImageResponse>>(
      '/admin/media/generate-product-image',
      payload
    );
    return res.data.data;
  },

  saveAiConfig: async (payload: {
    provider: 'gemini' | 'openai';
    apiKey: string;
    isEnabled?: boolean;
  }): Promise<StudioMediaStatus> => {
    const res = await apiClient.post<ApiResponse<StudioMediaStatus>>('/admin/media/ai-config', payload);
    return res.data.data;
  },

  attachMediaToProduct: async (payload: {
    productId: string;
    secureUrl: string;
    publicId?: string;
    keepExistingImages?: boolean;
  }) => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/media/attach-product', payload);
    return res.data.data;
  },

  syncKeptPhotos: async (): Promise<SyncKeptLibrarySummary> => {
    const res = await apiClient.post<ApiResponse<SyncKeptLibrarySummary>>(
      '/admin/media/sync-kept-library'
    );
    return res.data.data;
  },

  deleteMedia: async (mediaId: string): Promise<void> => {
    await apiClient.delete(`/admin/media/${encodeURIComponent(mediaId)}`);
  },
};
