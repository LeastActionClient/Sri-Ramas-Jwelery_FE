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
  Sparkles,
  Camera,
  RefreshCw
} from 'lucide-react';
import { productsApi, ProductAdminPayload } from '@/services/api/products.api';
import { categoriesApi } from '@/services/api/categories.api';
import {
  mediaApi,
  METAL_STUDIO_SPECS,
  STUDIO_METAL_TYPES,
  StudioMetalType
} from '@/services/api/media.api';
import { ImageDropzone } from '@/components/admin/ImageDropzone';
import { ProductStudioMediaModal } from '@/components/admin/ProductStudioMediaModal';
import { ProductCard } from '@/components/customer/ProductCard';
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

interface ProductFormState {
  name: string;
  sku: string;
  categoryId: string;
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM' | 'DIAMOND';
  purity: string;
  grossWeightGrams: string;
  netMetalWeightGrams: string;
  hallmarkStatus: boolean;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  extraImages: string[];
  extraPublicIds: string[];
  makingChargeType: 'PER_GRAM' | 'PERCENTAGE' | 'FIXED_AMOUNT';
  makingChargeValue: string;
  wastageValue: string;
  displayOrder: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  visibility: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

const createEmptyProductForm = (defaultCategoryId = ''): ProductFormState => ({
  name: '',
  sku: '',
  categoryId: defaultCategoryId,
  metalType: 'GOLD',
  purity: '',
  grossWeightGrams: '',
  netMetalWeightGrams: '',
  hallmarkStatus: false,
  description: '',
  imageUrl: '',
  imagePublicId: '',
  extraImages: [],
  extraPublicIds: [],
  makingChargeType: 'PER_GRAM',
  makingChargeValue: '0',
  wastageValue: '0',
  displayOrder: 0,
  isFeatured: true,
  isNewArrival: false,
  visibility: 'PUBLISHED'
});

export const ProductManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [metalFilter, setMetalFilter] = useState<'ALL' | StudioMetalType>('ALL');
  const [photoFilter, setPhotoFilter] = useState<'ALL' | 'WITH_PHOTO' | 'MISSING_PHOTO'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [studioTarget, setStudioTarget] = useState<Product | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(createEmptyProductForm());
  const [saving, setSaving] = useState(false);
  const [syncingPhotos, setSyncingPhotos] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSkuManual, setIsSkuManual] = useState(false);
  const isSkuManualRef = useRef(false);
  const skuReqSeqRef = useRef(0);
  const modalFormRef = useRef<HTMLFormElement | null>(null);

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

  const sortedProducts = useMemo(
    () =>
      [...(data?.products || [])].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      ),
    [data?.products]
  );

  const photoStats = useMemo(() => {
    const total = sortedProducts.length;
    const withPhoto = sortedProducts.filter((p) => Boolean(p.images?.[0]?.url)).length;
    return { total, withPhoto, missing: Math.max(0, total - withPhoto) };
  }, [sortedProducts]);

  const products = useMemo(() => {
    return sortedProducts.filter((p) => {
      if (metalFilter !== 'ALL' && p.metal?.metalType !== metalFilter) {
        return false;
      }
      if (photoFilter === 'MISSING_PHOTO' && p.images?.[0]?.url) {
        return false;
      }
      if (photoFilter === 'WITH_PHOTO' && !p.images?.[0]?.url) {
        return false;
      }
      return true;
    });
  }, [sortedProducts, metalFilter, photoFilter]);

  const invalidateProductQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['homepage'] });
  };

  const handleSyncKeptPhotos = async () => {
    setSyncingPhotos(true);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const summary = await mediaApi.syncKeptPhotos();
      queryClient.invalidateQueries({ queryKey: ['admin-media-library'] });
      invalidateProductQueries();
      if (summary.matchedCount > 0) {
        setFeedbackMsg(
          `Attached ${summary.matchedCount} kept studio image(s) from the Media Library (${summary.remainingMissingCount} still awaiting photography).`
        );
      } else {
        setFeedbackMsg(
          `Checked ${summary.availableLibraryCount} kept studio asset(s): no exact match for remaining ${summary.remainingMissingCount} awaiting-photo piece(s). Use Generate or Upload Studio Image on any row.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to sync kept studio images.');
    } finally {
      setSyncingPhotos(false);
    }
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
      ...(categoryId !== undefined ? { categoryId } : {}),
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
    const activeCat = eligibleCategories[0];
    const initialPreviewSku = activeCat
      ? generateLocalProductSkuPreview(
          activeCat,
          sortedProducts.map((p) => p.sku)
        )
      : '';
    setFormState({
      ...createEmptyProductForm(activeCat?._id || ''),
      sku: initialPreviewSku,
      displayOrder: products.length + 1
    });
    setIsModalOpen(true);
    if (activeCat?._id) {
      requestAutoProductSku(activeCat._id);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setErrorMsg(null);
    setModalError(null);
    setIsSkuManual(true);
    isSkuManualRef.current = true;
    const primaryImg = product.images?.find((i) => i.isPrimary) || product.images?.[0];
    const primaryUrl = primaryImg?.url || '';
    const extraImages = (product.images || [])
      .map((i) => i.url)
      .filter((u): u is string => Boolean(u) && u !== primaryUrl);
    const primaryPublicId = primaryImg?.publicId || product.imagePublicIds?.[0] || '';
    const extraPublicIds = (product.imagePublicIds || []).filter(
      (pid) => Boolean(pid) && pid !== primaryPublicId
    );
    setFormState({
      name: product.name || product.title || '',
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      metalType: (product.metalType || product.metal?.metalType || 'GOLD') as any,
      purity: product.purity || product.metal?.purity || '',
      grossWeightGrams:
        product.grossWeightGrams && product.grossWeightGrams > 0
          ? String(product.grossWeightGrams)
          : '',
      netMetalWeightGrams:
        product.netMetalWeightGrams && product.netMetalWeightGrams > 0
          ? String(product.netMetalWeightGrams)
          : '',
      hallmarkStatus: Boolean(product.hallmarkStatus),
      description: product.description || '',
      imageUrl: primaryUrl,
      imagePublicId: primaryPublicId,
      extraImages,
      extraPublicIds,
      makingChargeType:
        product.makingCharges?.chargeType === 'FLAT'
          ? 'FIXED_AMOUNT'
          : (product.makingCharges?.chargeType as any) || 'PER_GRAM',
      makingChargeValue: String(product.makingCharges?.value ?? 0),
      wastageValue: String(product.wastagePercentage ?? 0),
      displayOrder: product.displayOrder ?? 0,
      isFeatured: Boolean(product.isFeatured),
      isNewArrival: Boolean(product.isNewArrival),
      visibility: (product.visibility as any) || 'PUBLISHED'
    });
    setIsModalOpen(true);
  };

  const livePreviewProduct: Product = useMemo(() => {
    const selectedCategory = categories.find((c) => c._id === formState.categoryId);
    const gross = formState.grossWeightGrams ? Number(formState.grossWeightGrams) : null;
    const net = formState.netMetalWeightGrams ? Number(formState.netMetalWeightGrams) : null;

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
      hallmarkStatus: formState.hallmarkStatus,
      makingCharges: {
        chargeType:
          formState.makingChargeType === 'FIXED_AMOUNT' ? 'FLAT' : formState.makingChargeType,
        value: Number(formState.makingChargeValue || 0)
      },
      pricingType: 'CALCULATED',
      images: formState.imageUrl.trim()
        ? [
            {
              url: formState.imageUrl.trim(),
              isPrimary: true,
              publicId: formState.imagePublicId || undefined
            }
          ]
        : [],
      isFeatured: formState.isFeatured,
      isNewArrival: formState.isNewArrival,
      displayOrder: formState.displayOrder,
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

      const weightValidationError = computeWeightValidationError(
        formState.grossWeightGrams,
        formState.netMetalWeightGrams
      );
      if (weightValidationError) {
        throw new Error(weightValidationError);
      }

      const gross = formState.grossWeightGrams.trim() ? Number(formState.grossWeightGrams) : null;
      const net = formState.netMetalWeightGrams.trim() ? Number(formState.netMetalWeightGrams) : null;

      const cleanedSku = formState.sku.trim().toUpperCase();
      if (isSkuManual && cleanedSku.length > 0 && cleanedSku.length < 3) {
        throw new Error('Product SKU must be at least 3 characters, or clear it to auto-generate.');
      }
      const shouldSendSku = Boolean(cleanedSku && (editingProduct || isSkuManual));

      const normalizedDisplayOrder = Number.isFinite(Number(formState.displayOrder))
        ? Math.max(0, Math.trunc(Number(formState.displayOrder)))
        : 0;

      const payload: ProductAdminPayload = {
        name: formState.name.trim(),
        ...(shouldSendSku ? { sku: cleanedSku } : {}),
        categoryId: formState.categoryId,
        metalType: formState.metalType,
        purity: formState.purity.trim(),
        description: formState.description.trim(),
        grossWeightGrams: gross,
        netMetalWeightGrams: net,
        hallmarkStatus: formState.hallmarkStatus,
        isFeatured: formState.isFeatured,
        isNewArrival: formState.isNewArrival,
        displayOrder: normalizedDisplayOrder,
        visibility: formState.visibility,
        images: formState.imageUrl.trim()
          ? [
              formState.imageUrl.trim(),
              ...formState.extraImages.filter((u) => u && u !== formState.imageUrl.trim())
            ]
          : [],
        imagePublicIds:
          formState.imageUrl.trim() && formState.imagePublicId.trim()
            ? [
                formState.imagePublicId.trim(),
                ...formState.extraPublicIds.filter((pid) => pid && pid !== formState.imagePublicId.trim())
              ]
            : formState.extraPublicIds,
        pricingModel: {
          wastageType: 'PERCENTAGE',
          wastageValue: Number(formState.wastageValue || 0),
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
      setFeedbackMsg(
        `"${product.title}" visibility switched.`
      );
      invalidateProductQueries();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to update visibility.');
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
            Jewellery Inventory & Catalogue
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Create, curate, generate or upload studio jewellery photos, keep product galleries, reorder, and preview before publishing.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Add New Jewellery Piece</span>
        </button>
      </div>

      {/* Studio Photography Coverage Strip */}
      <div className="bg-[#FCF7EC] border border-gold-300/80 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-burgundy-900 text-gold-300 flex items-center justify-center shrink-0">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-burgundy-950">
              Studio Photography Coverage: {photoStats.withPhoto} of {photoStats.total} Pieces Attached
            </p>
            <p className="text-[11px] text-stone-600">
              {photoStats.missing > 0
                ? `${photoStats.missing} product${photoStats.missing === 1 ? '' : 's'} still awaiting studio photography — generate, upload, or paste directly from each row.`
                : 'All visible catalogue items have studio photography saved.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {photoStats.missing > 0 && (
            <>
              <button
                type="button"
                disabled={syncingPhotos}
                onClick={handleSyncKeptPhotos}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-burgundy-900 bg-burgundy-900 text-gold-200 hover:bg-burgundy-800 disabled:opacity-60 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingPhotos ? 'animate-spin' : ''}`} />
                <span>{syncingPhotos ? 'Syncing...' : 'Sync Kept Photos'}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setPhotoFilter((prev) => (prev === 'MISSING_PHOTO' ? 'ALL' : 'MISSING_PHOTO'))
                }
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  photoFilter === 'MISSING_PHOTO'
                    ? 'bg-burgundy-900 text-gold-200 border-burgundy-900'
                    : 'bg-white text-burgundy-900 border-gold-400 hover:bg-gold-50'
                }`}
              >
                {photoFilter === 'MISSING_PHOTO'
                  ? 'Showing Needs Photo'
                  : `Filter Needs Photo (${photoStats.missing})`}
              </button>
            </>
          )}
        </div>
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

        <select
          value={photoFilter}
          onChange={(e) => setPhotoFilter(e.target.value as any)}
          aria-label="Filter by photo status"
          className="px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:border-gold-500 bg-white"
        >
          <option value="ALL">All Photo States</option>
          <option value="WITH_PHOTO">With Studio Photo</option>
          <option value="MISSING_PHOTO">Awaiting Studio Photo</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Piece & SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Purity & Weights</th>
                <th className="p-4">Highlights</th>
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
                              className="w-11 h-11 rounded-lg object-cover border border-gold-200"
                            />
                            {p.images.length > 1 && (
                              <span className="absolute -top-1.5 -right-1.5 px-1 rounded-full bg-burgundy-900 text-gold-200 text-[9px] font-bold">
                                +{p.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setStudioTarget(p)}
                            title="Generate or upload studio photograph"
                            className="w-11 h-11 rounded-lg bg-burgundy-950/90 hover:bg-burgundy-900 text-gold-300 border border-dashed border-gold-400/60 flex items-center justify-center shrink-0 transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        )}
                        <div>
                          <div className="font-bold text-burgundy-950 font-serif">{p.title}</div>
                          <div className="flex items-center gap-2 font-mono text-[10px] text-stone-500">
                            <span>{p.sku}</span>
                            {!p.images?.[0]?.url && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-sans font-semibold">
                                Awaiting Photo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-stone-700 font-medium">
                      {p.category?.name || 'Uncategorized'}
                    </td>
                    <td className="p-4 text-stone-600">
                      <div>
                        {p.metal?.metalType}
                        {p.metal?.purity ? ` • ${p.metal.purity}` : ''}
                      </div>
                      {p.metal?.grossWeightGrams ? (
                        <div className="font-mono text-[11px] text-stone-500">
                          Gross {p.metal.grossWeightGrams}g / Net {p.metal.netWeightGrams ?? '—'}g
                        </div>
                      ) : (
                        <div className="text-[11px] italic text-stone-400">Weights optional</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {p.isFeatured && (
                          <span className="px-2 py-0.5 rounded bg-gold-100 text-burgundy-900 text-[10px] font-bold">
                            Featured
                          </span>
                        )}
                        {p.isNewArrival && (
                          <span className="px-2 py-0.5 rounded bg-burgundy-100 text-burgundy-900 text-[10px] font-bold">
                            New Arrival
                          </span>
                        )}
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
                        onClick={() => setStudioTarget(p)}
                        className={`p-1.5 rounded-md transition-colors ${
                          p.images?.[0]?.url
                            ? 'text-gold-700 hover:bg-gold-50'
                            : 'text-burgundy-900 bg-gold-100 hover:bg-gold-200'
                        }`}
                        title="Generate, upload & keep studio photo"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
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
      </div>

      {/* Add / Edit Modal with Live Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-gold-400 w-full max-w-5xl overflow-hidden shadow-2xl my-6 max-h-[92vh] flex flex-col animate-modal-enter">
            <div className="bg-brand-maroon-gradient p-5 text-gold-100 flex items-center justify-between shrink-0">
              <h2 className="font-serif font-bold text-lg text-gold-100">
                {editingProduct ? `Edit Product — ${editingProduct.sku}` : 'Add New Jewellery Product'}
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
              className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs"
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
                        className="w-full p-2.5 border rounded-lg font-mono uppercase outline-none focus:border-gold-500"
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
                    {eligibleCategories.length === 0 ? (
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
                          if (!editingProduct && !isSkuManualRef.current) {
                            requestAutoProductSku(nextCatId);
                          } else {
                            setFormState({ ...formState, categoryId: nextCatId });
                          }
                        }}
                        className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500"
                      >
                        <option value="">Select Category</option>
                        {eligibleCategories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {editingProduct &&
                      eligibleCategories.length > 0 &&
                      !eligibleCategories.some((c) => c._id === formState.categoryId) && (
                        <p className="text-[11px] text-amber-700 mt-1">
                          Previously assigned category is currently inactive. Please select an active category.
                        </p>
                      )}
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Metal Type *
                    </label>
                    <select
                      value={formState.metalType}
                      onChange={(e) => setFormState({ ...formState, metalType: e.target.value as any })}
                      className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500"
                    >
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                      <option value="DIAMOND">Diamond</option>
                      <option value="PLATINUM">Platinum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Purity (Optional)
                    </label>
                    <input
                      type="text"
                      value={formState.purity}
                      onChange={(e) => setFormState({ ...formState, purity: e.target.value })}
                      placeholder="e.g. 22K or leave blank"
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        <div>
                          <label className="block font-semibold uppercase text-stone-700 mb-1">
                            Display Order
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formState.displayOrder}
                            onChange={(e) =>
                              setFormState({ ...formState, displayOrder: Number(e.target.value) })
                            }
                            className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
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

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                      Studio Photography & Kept Assets
                    </span>
                    <button
                      type="button"
                      onClick={() => setStudioTarget(livePreviewProduct)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-burgundy-900 text-gold-200 text-[11px] font-bold hover:bg-burgundy-800 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold-300" />
                      <span>Generate AI Photo / Kept Library</span>
                    </button>
                  </div>

                  <ImageDropzone
                    label="Product Studio Photograph"
                    value={formState.imageUrl}
                    publicId={formState.imagePublicId}
                    onChange={(url) => setFormState((prev) => ({ ...prev, imageUrl: url }))}
                    onPublicIdChange={(pid) => setFormState((prev) => ({ ...prev, imagePublicId: pid }))}
                    uploadFolder="products"
                    helperText="Upload, drop, or paste (Ctrl+V) to persist on backend /uploads or Cloudinary."
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Craftsmanship Description
                  </label>
                  <textarea
                    rows={3}
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>

                <div className="flex flex-wrap gap-5 pt-1 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isFeatured}
                      onChange={(e) => setFormState({ ...formState, isFeatured: e.target.checked })}
                      className="rounded accent-burgundy-900"
                    />
                    <span className="font-semibold text-stone-800">Featured Piece</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isNewArrival}
                      onChange={(e) => setFormState({ ...formState, isNewArrival: e.target.checked })}
                      className="rounded accent-burgundy-900"
                    />
                    <span className="font-semibold text-stone-800">New Arrival</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.hallmarkStatus}
                      onChange={(e) => setFormState({ ...formState, hallmarkStatus: e.target.checked })}
                      className="rounded accent-burgundy-900"
                    />
                    <span className="font-semibold text-stone-800">Verified Hallmarked</span>
                  </label>
                  <div className="flex items-center gap-2 ml-auto">
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
                  Unavailable specs (purity, weights, hallmark) stay hidden automatically until entered.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Row Preview Modal */}
      {previewProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
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
      )}

      {/* Admin AI Studio & Persistent Media Manager Modal */}
      {studioTarget && (
        <ProductStudioMediaModal
          product={studioTarget}
          onClose={() => setStudioTarget(null)}
          onImageKept={({ secureUrl, publicId, updatedProduct }) => {
            if (
              isModalOpen &&
              (studioTarget._id === 'preview' || studioTarget._id === editingProduct?._id)
            ) {
              const allUrls: string[] = (updatedProduct?.images || []).filter(
                (u: any): u is string => typeof u === 'string' && u !== secureUrl
              );
              setFormState((prev) => ({
                ...prev,
                imageUrl: secureUrl,
                imagePublicId: publicId,
                extraImages: allUrls.length > 0 ? allUrls : prev.extraImages,
              }));
            }
            setFeedbackMsg(`Studio photograph saved and kept for "${studioTarget.title || studioTarget.sku}".`);
          }}
        />
      )}
    </div>
  );
};
