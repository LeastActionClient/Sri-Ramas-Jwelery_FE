import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  RefreshCw,
  Upload,
  Film,
  Image as ImageIcon,
  Star,
  Loader2,
  ClipboardPaste,
  Copy,
  Check,
  UploadCloud
} from 'lucide-react';
import { productsApi, ProductAdminPayload } from '@/services/api/products.api';
import { categoriesApi } from '@/services/api/categories.api';
import {
  mediaApi,
  METAL_STUDIO_SPECS,
  STUDIO_METAL_TYPES,
  StudioMetalType
} from '@/services/api/media.api';
import { ProductCard } from '@/components/customer/ProductCard';
import { AdminModalPortal } from '@/components/admin/AdminModalPortal';
import { Product } from '@/types';
import { generateLocalProductSkuPreview } from '@/utils/sku';
import { extractApiErrorMessage } from '@/utils/apiError';

const computeWeightValidationError = (grossStr: string, netStr: string): string | null => {
  const gross = grossStr.trim().length > 0 ? Number(grossStr) : null;
  const net = netStr.trim().length > 0 ? Number(netStr) : null;
  if (gross !== null && (!Number.isFinite(gross) || gross <= 0)) {
    return 'Gross weight must be greater than 0 g, or leave the field blank.';
  }
  if (net !== null && (!Number.isFinite(net) || net <= 0)) {
    return 'Net metal weight must be greater than 0 g, or leave the field blank.';
  }
  if (gross !== null && net !== null && net > gross) {
    return `Net metal weight (${net} g) cannot exceed gross weight (${gross} g). Reduce Net Weight or increase/clear Gross Weight.`;
  }
  return null;
};

export interface ProductMediaItem {
  url: string;
  publicId?: string;
  mediaType: 'IMAGE' | 'VIDEO';
  isPrimary: boolean;
}

interface ProductFormState {
  name: string;
  sku: string;
  categoryId: string;
  subcategoryId: string;
  classification: 'BRIDAL' | 'TRADITIONAL' | 'DAILY_WEAR' | '';
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM' | 'DIAMOND';
  purity: string;
  jewelleryType: string;
  grossWeightGrams: string;
  netMetalWeightGrams: string;
  stoneWeightGrams: string;
  stoneDetails: string;
  gemstone: string;
  design: string;
  gender: 'WOMEN' | 'MEN' | 'UNISEX' | 'KIDS';
  occasion: string;
  huid: string;
  hallmarkStatus: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  stockStatus: 'IN_STOCK' | 'MADE_TO_ORDER' | 'OUT_OF_STOCK';
  description: string;
  actualWastagePercent: string;
  offerWastagePercent: string;
  stockQuantity: string;
  mediaItems: ProductMediaItem[];
  makingChargeType: 'PER_GRAM' | 'PERCENTAGE' | 'FIXED_AMOUNT';
  makingChargeValue: string;
  wastageValue: string;
  visibility: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  // Diamond 4Cs and Attributes
  diamondCut: string;
  diamondColor: string;
  diamondClarity: string;
  diamondShape: string;
  diamondCaratWeight: string;
  diamondTotalCaratWeight: string;
  diamondStoneCount: string;
  diamondCertification: string;
  diamondSettingType: string;
}

const createEmptyProductForm = (defaultCategoryId = ''): ProductFormState => ({
  name: '',
  sku: '',
  categoryId: defaultCategoryId,
  subcategoryId: '',
  classification: 'TRADITIONAL',
  metalType: 'GOLD',
  purity: '22K',
  jewelleryType: '',
  grossWeightGrams: '',
  netMetalWeightGrams: '',
  stoneWeightGrams: '',
  stoneDetails: '',
  gemstone: '',
  design: '',
  gender: 'WOMEN',
  occasion: '',
  huid: '',
  hallmarkStatus: true,
  isNewArrival: false,
  isFeatured: false,
  stockStatus: 'IN_STOCK',
  description: '',
  actualWastagePercent: '',
  offerWastagePercent: '',
  stockQuantity: '1',
  mediaItems: [],
  makingChargeType: 'PER_GRAM',
  makingChargeValue: '0',
  wastageValue: '0',
  visibility: 'PUBLISHED',
  diamondCut: '',
  diamondColor: '',
  diamondClarity: '',
  diamondShape: '',
  diamondCaratWeight: '',
  diamondTotalCaratWeight: '',
  diamondStoneCount: '',
  diamondCertification: '',
  diamondSettingType: ''
});

export const ProductManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [metalFilter, setMetalFilter] = useState<'ALL' | StudioMetalType>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(createEmptyProductForm());
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [copiedMediaIndex, setCopiedMediaIndex] = useState<number | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTypeInput, setMediaTypeInput] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSkuManual, setIsSkuManual] = useState(false);
  const isSkuManualRef = useRef(false);
  const skuReqSeqRef = useRef(0);
  const modalFormRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', searchTerm, categoryFilter, visibilityFilter],
    queryFn: () =>
      productsApi.adminGetProducts({
        search: searchTerm || undefined,
        categoryId: categoryFilter || undefined,
        visibility: visibilityFilter || undefined,
        limit: 100
      })
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesApi.adminGetCategories
  });

  const eligibleCategories = useMemo(
    () => categories.filter((c) => c.isActive),
    [categories]
  );

  const mainCategories = useMemo(
    () => eligibleCategories.filter((c) => !c.parentCategoryId && !c.parentCategory),
    [eligibleCategories]
  );

  const availableSubcategories = useMemo(() => {
    if (!formState.categoryId) return [];
    return eligibleCategories.filter((c) => {
      const pId =
        c.parentCategoryId ||
        (typeof c.parentCategory === 'string'
          ? c.parentCategory
          : (c.parentCategory as any)?._id);
      return pId === formState.categoryId;
    });
  }, [eligibleCategories, formState.categoryId]);

  const sortedProducts = useMemo(
    () =>
      [...(data?.products || [])].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      ),
    [data?.products]
  );

  const products = useMemo(() => {
    return sortedProducts.filter((p) => {
      if (metalFilter !== 'ALL' && p.metal?.metalType !== metalFilter) {
        return false;
      }
      return true;
    });
  }, [sortedProducts, metalFilter]);

  const invalidateProductQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['homepage'] });
  };

  const requestAutoProductSku = (categoryId?: string) => {
    const selectedCat = eligibleCategories.find((c) => c._id === categoryId);
    const localPreview = selectedCat
      ? generateLocalProductSkuPreview(
          selectedCat,
          sortedProducts.map((p) => p.sku)
        )
      : '';

    setFormState((prev) => ({
      ...prev,
      ...(categoryId !== undefined ? { categoryId, subcategoryId: '' } : {}),
      sku: localPreview,
    }));

    if (!categoryId) return;
    const reqSeq = ++skuReqSeqRef.current;
    void productsApi
      .adminGenerateSku(categoryId)
      .then((serverSku) => {
        if (skuReqSeqRef.current === reqSeq && !isSkuManualRef.current && serverSku) {
          setFormState((prev) => ({ ...prev, sku: serverSku }));
        }
      })
      .catch(() => {
        // Keep optimistic local preview SKU if network preview fails
      });
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setErrorMsg(null);
    setModalError(null);
    setIsSkuManual(false);
    isSkuManualRef.current = false;
    const initialCat = mainCategories[0];
    const initialMetal = (initialCat?.metalType === 'SILVER' ? 'SILVER' : 'GOLD') as any;
    const initialPurity = initialMetal === 'SILVER' ? '925' : '22K';
    const initialPreviewSku = initialCat
      ? generateLocalProductSkuPreview(
          initialCat,
          sortedProducts.map((p) => p.sku)
        )
      : '';
    setFormState({
      ...createEmptyProductForm(initialCat?._id || ''),
      metalType: initialMetal,
      purity: initialPurity,
      sku: initialPreviewSku
    });
    setIsModalOpen(true);
    if (initialCat?._id) {
      requestAutoProductSku(initialCat._id);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setErrorMsg(null);
    setModalError(null);
    setIsSkuManual(true);
    isSkuManualRef.current = true;

    // Collect all media items: images & videos
    const mediaItems: ProductMediaItem[] = [];
    const images = product.images || [];
    images.forEach((img, idx) => {
      mediaItems.push({
        url: img.url,
        publicId: img.publicId || product.imagePublicIds?.[idx],
        mediaType: 'IMAGE',
        isPrimary: Boolean(img.isPrimary || idx === 0)
      });
    });

    const videos = product.videos || [];
    videos.forEach((vid, idx) => {
      mediaItems.push({
        url: vid,
        publicId: product.videoPublicIds?.[idx],
        mediaType: 'VIDEO',
        isPrimary: false
      });
    });

    // If media array exists with specific flags
    if (Array.isArray(product.media) && product.media.length > 0) {
      const explicitMedia: ProductMediaItem[] = product.media.map((m: any, idx: number) => ({
        url: m.url,
        publicId: m.publicId,
        mediaType: m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        isPrimary: Boolean(m.isPrimary || (idx === 0 && m.type !== 'VIDEO'))
      }));
      if (explicitMedia.length > 0) {
        mediaItems.length = 0;
        mediaItems.push(...explicitMedia);
      }
    }

    const dDetails =
      product.metalDetails?.diamondDetails ||
      product.metalDetails?.diamond ||
      (product.categoryAttributes as any) ||
      {};

    const savedCategoryId =
      typeof product.categoryId === 'object' && product.categoryId
        ? (product.categoryId as any)._id
        : (product.categoryId || product.category?._id || '');

    const savedSubcategoryId =
      typeof product.subcategoryId === 'object' && product.subcategoryId
        ? (product.subcategoryId as any)._id
        : (product.subcategoryId || product.subcategory?._id || '');

    setFormState({
      name: product.name || product.title || '',
      sku: product.sku || '',
      categoryId: savedCategoryId,
      subcategoryId: savedSubcategoryId,
      classification: ((product.classification || product.collectionType || '') as any),
      metalType: (product.metalType || product.metal?.metalType || 'GOLD') as any,
      purity: product.purity || product.metal?.purity || '',
      jewelleryType: String(product.categoryAttributes?.jewelleryType || product.categoryAttributes?.productType || ''),
      grossWeightGrams:
        product.grossWeightGrams && product.grossWeightGrams > 0
          ? String(product.grossWeightGrams)
          : '',
      netMetalWeightGrams:
        product.netMetalWeightGrams && product.netMetalWeightGrams > 0
          ? String(product.netMetalWeightGrams)
          : '',
      stoneWeightGrams:
        product.stoneWeightGrams && Number(product.stoneWeightGrams) > 0
          ? String(product.stoneWeightGrams)
          : '',
      stoneDetails: String(product.categoryAttributes?.stoneDetails || product.categoryAttributes?.stones || ''),
      gemstone: String(product.categoryAttributes?.gemstone || product.categoryAttributes?.gemstones || ''),
      design: String(product.categoryAttributes?.design || product.categoryAttributes?.designDetails || ''),
      gender: (product.gender as any) || 'WOMEN',
      occasion: Array.isArray(product.occasion) ? product.occasion.join(', ') : '',
      huid: product.huid || '',
      hallmarkStatus: product.hallmarkStatus ?? true,
      isNewArrival: Boolean(product.isNewArrival),
      isFeatured: Boolean(product.isFeatured),
      stockStatus: ((product.stockStatus || 'IN_STOCK') as any),
      description: product.description || '',
      actualWastagePercent: product.actualWastagePercent != null ? String(product.actualWastagePercent) : '',
      offerWastagePercent: product.offerWastagePercent != null ? String(product.offerWastagePercent) : '',
      stockQuantity: product.stockQuantity != null ? String(product.stockQuantity) : '1',
      mediaItems,
      makingChargeType:
        product.makingCharges?.chargeType === 'FLAT'
          ? 'FIXED_AMOUNT'
          : (product.makingCharges?.chargeType as any) || 'PER_GRAM',
      makingChargeValue: String(product.makingCharges?.value ?? 0),
      wastageValue: String(product.wastagePercentage ?? 0),
      visibility: (product.visibility as any) || 'PUBLISHED',
      diamondCut: String(dDetails.cut || dDetails.diamondCut || ''),
      diamondColor: String(dDetails.color || dDetails.diamondColor || ''),
      diamondClarity: String(dDetails.clarity || dDetails.diamondClarity || ''),
      diamondShape: String(dDetails.shape || dDetails.diamondShape || ''),
      diamondCaratWeight: dDetails.caratWeight != null ? String(dDetails.caratWeight) : '',
      diamondTotalCaratWeight: dDetails.totalCaratWeight != null ? String(dDetails.totalCaratWeight) : '',
      diamondStoneCount: dDetails.stoneCount != null ? String(dDetails.stoneCount) : '',
      diamondCertification: String(dDetails.certification || dDetails.diamondCertification || product.certification?.agency || ''),
      diamondSettingType: String(dDetails.settingType || dDetails.diamondSettingType || '')
    });
    setIsModalOpen(true);
  };

  const processUploadFiles = async (files: (File | Blob)[], defaultNamePrefix = 'product-media') => {
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    setModalError(null);

    try {
      const newItems: ProductMediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/') || ((file as any).name && /\.(mp4|webm|mov)$/i.test((file as any).name));
        const isImage = file.type.startsWith('image/') || ((file as any).name && /\.(png|jpe?g|webp|gif|svg)$/i.test((file as any).name));

        if (!isVideo && !isImage) {
          throw new Error(`Unsupported file type: ${(file as any).name || 'media'}. Only images and videos are supported.`);
        }

        const fileName = (file as any).name || `${defaultNamePrefix}-${Date.now()}-${i}`;
        const uploaded = await mediaApi.uploadImageToCloudinary(
          file,
          'products',
          fileName
        );

        const hasExistingPrimaryImage = formState.mediaItems.some(
          (m) => m.mediaType === 'IMAGE' && m.isPrimary
        );

        newItems.push({
          url: uploaded.secureUrl,
          publicId: uploaded.publicId,
          mediaType: isVideo ? 'VIDEO' : 'IMAGE',
          isPrimary: !isVideo && !hasExistingPrimaryImage && newItems.length === 0
        });
      }

      setFormState((prev) => ({
        ...prev,
        mediaItems: [...prev.mediaItems, ...newItems]
      }));
      setFeedbackMsg(`Successfully uploaded ${newItems.length} media item(s) to Cloudinary.`);
    } catch (err: any) {
      setModalError(err.message || 'Failed to upload media files.');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processUploadFiles(Array.from(files));
  };

  const handlePasteProductMediaFromClipboard = async () => {
    if (!navigator.clipboard) {
      setFeedbackMsg('Press Ctrl+V to paste your copied image.');
      return;
    }

    try {
      if (typeof navigator.clipboard.read === 'function') {
        try {
          const items = await navigator.clipboard.read();
          const pastedBlobs: Blob[] = [];

          for (const item of items) {
            const mediaType = item.types.find((t) => t.startsWith('image/') || t.startsWith('video/'));
            if (mediaType) {
              const blob = await item.getType(mediaType);
              if (blob) pastedBlobs.push(blob);
            }
          }

          if (pastedBlobs.length > 0) {
            await processUploadFiles(pastedBlobs, 'clipboard-image');
            return;
          }

          // Check for URL in text/plain
          for (const item of items) {
            if (item.types.includes('text/plain')) {
              const textBlob = await item.getType('text/plain');
              const text = (await textBlob.text()).trim();
              if (/^https?:\/\//i.test(text) || text.startsWith('data:')) {
                const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(text);
                const hasExistingPrimary = formState.mediaItems.some((m) => m.mediaType === 'IMAGE' && m.isPrimary);
                setFormState((prev) => ({
                  ...prev,
                  mediaItems: [
                    ...prev.mediaItems,
                    { url: text, mediaType: isVideo ? 'VIDEO' : 'IMAGE', isPrimary: !isVideo && !hasExistingPrimary }
                  ]
                }));
                setFeedbackMsg('Media link pasted from clipboard.');
                return;
              }
            }
          }
        } catch {
          // Fall through to readText
        }
      }

      if (typeof navigator.clipboard.readText === 'function') {
        const text = (await navigator.clipboard.readText()).trim();
        if (/^https?:\/\//i.test(text) || text.startsWith('data:')) {
          const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(text);
          const hasExistingPrimary = formState.mediaItems.some((m) => m.mediaType === 'IMAGE' && m.isPrimary);
          setFormState((prev) => ({
            ...prev,
            mediaItems: [
              ...prev.mediaItems,
              { url: text, mediaType: isVideo ? 'VIDEO' : 'IMAGE', isPrimary: !isVideo && !hasExistingPrimary }
            ]
          }));
          setFeedbackMsg('Media link pasted from clipboard.');
          return;
        }
      }

      setModalError('No image or media found in clipboard. Copy an image (Right-click → Copy image or Win+Shift+S), then press Ctrl+V or click Paste Copied Image.');
    } catch {
      setModalError('Clipboard access was blocked. Click inside the form and press Ctrl+V to paste.');
    }
  };

  const handleCopyProductMediaUrl = async (url: string, index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedMediaIndex(index);
      setFeedbackMsg('Product image URL copied to clipboard.');
      setTimeout(() => setCopiedMediaIndex(null), 2000);
    } catch {
      setModalError('Unable to copy image URL to clipboard.');
    }
  };

  const handleMediaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMedia(true);
  };

  const handleMediaDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMedia(false);
  };

  const handleMediaDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMedia(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      await processUploadFiles(files);
    }
  };

  // Window-level Ctrl+V listener while product modal is open
  React.useEffect(() => {
    if (!isModalOpen) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)
      ) {
        return;
      }

      const items = Array.from(e.clipboardData?.items || []);
      const pastedFiles: File[] = [];
      for (const item of items) {
        if (item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/'))) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        processUploadFiles(pastedFiles, 'clipboard-image');
        return;
      }

      const text = e.clipboardData?.getData('text')?.trim();
      if (text && (/^https?:\/\//i.test(text) || text.startsWith('data:'))) {
        e.preventDefault();
        const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(text);
        const hasExistingPrimary = formState.mediaItems.some((m) => m.mediaType === 'IMAGE' && m.isPrimary);
        setFormState((prev) => ({
          ...prev,
          mediaItems: [
            ...prev.mediaItems,
            { url: text, mediaType: isVideo ? 'VIDEO' : 'IMAGE', isPrimary: !isVideo && !hasExistingPrimary }
          ]
        }));
        setFeedbackMsg('Media link pasted from clipboard.');
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [isModalOpen, formState.mediaItems]);

  const handleAddMediaUrl = () => {
    const trimmed = mediaUrlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setModalError('Please enter a valid HTTP or HTTPS media URL.');
      return;
    }

    const hasExistingPrimary = formState.mediaItems.some(
      (m) => m.mediaType === 'IMAGE' && m.isPrimary
    );

    const newItem: ProductMediaItem = {
      url: trimmed,
      mediaType: mediaTypeInput,
      isPrimary: mediaTypeInput === 'IMAGE' && !hasExistingPrimary
    };

    setFormState((prev) => ({
      ...prev,
      mediaItems: [...prev.mediaItems, newItem]
    }));
    setMediaUrlInput('');
  };

  const handleRemoveMedia = (index: number) => {
    setFormState((prev) => {
      const updated = [...prev.mediaItems];
      const removed = updated.splice(index, 1)[0];
      if (removed?.isPrimary) {
        const nextImg = updated.find((m) => m.mediaType === 'IMAGE');
        if (nextImg) nextImg.isPrimary = true;
      }
      return { ...prev, mediaItems: updated };
    });
  };

  const handleSetPrimaryMedia = (index: number) => {
    setFormState((prev) => {
      const updated = prev.mediaItems.map((m, idx) => ({
        ...m,
        isPrimary: idx === index && m.mediaType === 'IMAGE'
      }));
      return { ...prev, mediaItems: updated };
    });
  };

  const livePreviewProduct: Product = useMemo(() => {
    const selectedCategory = categories.find((c) => c._id === formState.categoryId);
    const gross = formState.grossWeightGrams ? Number(formState.grossWeightGrams) : null;
    const net = formState.netMetalWeightGrams ? Number(formState.netMetalWeightGrams) : null;

    const primaryMedia = formState.mediaItems.find((m) => m.mediaType === 'IMAGE' && m.isPrimary) ||
      formState.mediaItems.find((m) => m.mediaType === 'IMAGE');

    const images = formState.mediaItems
      .filter((m) => m.mediaType === 'IMAGE')
      .map((m) => ({
        url: m.url,
        isPrimary: m.isPrimary,
        publicId: m.publicId
      }));

    const videos = formState.mediaItems
      .filter((m) => m.mediaType === 'VIDEO')
      .map((m) => m.url);

    return {
      _id: editingProduct?._id || 'preview',
      title: formState.name || 'Sample Product Title',
      name: formState.name || 'Sample Product Title',
      slug: editingProduct?.slug || 'preview-product',
      sku: (formState.sku || 'SRJ-PREVIEW').toUpperCase(),
      description: formState.description,
      categoryId: formState.categoryId,
      category: selectedCategory,
      metal: {
        metalType: formState.metalType,
        purity: formState.purity.trim() || undefined,
        grossWeightGrams: gross,
        netWeightGrams: net
      },
      metalType: formState.metalType,
      purity: formState.purity.trim() || undefined,
      grossWeightGrams: gross,
      netMetalWeightGrams: net,
      actualWastagePercent: formState.actualWastagePercent ? Number(formState.actualWastagePercent) : null,
      offerWastagePercent: formState.offerWastagePercent ? Number(formState.offerWastagePercent) : null,
      stockQuantity: formState.stockQuantity ? Math.max(0, parseInt(formState.stockQuantity, 10)) : 1,
      makingCharges: {
        chargeType:
          formState.makingChargeType === 'FIXED_AMOUNT' ? 'FLAT' : formState.makingChargeType,
        value: Number(formState.makingChargeValue || 0)
      },
      pricingType: 'CALCULATED',
      images: images.length > 0 ? images : primaryMedia ? [{ url: primaryMedia.url, isPrimary: true }] : [],
      videos,
      classification: formState.classification || undefined,
      isFeatured: formState.isFeatured,
      isNewArrival: formState.isNewArrival,
      hallmarkStatus: formState.hallmarkStatus,
      stockStatus: formState.stockStatus,
      displayOrder: editingProduct?.displayOrder ?? 0,
      isActive: formState.visibility === 'PUBLISHED',
      visibility: formState.visibility,
      createdAt: '',
      updatedAt: ''
    };
  }, [formState, categories, editingProduct]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setModalError(null);

    try {
      if (formState.name.trim().length < 3) {
        throw new Error('Product name must be at least 3 characters long.');
      }
      if (!formState.categoryId || !eligibleCategories.some((c) => c._id === formState.categoryId)) {
        throw new Error(
          eligibleCategories.length === 0
            ? 'No categories available. Please create a category from Category Management.'
            : 'Please select an active category for this product.'
        );
      }

      // Validate that selected subcategory strictly belongs to the chosen main category
      if (formState.subcategoryId) {
        const subcat = eligibleCategories.find((c) => c._id === formState.subcategoryId);
        const pId =
          subcat?.parentCategoryId ||
          (typeof subcat?.parentCategory === 'string'
            ? subcat?.parentCategory
            : (subcat?.parentCategory as any)?._id);
        if (!subcat || pId !== formState.categoryId) {
          throw new Error('Selected subcategory does not belong to the selected category.');
        }
      }

      const weightValidationError = computeWeightValidationError(
        formState.grossWeightGrams,
        formState.netMetalWeightGrams
      );
      if (weightValidationError) {
        throw new Error(weightValidationError);
      }

      const actualWastageNum = formState.actualWastagePercent.trim()
        ? Number(formState.actualWastagePercent)
        : null;
      const offerWastageNum = formState.offerWastagePercent.trim()
        ? Number(formState.offerWastagePercent)
        : null;

      if (actualWastageNum !== null && (isNaN(actualWastageNum) || actualWastageNum < 0)) {
        throw new Error('Actual Wastage (%) must be a valid non-negative number.');
      }
      if (offerWastageNum !== null && (isNaN(offerWastageNum) || offerWastageNum < 0)) {
        throw new Error('Offer Wastage (%) must be a valid non-negative number.');
      }
      if (actualWastageNum !== null && offerWastageNum !== null && offerWastageNum > actualWastageNum) {
        throw new Error(`Offer wastage (${offerWastageNum}%) cannot exceed actual wastage (${actualWastageNum}%).`);
      }

      const stockQuantityNum = formState.stockQuantity.trim()
        ? parseInt(formState.stockQuantity, 10)
        : 1;
      if (isNaN(stockQuantityNum) || stockQuantityNum < 0) {
        throw new Error('Stock Quantity must be a valid non-negative integer.');
      }

      const gross = formState.grossWeightGrams.trim() ? Number(formState.grossWeightGrams) : null;
      const net = formState.netMetalWeightGrams.trim() ? Number(formState.netMetalWeightGrams) : null;

      const cleanedSku = formState.sku.trim().toUpperCase();
      if (isSkuManual && cleanedSku.length > 0 && cleanedSku.length < 3) {
        throw new Error('Product SKU must be at least 3 characters, or clear it to auto-generate.');
      }
      const shouldSendSku = Boolean(cleanedSku && (editingProduct || isSkuManual));

      const stoneWeightNum = formState.stoneWeightGrams.trim() ? Number(formState.stoneWeightGrams) : 0;
      const categoryAttributes = {
        ...(editingProduct?.categoryAttributes || {}),
        ...(formState.jewelleryType.trim() ? { jewelleryType: formState.jewelleryType.trim() } : {}),
        ...(formState.stoneDetails.trim() ? { stoneDetails: formState.stoneDetails.trim() } : {}),
        ...(formState.gemstone.trim() ? { gemstone: formState.gemstone.trim() } : {}),
        ...(formState.design.trim() ? { design: formState.design.trim() } : {}),
      };

      // Prepare ordered media items (primary image first)
      const imageItems = formState.mediaItems.filter((m) => m.mediaType === 'IMAGE');
      const primaryImg = imageItems.find((m) => m.isPrimary) || imageItems[0];
      const otherImgs = imageItems.filter((m) => m !== primaryImg);
      const orderedImages = primaryImg ? [primaryImg, ...otherImgs] : [];

      const videoItems = formState.mediaItems.filter((m) => m.mediaType === 'VIDEO');

      const images = orderedImages.map((m) => m.url);
      const imagePublicIds = orderedImages.map((m) => m.publicId || '');
      const videos = videoItems.map((m) => m.url);
      const videoPublicIds = videoItems.map((m) => m.publicId || '');

      const media = [
        ...orderedImages.map((m, idx) => ({
          type: 'IMAGE' as const,
          url: m.url,
          publicId: m.publicId,
          isPrimary: idx === 0,
          order: idx
        })),
        ...videoItems.map((m, idx) => ({
          type: 'VIDEO' as const,
          url: m.url,
          publicId: m.publicId,
          isPrimary: false,
          order: orderedImages.length + idx
        }))
      ];

      const payload: ProductAdminPayload = {
        name: formState.name.trim(),
        ...(shouldSendSku ? { sku: cleanedSku } : {}),
        categoryId: formState.categoryId,
        subcategoryId: formState.subcategoryId || null,
        classification: formState.classification || null,
        metalType: formState.metalType,
        purity: formState.purity.trim(),
        description: formState.description.trim(),
        grossWeightGrams: gross,
        netMetalWeightGrams: net,
        stoneWeightGrams: stoneWeightNum > 0 ? stoneWeightNum : 0,
        actualWastagePercent: actualWastageNum,
        offerWastagePercent: offerWastageNum,
        stockQuantity: stockQuantityNum,
        stockStatus: formState.stockStatus,
        isNewArrival: formState.isNewArrival,
        isFeatured: formState.isFeatured,
        hallmarkStatus: formState.hallmarkStatus,
        gender: formState.gender,
        occasion: formState.occasion.split(',').map((s) => s.trim()).filter(Boolean),
        huid: formState.huid.trim() || null,
        metalDetails: {
          metalType: formState.metalType,
          purity: formState.purity.trim(),
          ...(formState.metalType === 'DIAMOND'
            ? {
                diamondDetails: {
                  cut: formState.diamondCut || undefined,
                  color: formState.diamondColor || undefined,
                  clarity: formState.diamondClarity || undefined,
                  shape: formState.diamondShape || undefined,
                  caratWeight: formState.diamondCaratWeight ? Number(formState.diamondCaratWeight) : undefined,
                  totalCaratWeight: formState.diamondTotalCaratWeight ? Number(formState.diamondTotalCaratWeight) : undefined,
                  stoneCount: formState.diamondStoneCount ? Number(formState.diamondStoneCount) : undefined,
                  certification: formState.diamondCertification || undefined,
                  settingType: formState.diamondSettingType || undefined
                }
              }
            : formState.metalType === 'PLATINUM'
            ? {
                hallmarkGrade: formState.purity.trim(),
                fineness: formState.purity.replace(/\D/g, '')
              }
            : {}),
        },
        categoryAttributes: {
          ...categoryAttributes,
          ...(formState.metalType === 'DIAMOND'
            ? {
                diamondCut: formState.diamondCut,
                diamondColor: formState.diamondColor,
                diamondClarity: formState.diamondClarity,
                diamondShape: formState.diamondShape,
                diamondCertification: formState.diamondCertification,
                diamondSettingType: formState.diamondSettingType,
              }
            : {})
        },
        visibility: formState.visibility,
        images,
        imagePublicIds,
        videos,
        videoPublicIds,
        media,
        pricingModel: {
          wastageType: 'PERCENTAGE',
          wastageValue: actualWastageNum ?? Number(formState.wastageValue || 0),
          makingChargeType: formState.makingChargeType,
          makingChargeValue: Number(formState.makingChargeValue || 0),
          stoneChargesPaise: 0,
          otherChargesPaise: 0
        }
      };

      if (editingProduct) {
        const updated = await productsApi.adminUpdateProduct(editingProduct._id, payload);
        setFeedbackMsg(`Updated "${updated.name || payload.name}" (${updated.sku}).`);
      } else {
        const created = await productsApi.adminCreateProduct(payload);
        setFeedbackMsg(`Published new jewellery piece "${created.name || payload.name}" (${created.sku}).`);
      }

      invalidateProductQueries();
      setModalError(null);
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = extractApiErrorMessage(err, 'Failed to save jewellery product.');
      setModalError(msg);
      setErrorMsg(msg);
      window.requestAnimationFrame(() => {
        modalFormRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await productsApi.adminToggleProductStatus(product._id);
      setFeedbackMsg(`"${product.title}" visibility switched.`);
      invalidateProductQueries();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to update visibility.');
    }
  };

  const handleToggleStockStatus = async (product: Product) => {
    try {
      const nextStatus = product.stockStatus === 'OUT_OF_STOCK' ? 'IN_STOCK' : 'OUT_OF_STOCK';
      const nextQuantity = nextStatus === 'OUT_OF_STOCK' ? 0 : Math.max(product.stockQuantity || 1, 1);
      await productsApi.adminUpdateProduct(product._id, {
        stockStatus: nextStatus as any,
        stockQuantity: nextQuantity,
      });
      setFeedbackMsg(`Stock status for "${product.title || product.sku}" set to ${nextStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : 'In Stock'}.`);
      invalidateProductQueries();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to update stock status.');
    }
  };

  const handleMoveOrder = async (index: number, delta: -1 | 1) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= products.length) return;
    const current = products[index];
    const neighbor = products[targetIndex];
    try {
      await Promise.all([
        productsApi.adminUpdateProduct(current._id, { displayOrder: neighbor.displayOrder ?? targetIndex }),
        productsApi.adminUpdateProduct(neighbor._id, { displayOrder: current.displayOrder ?? index })
      ]);
      invalidateProductQueries();
    } catch {
      setErrorMsg('Failed to update product display order.');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Archive jewellery item "${product.title}"?`)) return;
    try {
      await productsApi.adminDeleteProduct(product._id);
      setFeedbackMsg(`Archived "${product.title}".`);
      invalidateProductQueries();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to delete product.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Jewellery Inventory &amp; Catalogue
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your catalogue pieces, multi-media photography, and wastage percentages.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Add New Product</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800 rounded-xl flex items-center justify-between animate-toast-enter">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:border-gold-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:border-gold-500 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          aria-label="Filter by visibility"
          className="px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:border-gold-500 bg-white"
        >
          <option value="">All Visibility</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <select
          value={metalFilter}
          onChange={(e) => setMetalFilter(e.target.value as 'ALL' | StudioMetalType)}
          aria-label="Filter by metal collection"
          className="px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:border-gold-500 bg-white"
        >
          <option value="ALL">All Metals</option>
          {STUDIO_METAL_TYPES.map((metal) => (
            <option key={metal} value={metal}>
              {METAL_STUDIO_SPECS[metal].label}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Piece &amp; SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Purity &amp; Weights</th>
                <th className="p-4">Wastage &amp; Stock</th>
                <th className="p-4">Visibility</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    Loading catalogue...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    No jewellery items matching current filters.
                  </td>
                </tr>
              ) : (
                products.map((p, index) => (
                  <tr key={p._id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-semibold text-stone-700 w-6">
                          {p.displayOrder ?? 0}
                        </span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(index, -1)}
                            className="p-0.5 text-stone-400 hover:text-burgundy-900 disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === products.length - 1}
                            onClick={() => handleMoveOrder(index, 1)}
                            className="p-0.5 text-stone-400 hover:text-burgundy-900 disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]?.url ? (
                          <div className="relative shrink-0">
                            <img
                              src={p.images[0].url}
                              alt={p.title}
                              className={`w-11 h-11 rounded-lg object-cover border border-gold-200 ${
                                p.stockStatus === 'OUT_OF_STOCK' ? 'filter grayscale opacity-70' : ''
                              }`}
                            />
                            {((p.images?.length || 0) + (p.videos?.length || 0)) > 1 && (
                              <span className="absolute -top-1.5 -right-1.5 px-1 rounded-full bg-burgundy-900 text-gold-200 text-[9px] font-bold">
                                +{((p.images?.length || 0) + (p.videos?.length || 0)) - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-stone-100 text-stone-400 border border-stone-200 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-burgundy-950 font-serif">{p.title}</div>
                          <div className="font-mono text-[10px] text-stone-500">
                            {p.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-stone-700 font-medium">
                      <div className="space-y-1">
                        <div>{p.category?.name || 'Uncategorized'}</div>
                        {p.subcategory?.name && (
                          <div className="text-[11px] text-stone-500 font-mono">
                            ↳ {p.subcategory.name}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1">
                          {p.classification && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[9px] uppercase">
                              {p.classification.replace(/_/g, ' ')}
                            </span>
                          )}
                          {p.isNewArrival && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[9px] uppercase">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-stone-600">
                      <div>
                        <span className="font-semibold text-burgundy-950">
                          {p.metalType || p.metal?.metalType}
                        </span>
                        {(p.metalType || p.metal?.metalType) === 'DIAMOND' ? (
                          <span className="text-xs text-gold-700 ml-1">
                            {p.metalDetails?.diamondDetails?.cut ? `• ${p.metalDetails.diamondDetails.cut}` : ''}
                            {(p.metalDetails?.diamondDetails?.caratWeight || p.stoneWeightGrams)
                              ? ` • ${p.metalDetails?.diamondDetails?.caratWeight || p.stoneWeightGrams} ct`
                              : ''}
                          </span>
                        ) : (
                          (p.purity || p.metal?.purity) && (
                            <span className="text-xs text-stone-600 ml-1">
                              • {(p.metalType || p.metal?.metalType) === 'PLATINUM' && !(p.purity || p.metal?.purity || '').startsWith('Pt')
                                ? `Pt${p.purity || p.metal?.purity}`
                                : (p.purity || p.metal?.purity)}
                            </span>
                          )
                        )}
                      </div>
                      {p.metal?.grossWeightGrams ? (
                        <div className="font-mono text-[11px] text-stone-500">
                          Gross {p.metal.grossWeightGrams}g / Net {p.metal.netWeightGrams ?? '—'}g
                        </div>
                      ) : (
                        <div className="text-[11px] italic text-stone-400">Weights optional</div>
                      )}
                    </td>
                    <td className="p-4 text-stone-600">
                      <div>
                        {p.actualWastagePercent != null ? (
                          <span className="font-mono text-[11px]">
                            {p.offerWastagePercent != null ? (
                              <>
                                <span className="line-through text-stone-400 mr-1">{p.actualWastagePercent}%</span>
                                <span className="font-bold text-burgundy-900">{p.offerWastagePercent}%</span>
                              </>
                            ) : (
                              <span>{p.actualWastagePercent}%</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">No wastage</span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        Stock: {p.stockQuantity ?? 1} pcs
                      </div>
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStockStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer ${
                            p.stockStatus === 'OUT_OF_STOCK'
                              ? 'bg-stone-900 text-stone-100 border border-stone-700 hover:bg-black'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                          }`}
                          title={`Click to mark ${p.stockStatus === 'OUT_OF_STOCK' ? 'In Stock' : 'Out of Stock'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.stockStatus === 'OUT_OF_STOCK' ? 'bg-red-400' : 'bg-emerald-500'}`} />
                          <span>{p.stockStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : 'In Stock'}</span>
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          p.visibility === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.visibility === 'PUBLISHED' ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        <span>{p.visibility === 'PUBLISHED' ? 'Published' : p.visibility || 'Draft'}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPreviewProduct(p)}
                        className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-md"
                        title="Preview storefront card"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-burgundy-800 hover:bg-burgundy-50 rounded-md"
                        title="Edit piece"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                        title="Archive piece"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile App-Style Product Cards */}
        <div className="block lg:hidden p-3.5 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-stone-500 text-xs">
              Loading catalogue...
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">
              No jewellery items matching current filters.
            </div>
          ) : (
            products.map((p, index) => {
              const metalLabel = p.metalType || p.metal?.metalType;
              const purityLabel = p.purity || p.metal?.purity;

              return (
                <div
                  key={p._id}
                  className="bg-[#FCFAF6] border border-stone-200/90 rounded-xl p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {p.images?.[0]?.url ? (
                      <div className="relative shrink-0">
                        <img
                          src={p.images[0].url}
                          alt={p.title}
                          className={`w-14 h-14 rounded-xl object-cover border border-gold-300 shadow-xs ${
                            p.stockStatus === 'OUT_OF_STOCK' ? 'filter grayscale opacity-70' : ''
                          }`}
                        />
                        {((p.images?.length || 0) + (p.videos?.length || 0)) > 1 && (
                          <span className="absolute -top-1.5 -right-1.5 px-1 rounded-full bg-burgundy-900 text-gold-200 text-[8px] font-bold">
                            +{((p.images?.length || 0) + (p.videos?.length || 0)) - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-stone-100 text-stone-400 border border-stone-200 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}

                    {/* Title & SKU & Order */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-serif font-bold text-sm text-burgundy-950 leading-snug">
                          {p.title}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0 bg-stone-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-stone-700">
                          <span>#{p.displayOrder ?? 0}</span>
                          <div className="flex flex-col -my-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(index, -1)}
                              className="text-stone-400 hover:text-burgundy-900 disabled:opacity-20"
                              title="Move up"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === products.length - 1}
                              onClick={() => handleMoveOrder(index, 1)}
                              className="text-stone-400 hover:text-burgundy-900 disabled:opacity-20"
                              title="Move down"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="font-mono text-[10px] text-stone-500 mt-0.5">
                        {p.sku}
                      </div>

                      {/* Category & Subcategory */}
                      <div className="text-[11px] text-stone-700 mt-1 flex flex-wrap items-center gap-1">
                        <span className="font-semibold">{p.category?.name || 'Uncategorized'}</span>
                        {p.subcategory?.name && (
                          <span className="text-stone-500 font-mono">
                            ↳ {p.subcategory.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metal, Classification & Stock Metadata */}
                  <div className="pt-2 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-50 border border-amber-200 text-amber-900">
                        {metalLabel} {purityLabel ? `• ${purityLabel}` : ''}
                      </span>
                      {p.classification && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 font-bold text-[9px] uppercase">
                          {p.classification.replace(/_/g, ' ')}
                        </span>
                      )}
                      {p.isNewArrival && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[9px] uppercase">
                          New
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-stone-500">
                      {p.metal?.grossWeightGrams ? `Gross ${p.metal.grossWeightGrams}g` : 'Stock: ' + (p.stockQuantity ?? 1) + ' pcs'}
                    </div>
                  </div>

                  {/* Action & Visibility Footer */}
                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Stock toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStockStatus(p)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          p.stockStatus === 'OUT_OF_STOCK'
                            ? 'bg-stone-900 text-stone-100 border border-stone-700'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.stockStatus === 'OUT_OF_STOCK' ? 'bg-red-400' : 'bg-emerald-500'}`} />
                        <span>{p.stockStatus === 'OUT_OF_STOCK' ? 'Out' : 'In Stock'}</span>
                      </button>

                      {/* Visibility toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          p.visibility === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {p.visibility === 'PUBLISHED' ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                        <span>{p.visibility === 'PUBLISHED' ? 'Live' : 'Draft'}</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewProduct(p)}
                        className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-md border border-stone-200"
                        title="Preview storefront card"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-burgundy-800 hover:bg-burgundy-50 rounded-md border border-burgundy-200"
                        title="Edit piece"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                        title="Archive piece"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Modal with Live Preview */}
      {isModalOpen && (
        <AdminModalPortal>
          <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-2xl border border-gold-400 w-full max-w-5xl overflow-hidden shadow-2xl my-auto max-h-[94vh] flex flex-col animate-modal-enter">
            <div className="bg-brand-maroon-gradient p-4 sm:p-5 text-gold-100 flex items-center justify-between shrink-0">
              <h2 className="font-serif font-bold text-lg text-gold-100">
                {editingProduct ? `Edit Product — ${editingProduct.sku}` : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setIsModalOpen(false);
                }}
                className="text-gold-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              ref={modalFormRef}
              onSubmit={handleSave}
              className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs"
            >
              {/* Form Inputs (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {modalError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{modalError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalError(null)}
                      className="text-red-500 hover:text-red-800 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g. Traditional Lakshmi Temple Necklace"
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold uppercase text-stone-700">
                        Product Code (SKU)
                      </label>
                      {!editingProduct && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            isSkuManual
                              ? 'bg-stone-100 text-stone-600'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isSkuManual ? 'Custom' : 'Auto-Generated'}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={formState.sku}
                        onChange={(e) => {
                          const upper = e.target.value.toUpperCase();
                          const custom = upper.trim().length > 0;
                          setIsSkuManual(custom);
                          isSkuManualRef.current = custom;
                          setFormState({ ...formState, sku: upper });
                        }}
                        placeholder="Auto-generated (e.g. SRJ-NCK-001)"
                        className="flex-1 min-w-0 p-2.5 border rounded-lg font-mono uppercase outline-none focus:border-gold-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsSkuManual(false);
                          isSkuManualRef.current = false;
                          requestAutoProductSku(formState.categoryId);
                        }}
                        title="Auto-generate next sequential SKU"
                        className="px-2.5 py-2 border border-stone-200 rounded-lg text-burgundy-900 hover:bg-gold-50 shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Category *
                    </label>
                    {mainCategories.length === 0 ? (
                      <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50 text-[11px] text-amber-900 space-y-1">
                        <p className="font-medium">
                          No categories available. Please create a category from Category Management.
                        </p>
                        <Link
                          to="/admin/categories"
                          className="inline-flex items-center font-semibold text-burgundy-900 underline hover:text-burgundy-700"
                        >
                          Go to Category Management →
                        </Link>
                      </div>
                    ) : (
                      <select
                        required
                        value={formState.categoryId}
                        onChange={(e) => {
                          const nextCatId = e.target.value;
                          const chosenCat = mainCategories.find((c) => c._id === nextCatId);
                          let nextMetal = formState.metalType;
                          if (chosenCat?.metalType === 'SILVER') nextMetal = 'SILVER';
                          else if (chosenCat?.metalType === 'GOLD') nextMetal = 'GOLD';
                          else if (chosenCat?.metalType === 'PLATINUM') nextMetal = 'PLATINUM';
                          else if (chosenCat?.metalType === 'DIAMOND') nextMetal = 'DIAMOND';
                          else if (chosenCat?.metalType === 'ALL') {
                            if (!nextMetal) nextMetal = 'GOLD';
                          }

                          let nextPurity = formState.purity;
                          if (nextMetal === 'GOLD' && !['24K', '22K', '20K', '18K', '14K', '9K'].includes(nextPurity)) {
                            nextPurity = '22K';
                          } else if (nextMetal === 'SILVER' && !['999', '925', '900', '835', '800'].includes(nextPurity)) {
                            nextPurity = '925';
                          } else if (nextMetal === 'PLATINUM' && !['Pt950', 'Pt900', 'Pt850', 'Pt999'].includes(nextPurity)) {
                            nextPurity = 'Pt950';
                          }

                          setFormState((prev) => ({
                            ...prev,
                            categoryId: nextCatId,
                            subcategoryId: '', // Clear subcategory whenever category changes
                            metalType: nextMetal,
                            purity: nextPurity
                          }));

                          if (!editingProduct && !isSkuManualRef.current && nextCatId) {
                            requestAutoProductSku(nextCatId);
                          }
                        }}
                        className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500 font-medium"
                      >
                        <option value="">Select Category</option>
                        {mainCategories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} {c.metalType === 'ALL' ? '(Common • All Metals)' : `(${c.metalType || 'GOLD'})`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Subcategory (Optional)
                    </label>
                    <select
                      value={formState.subcategoryId}
                      onChange={(e) => setFormState((prev) => ({ ...prev, subcategoryId: e.target.value }))}
                      disabled={!formState.categoryId || availableSubcategories.length === 0}
                      className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500 font-medium disabled:bg-stone-100 disabled:text-stone-400"
                    >
                      <option value="">
                        {!formState.categoryId
                          ? 'Select a category first'
                          : availableSubcategories.length > 0
                          ? 'Select Subcategory (or leave empty for Direct Category)'
                          : 'No subcategories available for this category'}
                      </option>
                      {availableSubcategories.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                    {formState.categoryId && availableSubcategories.length === 0 && (
                      <p className="text-[11px] text-stone-500 mt-1">
                        No subcategories available for this category.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Classification
                    </label>
                    <select
                      value={formState.classification}
                      onChange={(e) => setFormState({ ...formState, classification: e.target.value as any })}
                      className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500 font-medium text-stone-800"
                    >
                      <option value="BRIDAL">Bridal</option>
                      <option value="TRADITIONAL">Traditional</option>
                      <option value="DAILY_WEAR">Daily Wear</option>
                      <option value="">None / General</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    {formState.metalType === 'GOLD' ? (
                      <>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          Gold Karat &amp; Fineness
                        </label>
                        <select
                          value={formState.purity}
                          onChange={(e) => setFormState({ ...formState, purity: e.target.value })}
                          className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500 font-medium"
                        >
                          <option value="24K">24K – 999 Purity (Pure Gold)</option>
                          <option value="22K">22K – 916 Purity (Hallmark Gold)</option>
                          <option value="20K">20K – 833 Purity</option>
                          <option value="18K">18K – 750 Purity (Fine Jewellery)</option>
                          <option value="14K">14K – 585 Purity</option>
                          <option value="9K">9K – 375 Purity</option>
                        </select>
                      </>
                    ) : formState.metalType === 'SILVER' ? (
                      <>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          Silver Fineness (Parts / 1000)
                        </label>
                        <select
                          value={formState.purity}
                          onChange={(e) => setFormState({ ...formState, purity: e.target.value })}
                          className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500 font-medium"
                        >
                          <option value="999">999 – Fine Silver (999/1000)</option>
                          <option value="925">925 – Sterling Silver (925/1000)</option>
                          <option value="900">900 – Coin Silver (900/1000)</option>
                          <option value="835">835 – Silver Alloy (835/1000)</option>
                          <option value="800">800 – Silver Alloy (800/1000)</option>
                        </select>
                      </>
                    ) : formState.metalType === 'PLATINUM' ? (
                      <>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          Platinum Hallmark Grade
                        </label>
                        <select
                          value={formState.purity}
                          onChange={(e) => setFormState({ ...formState, purity: e.target.value })}
                          className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500 font-medium"
                        >
                          <option value="Pt950">Pt950 – 95% Pure Platinum</option>
                          <option value="Pt900">Pt900 – 90% Pure Platinum</option>
                          <option value="Pt850">Pt850 – 85% Pure Platinum</option>
                          <option value="Pt999">Pt999 – 99.9% Pure Platinum</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          Diamond Base Metal / Setting
                        </label>
                        <input
                          type="text"
                          value={formState.purity}
                          onChange={(e) => setFormState({ ...formState, purity: e.target.value })}
                          placeholder="e.g. 18K White Gold / Platinum Base"
                          className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                        />
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Stock Availability
                    </label>
                    <select
                      value={formState.stockStatus}
                      onChange={(e) => setFormState({ ...formState, stockStatus: e.target.value as any })}
                      className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500 font-medium"
                    >
                      <option value="IN_STOCK">In Stock (Showroom Viewing)</option>
                      <option value="MADE_TO_ORDER">Made to Order (Handcrafted)</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formState.isNewArrival}
                          onChange={(e) => setFormState({ ...formState, isNewArrival: e.target.checked })}
                          className="w-4 h-4 rounded text-burgundy-900 focus:ring-gold-500"
                        />
                        <span className="font-semibold text-stone-800 text-xs">New Arrival</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formState.isFeatured}
                          onChange={(e) => setFormState({ ...formState, isFeatured: e.target.checked })}
                          className="w-4 h-4 rounded text-burgundy-900 focus:ring-gold-500"
                        />
                        <span className="font-semibold text-stone-800 text-xs">Featured</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formState.hallmarkStatus}
                          onChange={(e) => setFormState({ ...formState, hallmarkStatus: e.target.checked })}
                          className="w-4 h-4 rounded text-burgundy-900 focus:ring-gold-500"
                        />
                        <span className="font-semibold text-stone-800 text-xs">BIS Hallmark</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Diamond 4Cs and Specifications Block (Only visible when Diamond is selected) */}
                {formState.metalType === 'DIAMOND' && (
                  <div className="p-4 sm:p-5 rounded-xl border border-gold-400/40 bg-gold-50/20 space-y-4">
                    <div className="flex items-center justify-between border-b border-gold-300/40 pb-2">
                      <span className="font-serif font-bold text-sm text-burgundy-950 flex items-center gap-1.5">
                        <span>💎</span>
                        <span>Diamond 4Cs Grading &amp; Product Specifications</span>
                      </span>
                      <span className="text-[11px] text-stone-500">Optional / Configurable by piece</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          1. Carat Weight (ct)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formState.diamondCaratWeight}
                          onChange={(e) => setFormState({ ...formState, diamondCaratWeight: e.target.value })}
                          placeholder="e.g. 0.75"
                          className="w-full p-2 border rounded-lg outline-none focus:border-gold-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          2. Cut Grade
                        </label>
                        <select
                          value={formState.diamondCut}
                          onChange={(e) => setFormState({ ...formState, diamondCut: e.target.value })}
                          className="w-full p-2 border rounded-lg outline-none focus:border-gold-500 bg-white font-medium"
                        >
                          <option value="">Select Cut</option>
                          <option value="EXCELLENT">Excellent</option>
                          <option value="VERY_GOOD">Very Good</option>
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="POOR">Poor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          3. Colour (D - Z)
                        </label>
                        <select
                          value={formState.diamondColor}
                          onChange={(e) => setFormState({ ...formState, diamondColor: e.target.value })}
                          className="w-full p-2 border rounded-lg outline-none focus:border-gold-500 bg-white font-medium"
                        >
                          <option value="">Select Colour</option>
                          <option value="D">D (Colourless)</option>
                          <option value="E">E (Colourless)</option>
                          <option value="F">F (Colourless)</option>
                          <option value="G">G (Near Colourless)</option>
                          <option value="H">H (Near Colourless)</option>
                          <option value="I">I (Near Colourless)</option>
                          <option value="J">J (Near Colourless)</option>
                          <option value="K-M">K - M (Faint)</option>
                          <option value="N-Z">N - Z (Very Light)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          4. Clarity (FL - I3)
                        </label>
                        <select
                          value={formState.diamondClarity}
                          onChange={(e) => setFormState({ ...formState, diamondClarity: e.target.value })}
                          className="w-full p-2 border rounded-lg outline-none focus:border-gold-500 bg-white font-medium"
                        >
                          <option value="">Select Clarity</option>
                          <option value="FL">FL (Flawless)</option>
                          <option value="IF">IF (Internally Flawless)</option>
                          <option value="VVS1">VVS1 (Very Very Slightly Included)</option>
                          <option value="VVS2">VVS2</option>
                          <option value="VS1">VS1 (Very Slightly Included)</option>
                          <option value="VS2">VS2</option>
                          <option value="SI1">SI1 (Slightly Included)</option>
                          <option value="SI2">SI2</option>
                          <option value="I1">I1 (Included)</option>
                          <option value="I2">I2</option>
                          <option value="I3">I3</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          Diamond Shape
                        </label>
                        <select
                          value={formState.diamondShape}
                          onChange={(e) => setFormState({ ...formState, diamondShape: e.target.value })}
                          className="w-full p-2 border rounded-lg outline-none focus:border-gold-500 bg-white font-medium"
                        >
                          <option value="">Select Shape</option>
                          <option value="ROUND">Round Brilliant</option>
                          <option value="PRINCESS">Princess</option>
                          <option value="OVAL">Oval</option>
                          <option value="PEAR">Pear</option>
                          <option value="EMERALD">Emerald</option>
                          <option value="CUSHION">Cushion</option>
                          <option value="MARQUISE">Marquise</option>
                          <option value="HEART">Heart</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          Certification
                        </label>
                        <select
                          value={formState.diamondCertification}
                          onChange={(e) => setFormState({ ...formState, diamondCertification: e.target.value })}
                          className="w-full p-2 border rounded-lg outline-none focus:border-gold-500 bg-white font-medium"
                        >
                          <option value="">Select Certification</option>
                          <option value="GIA">GIA Certified</option>
                          <option value="IGI">IGI Certified</option>
                          <option value="HRD">HRD Certified</option>
                          <option value="OTHER">Other Lab</option>
                          <option value="NOT_CERTIFIED">In-House Quality Check</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          Diamond Pieces Count
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formState.diamondStoneCount}
                          onChange={(e) => setFormState({ ...formState, diamondStoneCount: e.target.value })}
                          placeholder="e.g. 1 (Solitaire) or 18"
                          className="w-full p-2 border rounded-lg outline-none focus:border-gold-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold uppercase text-stone-700 mb-1">
                          Setting Type
                        </label>
                        <select
                          value={formState.diamondSettingType}
                          onChange={(e) => setFormState({ ...formState, diamondSettingType: e.target.value })}
                          className="w-full p-2 border rounded-lg outline-none focus:border-gold-500 bg-white font-medium"
                        >
                          <option value="">Select Setting</option>
                          <option value="PRONG">Prong Setting</option>
                          <option value="BEZEL">Bezel Setting</option>
                          <option value="PAVE">Pavé Setting</option>
                          <option value="CHANNEL">Channel Setting</option>
                          <option value="TENSION">Tension Setting</option>
                          <option value="BAR">Bar Setting</option>
                          <option value="FLUSH">Flush / Gypsy Setting</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {(() => {
                  const weightInlineError = computeWeightValidationError(
                    formState.grossWeightGrams,
                    formState.netMetalWeightGrams
                  );
                  const weightBorderClass = weightInlineError
                    ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                    : 'focus:border-gold-500';
                  return (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold uppercase text-stone-700 mb-1">
                            Gross Weight (g, Optional)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formState.grossWeightGrams}
                            onChange={(e) => {
                              setModalError(null);
                              setFormState({ ...formState, grossWeightGrams: e.target.value });
                            }}
                            placeholder="Optional"
                            className={`w-full p-2.5 border rounded-lg outline-none ${weightBorderClass}`}
                          />
                        </div>
                        <div>
                          <label className="block font-semibold uppercase text-stone-700 mb-1">
                            Net Metal Weight (g, Optional)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formState.netMetalWeightGrams}
                            onChange={(e) => {
                              setModalError(null);
                              setFormState({ ...formState, netMetalWeightGrams: e.target.value });
                            }}
                            placeholder="Optional"
                            className={`w-full p-2.5 border rounded-lg outline-none ${weightBorderClass}`}
                          />
                        </div>
                      </div>
                      {weightInlineError && (
                        <p className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{weightInlineError}</span>
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Wastage & Inventory Section */}
                <div className="bg-[#FAF7F0] border border-gold-300/70 rounded-xl p-4 space-y-3.5">
                  <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-burgundy-950 flex items-center gap-1.5">
                    <span>Wastage &amp; Stock Inventory</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        Actual Wastage (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formState.actualWastagePercent}
                        onChange={(e) => setFormState({ ...formState, actualWastagePercent: e.target.value })}
                        placeholder="e.g. 8.5"
                        className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        Offer Wastage (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formState.offerWastagePercent}
                        onChange={(e) => setFormState({ ...formState, offerWastagePercent: e.target.value })}
                        placeholder="e.g. 5.0"
                        className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        Stock Quantity (Pieces) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        required
                        value={formState.stockQuantity}
                        onChange={(e) => setFormState({ ...formState, stockQuantity: e.target.value })}
                        placeholder="e.g. 1"
                        className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Jewellery Specifications */}
                <div className="bg-[#FAF7F0] border border-gold-300/70 rounded-xl p-4 space-y-3.5">
                  <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-burgundy-950 flex items-center gap-1.5">
                    <span>Jewellery Specifications (Public Website)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        Jewellery Type / Subtype
                      </label>
                      <input
                        type="text"
                        value={formState.jewelleryType}
                        onChange={(e) => setFormState({ ...formState, jewelleryType: e.target.value })}
                        placeholder="e.g. Traditional Ring, Choker"
                        className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        Stone Weight (g, Optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formState.stoneWeightGrams}
                        onChange={(e) => setFormState({ ...formState, stoneWeightGrams: e.target.value })}
                        placeholder="e.g. 0.45"
                        className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        HUID Hallmark No.
                      </label>
                      <input
                        type="text"
                        value={formState.huid}
                        onChange={(e) => setFormState({ ...formState, huid: e.target.value.toUpperCase() })}
                        placeholder="e.g. AB1234"
                        className="w-full p-2 border rounded-lg bg-white font-mono uppercase outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        Stone Details &amp; Inlays
                      </label>
                      <input
                        type="text"
                        value={formState.stoneDetails}
                        onChange={(e) => setFormState({ ...formState, stoneDetails: e.target.value })}
                        placeholder="e.g. Natural Kemp Rubies &amp; Emerald Inlays"
                        className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        Gemstone / Diamond Details
                      </label>
                      <input
                        type="text"
                        value={formState.gemstone}
                        onChange={(e) => setFormState({ ...formState, gemstone: e.target.value })}
                        placeholder="e.g. Cabochon Rubies, Cultured Pearls"
                        className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        Design &amp; Style
                      </label>
                      <input
                        type="text"
                        value={formState.design}
                        onChange={(e) => setFormState({ ...formState, design: e.target.value })}
                        placeholder="e.g. Heritage Floral Temple Nakshi"
                        className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-stone-700 mb-1">
                        Gender / Ideal For
                      </label>
                      <select
                        value={formState.gender}
                        onChange={(e) => setFormState({ ...formState, gender: e.target.value as any })}
                        className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                      >
                        <option value="WOMEN">Women</option>
                        <option value="MEN">Men</option>
                        <option value="UNISEX">Unisex</option>
                        <option value="KIDS">Kids</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Occasions (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={formState.occasion}
                      onChange={(e) => setFormState({ ...formState, occasion: e.target.value })}
                      placeholder="e.g. Bridal, Festive, Heirloom Gifting"
                      className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* Multi-Media Gallery & Upload with Copy & Paste */}
                <div
                  onDragOver={handleMediaDragOver}
                  onDragLeave={handleMediaDragLeave}
                  onDrop={handleMediaDrop}
                  className={`space-y-3 bg-[#FAF7F0] border rounded-xl p-4 transition-all duration-200 ${
                    isDraggingMedia
                      ? 'border-gold-500 bg-gold-50/70 ring-2 ring-gold-400/40'
                      : 'border-gold-300/80'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-serif font-bold text-xs uppercase tracking-wider text-burgundy-950">
                      Product Media (Multiple Images &amp; Videos)
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-stone-500">
                        {formState.mediaItems.length} item(s) attached
                      </span>
                      {formState.mediaItems.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setFormState((prev) => ({ ...prev, mediaItems: [] }));
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 transition-colors"
                            title="Cancel and remove all media"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel / Clear All</span>
                          </button>
                          <span className="text-stone-300 text-[10px]">|</span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={handlePasteProductMediaFromClipboard}
                        className="text-[11px] text-gold-700 hover:text-burgundy-900 font-bold flex items-center gap-1 transition-colors"
                        title="Paste copied image from clipboard (Ctrl+V)"
                      >
                        <ClipboardPaste className="w-3.5 h-3.5 text-gold-600" />
                        <span>Paste Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Drop & Paste Banner */}
                  <div className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-3 text-center text-xs text-stone-600">
                    <span className="font-semibold text-burgundy-950">Drag & drop photos/videos here</span>,{' '}
                    <span className="text-gold-700 underline font-semibold cursor-pointer" onClick={() => fileInputRef.current?.click()}>Browse</span>, or press{' '}
                    <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px] font-mono">
                      Ctrl+V
                    </kbd>{' '}
                    to paste copied photos directly.
                  </div>

                  {/* Upload & Paste Controls */}
                  <div className="space-y-2.5">
                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/avif,video/mp4,video/webm"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        disabled={uploadingMedia}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-burgundy-900 text-gold-200 rounded-lg text-xs font-bold hover:bg-burgundy-800 disabled:opacity-50 shrink-0 shadow-sm transition-colors"
                      >
                        {uploadingMedia ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gold-400" />
                            <span>Upload Files</span>
                          </>
                        )}
                      </button>

                      {uploadingMedia && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadingMedia(false);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 shrink-0 transition-colors"
                          title="Cancel upload in progress"
                        >
                          <X className="w-4 h-4 text-red-600" />
                          <span>Cancel Upload</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={uploadingMedia}
                        onClick={handlePasteProductMediaFromClipboard}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-gold-400 text-burgundy-950 rounded-lg text-xs font-bold hover:bg-gold-50 disabled:opacity-50 shrink-0 shadow-sm transition-colors"
                        title="Paste image directly from clipboard (Ctrl+V)"
                      >
                        <ClipboardPaste className="w-4 h-4 text-gold-600" />
                        <span>Paste Copied Image</span>
                      </button>
                    </div>

                    {/* Media URL Input Group: Full-width container with guaranteed uncropped Add URL button */}
                    <div className="flex items-center gap-2 w-full">
                      <select
                        value={mediaTypeInput}
                        onChange={(e) => setMediaTypeInput(e.target.value as any)}
                        className="px-2.5 py-2 border border-stone-300 rounded-lg bg-white text-xs outline-none focus:border-gold-500 shrink-0 font-medium"
                      >
                        <option value="IMAGE">Image URL</option>
                        <option value="VIDEO">Video URL</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Or paste media URL..."
                        value={mediaUrlInput}
                        onChange={(e) => setMediaUrlInput(e.target.value)}
                        className="flex-1 min-w-0 p-2 border border-stone-300 rounded-lg text-xs bg-white outline-none focus:border-gold-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddMediaUrl}
                        className="px-4 py-2 bg-gold-600 text-white rounded-lg text-xs font-bold hover:bg-gold-700 shrink-0 shadow-sm whitespace-nowrap active:scale-95 transition-all"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Media Preview Grid */}
                  {formState.mediaItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {formState.mediaItems.map((item, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-xl border overflow-hidden bg-white shadow-sm group ${
                            item.isPrimary ? 'border-gold-500 ring-2 ring-gold-400/50' : 'border-stone-200'
                          }`}
                        >
                          <div className="aspect-square bg-stone-100 flex items-center justify-center relative">
                            {item.mediaType === 'VIDEO' ? (
                              <div className="w-full h-full relative">
                                <video
                                  src={item.url}
                                  className="w-full h-full object-contain bg-black"
                                  controls={false}
                                  muted
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <Film className="w-8 h-8 text-white drop-shadow" />
                                </div>
                              </div>
                            ) : (
                              <img
                                src={item.url}
                                alt={`Media ${idx + 1}`}
                                className="w-full h-full object-cover object-center bg-stone-100"
                              />
                            )}

                            {/* Badges */}
                            <div className="absolute top-1.5 left-1.5 flex gap-1">
                              {item.isPrimary && (
                                <span className="px-1.5 py-0.5 rounded bg-gold-500 text-burgundy-950 text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  Primary
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold uppercase">
                                {item.mediaType}
                              </span>
                            </div>

                            {/* Actions overlay */}
                            <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/50 p-1 rounded-lg backdrop-blur-sm">
                              <button
                                type="button"
                                onClick={(e) => handleCopyProductMediaUrl(item.url, idx, e)}
                                className="p-1 rounded bg-white/90 text-stone-700 hover:bg-white text-[10px] font-bold shadow"
                                title="Copy Media URL to Clipboard"
                              >
                                {copiedMediaIndex === idx ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-stone-600" />
                                )}
                              </button>
                              {item.mediaType === 'IMAGE' && !item.isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryMedia(idx)}
                                  className="px-1.5 py-1 rounded bg-white/90 text-gold-700 hover:bg-gold-50 text-[10px] font-bold shadow"
                                  title="Set as Primary Image"
                                >
                                  Primary
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveMedia(idx)}
                                className="px-1.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold shadow flex items-center gap-1 border border-red-200 transition-colors"
                                title="Cancel / Remove media"
                              >
                                <X className="w-3.5 h-3.5 text-red-600" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-stone-300 rounded-xl text-center text-stone-500 text-xs">
                      No images or videos uploaded yet. Upload files, paste URLs, or press Ctrl+V to paste copied photos.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    placeholder="Enter detailed description of the jewellery piece..."
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase text-stone-600">Visibility:</span>
                    <select
                      value={formState.visibility}
                      onChange={(e) => setFormState({ ...formState, visibility: e.target.value as any })}
                      className="p-2 border rounded-lg bg-white font-semibold"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>

                {modalError && (
                  <p className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{modalError}</span>
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      setModalError(null);
                      setIsModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || eligibleCategories.length === 0 || !formState.categoryId}
                    className="px-6 py-2 rounded-lg bg-burgundy-900 text-gold-200 font-bold hover:bg-burgundy-800 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </div>

              {/* Live Public Card Preview (4 cols) */}
              <div className="lg:col-span-4 bg-[#FCF7EC] rounded-2xl border border-[#DFC389] p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 block">
                    Live Storefront Preview
                  </span>
                  <ProductCard product={livePreviewProduct} previewOnly />
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Actual and offer wastage percentages and specifications will update dynamically on the storefront.
                </p>
              </div>
            </form>
          </div>
        </div>
      </AdminModalPortal>
      )}

      {/* Standalone Row Preview Modal */}
      {previewProduct && (
        <AdminModalPortal>
          <div
            className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewProduct(null);
            }}
          >
            <div className="bg-[#FCF7EC] rounded-2xl border border-gold-400 max-w-sm w-full p-5 space-y-4 shadow-2xl animate-modal-enter">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-burgundy-950 text-sm">
                  Public Product Card Preview
                </span>
                <button type="button" onClick={() => setPreviewProduct(null)} className="text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ProductCard product={previewProduct} previewOnly />
            </div>
          </div>
        </AdminModalPortal>
      )}
    </div>
  );
};