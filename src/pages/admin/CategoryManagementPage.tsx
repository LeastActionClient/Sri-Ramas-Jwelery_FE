import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  RefreshCw,
  FolderTree,
  GitFork,
  Layers,
  Search,
  ArrowRight,
} from 'lucide-react';
import { categoriesApi } from '@/services/api/categories.api';
import { Category } from '@/types';
import { ImageDropzone } from '@/components/admin/ImageDropzone';
import { CategoryCard } from '@/components/customer/CategoryCard';
import { AdminModalPortal } from '@/components/admin/AdminModalPortal';
import { generateLocalCategorySkuPreview } from '@/utils/sku';
import { extractApiErrorMessage } from '@/utils/apiError';

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required'),
  sku: z
    .string()
    .trim()
    .refine((v) => v === '' || v.length >= 3, 'Category SKU must be at least 3 characters')
    .optional()
    .or(z.literal('')),
  description: z.string().optional(),
  metalType: z.enum(['GOLD', 'SILVER', 'DIAMOND', 'PLATINUM', 'GEMSTONE', 'MIXED', 'ALL']),
  imageUrl: z.string().optional().or(z.literal('')),
  imagePublicId: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface StatusBanner {
  type: 'success' | 'error';
  message: string;
}

export const CategoryManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [metalFilter, setMetalFilter] = useState<'ALL' | 'GOLD' | 'SILVER'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [previewCategory, setPreviewCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null);
  const [banner, setBanner] = useState<StatusBanner | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSkuManual, setIsSkuManual] = useState(false);

  // View Mode: 'split' (shows both separate tables), 'categories' (only main), 'subcategories' (only sub)
  const [viewMode, setViewMode] = useState<'split' | 'categories' | 'subcategories'>('split');
  const [selectedParentFilter, setSelectedParentFilter] = useState<string>('');
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState<string>('');

  // Subcategory management modal state
  const [isSubcatModalOpen, setIsSubcatModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Category | null>(null);
  const [subcatName, setSubcatName] = useState('');
  const [subcatParentId, setSubcatParentId] = useState('');
  const [subcatError, setSubcatError] = useState<string | null>(null);
  const [isSubcatSubmitting, setIsSubcatSubmitting] = useState(false);

  const skuTimerRef = useRef<number | null>(null);
  const skuReqSeqRef = useRef(0);
  const modalFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    return () => {
      if (skuTimerRef.current) window.clearTimeout(skuTimerRef.current);
    };
  }, []);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: categoriesApi.adminGetCategories,
  });

  // Helper to extract parent category ID (robust for parentCategoryId, parentId, and parentCategory)
  const getCategoryParentId = (c: Category): string | null => {
    if (c.parentCategoryId) return String(c.parentCategoryId);
    if ((c as any).parentId) {
      const pid = (c as any).parentId;
      return typeof pid === 'string' ? pid : pid._id ? String(pid._id) : null;
    }
    if (c.parentCategory) {
      return typeof c.parentCategory === 'string'
        ? c.parentCategory
        : (c.parentCategory as any)?._id
          ? String((c.parentCategory as any)._id)
          : null;
    }
    return null;
  };

  /**
   * Main categories (root level, no parent category assigned)
   */
  const allMainCategories = useMemo(() => {
    return categories
      .filter((c) => !getCategoryParentId(c))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));
  }, [categories]);

  /**
   * Filtered main categories based on metal filter
   */
  const filteredMainCategories = useMemo(() => {
    return allMainCategories.filter((c) => {
      if (metalFilter === 'ALL') return true;
      if (c.metalType === 'ALL') return true;
      return (c.metalType || 'GOLD') === metalFilter;
    });
  }, [allMainCategories, metalFilter]);

  /**
   * Subcategories (categories with a parent category assigned)
   */
  const allSubcategories = useMemo(() => {
    return categories
      .filter((c) => Boolean(getCategoryParentId(c)))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));
  }, [categories]);

  /**
   * Subcategories grouped by parent category ID
   */
  const subcategoriesByParentMap = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const sub of allSubcategories) {
      const pid = getCategoryParentId(sub);
      if (!pid) continue;
      if (!map.has(pid)) {
        map.set(pid, []);
      }
      map.get(pid)!.push(sub);
    }
    return map;
  }, [allSubcategories]);

  /**
   * Filtered subcategories based on metal, parent category dropdown, and search query
   */
  const filteredSubcategories = useMemo(() => {
    return allSubcategories.filter((c) => {
      const pid = getCategoryParentId(c);
      const parent = allMainCategories.find((p) => p._id === pid);

      // Metal filter
      if (metalFilter !== 'ALL') {
        const effectiveMetal = c.metalType || parent?.metalType || 'GOLD';
        if (effectiveMetal !== 'ALL' && effectiveMetal !== metalFilter) {
          return false;
        }
      }

      // Parent category dropdown filter
      if (selectedParentFilter && pid !== selectedParentFilter) {
        return false;
      }

      // Subcategory quick search
      if (subcategorySearchQuery.trim()) {
        const q = subcategorySearchQuery.trim().toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchSku = c.sku?.toLowerCase().includes(q) ?? false;
        const matchParent = parent?.name.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchSku && !matchParent) return false;
      }

      return true;
    });
  }, [allSubcategories, allMainCategories, metalFilter, selectedParentFilter, subcategorySearchQuery]);

  /**
   * Active root categories that can serve as parents for subcategory creation/assignment.
   */
  const mainCategories = useMemo(
    () => allMainCategories.filter((c) => c.isActive),
    [allMainCategories]
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      metalType: 'GOLD',
      isActive: true,
      imageUrl: '',
      imagePublicId: '',
    },
  });

  useEffect(() => {
    register('imageUrl');
    register('imagePublicId');
  }, [register]);

  const invalidateCategoryCaches = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['homepage'] });
    queryClient.refetchQueries({ queryKey: ['admin', 'categories'] });
    queryClient.refetchQueries({ queryKey: ['categories'] });
  };

  const showStatus = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
    window.setTimeout(() => setBanner(null), 5000);
  };

  const requestAutoCategorySku = (categoryName: string, excludeId?: string) => {
    const trimmed = categoryName.trim();
    const localPreview = trimmed
      ? generateLocalCategorySkuPreview(
          trimmed,
          categories.filter((c) => c._id !== excludeId).map((c) => c.sku)
        )
      : '';
    setValue('sku', localPreview, { shouldDirty: false });

    if (skuTimerRef.current) window.clearTimeout(skuTimerRef.current);
    if (trimmed.length < 2) return;

    const reqSeq = ++skuReqSeqRef.current;
    skuTimerRef.current = window.setTimeout(async () => {
      try {
        const generated = await categoriesApi.adminGenerateSku(trimmed, excludeId);
        if (skuReqSeqRef.current === reqSeq && generated) {
          setValue('sku', generated, { shouldDirty: false });
        }
      } catch {
        // Keep local preview if backend preview request fails
      }
    }, 180);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setModalError(null);
    setIsSkuManual(false);
    reset({
      name: '',
      sku: '',
      description: '',
      metalType: 'GOLD',
      imageUrl: '',
      imagePublicId: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setModalError(null);
    const fallbackSku =
      cat.sku ||
      generateLocalCategorySkuPreview(
        cat.name,
        categories.filter((c) => c._id !== cat._id).map((c) => c.sku)
      );
    setIsSkuManual(Boolean(cat.sku));
    reset({
      name: cat.name,
      sku: fallbackSku,
      description: cat.description || '',
      metalType: (cat.metalType as any) || 'GOLD',
      imageUrl: cat.imageUrl || '',
      imagePublicId: cat.imagePublicId || '',
      isActive: cat.isActive,
    });
    setIsModalOpen(true);
  };

  const openCreateSubcategoryModal = (presetParentId?: string) => {
    setEditingSubcategory(null);
    setSubcatError(null);
    setSubcatName('');
    const targetParentId = presetParentId || selectedParentFilter || mainCategories[0]?._id || '';
    setSubcatParentId(targetParentId);
    setIsSubcatModalOpen(true);
  };

  const openEditSubcategoryModal = (cat: Category) => {
    setEditingSubcategory(cat);
    setSubcatError(null);
    setSubcatName(cat.name);
    const pId =
      cat.parentCategoryId ||
      (typeof cat.parentCategory === 'string'
        ? cat.parentCategory
        : (cat.parentCategory as any)?._id || '');
    setSubcatParentId(pId);
    setIsSubcatModalOpen(true);
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubcatError(null);
    const trimmedName = subcatName.trim();
    if (trimmedName.length < 2) {
      setSubcatError('Subcategory name must be at least 2 characters.');
      return;
    }
    if (!subcatParentId) {
      setSubcatError('Please select a main category.');
      return;
    }

    const parentCat = categories.find((c) => c._id === subcatParentId);
    if (!parentCat) {
      setSubcatError('Selected category was not found.');
      return;
    }

    // Client-side duplicate check under same parent category
    const isDuplicate = categories.some((c) => {
      if (editingSubcategory && c._id === editingSubcategory._id) return false;
      const pId =
        c.parentCategoryId ||
        (typeof c.parentCategory === 'string'
          ? c.parentCategory
          : (c.parentCategory as any)?._id);
      return (
        pId === subcatParentId &&
        c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
    });

    if (isDuplicate) {
      setSubcatError(
        `A subcategory named "${trimmedName}" already exists under category "${parentCat.name}".`
      );
      return;
    }

    setIsSubcatSubmitting(true);
    try {
      if (editingSubcategory) {
        const updated = await categoriesApi.adminUpdateCategory(editingSubcategory._id, {
          name: trimmedName,
          parentCategoryId: subcatParentId,
          metalType: parentCat.metalType || 'GOLD',
        });
        showStatus('success', `Subcategory "${updated.name}" updated successfully.`);
      } else {
        const created = await categoriesApi.adminCreateCategory({
          name: trimmedName,
          parentCategoryId: subcatParentId,
          metalType: parentCat.metalType || 'GOLD',
          isActive: true,
        });
        showStatus('success', `Subcategory "${created.name}" created under "${parentCat.name}".`);
      }

      invalidateCategoryCaches();
      setIsSubcatModalOpen(false);
      setEditingSubcategory(null);
    } catch (err: any) {
      const msg = extractApiErrorMessage(err, 'Failed to save subcategory.');
      setSubcatError(msg);
      showStatus('error', msg);
    } finally {
      setIsSubcatSubmitting(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    setModalError(null);
    try {
      const cleanedSku = (data.sku || '').trim().toUpperCase();
      const shouldSendSku = Boolean(cleanedSku && (editingCategory || isSkuManual));
      const payload: Partial<Category> = {
        name: data.name.trim(),
        ...(shouldSendSku ? { sku: cleanedSku } : {}),
        description: data.description,
        parentCategoryId: null, // Category Creation form creates ONLY root/main categories
        metalType: data.metalType,
        displayOrder: editingCategory ? Number(editingCategory.displayOrder ?? 0) : categories.length,
        imageUrl: data.imageUrl || null,
        imagePublicId: data.imagePublicId || null,
        isActive: data.isActive,
      };

      if (editingCategory) {
        const updated = await categoriesApi.adminUpdateCategory(editingCategory._id, payload);
        showStatus(
          'success',
          `Category "${updated.name}"${updated.sku ? ` (${updated.sku})` : ''} updated successfully.`
        );
      } else {
        const created = await categoriesApi.adminCreateCategory(payload);
        showStatus(
          'success',
          `Category "${created.name}"${created.sku ? ` (${created.sku})` : ''} created and synced.`
        );
      }

      invalidateCategoryCaches();
      setModalError(null);
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = extractApiErrorMessage(err, 'Error saving category.');
      setModalError(msg);
      showStatus('error', msg);
      window.requestAnimationFrame(() => {
        modalFormRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  const handleToggleActive = async (cat: Category) => {
    setBusyCategoryId(cat._id);
    try {
      await categoriesApi.adminUpdateCategory(cat._id, { isActive: !cat.isActive });
      invalidateCategoryCaches();
      showStatus(
        'success',
        `"${cat.name}" is now ${!cat.isActive ? 'Active (visible on homepage)' : 'Hidden from storefront'}.`
      );
    } catch (err: any) {
      showStatus('error', err?.response?.data?.error?.message || 'Failed to update status.');
    } finally {
      setBusyCategoryId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await categoriesApi.adminDeleteCategory(deleteTarget._id);
      invalidateCategoryCaches();
      showStatus('success', `Category "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || 'Unable to delete category.';
      setDeleteError(message);
      showStatus('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const watchedName = watch('name');
  const watchedSku = watch('sku');
  const watchedImageUrl = watch('imageUrl');
  const watchedPublicId = watch('imagePublicId');
  const watchedActive = watch('isActive');

  const livePreviewCategory: Category = {
    _id: editingCategory?._id || 'preview',
    name: watchedName || 'Category Name',
    slug: editingCategory?.slug || '',
    imageUrl: watchedImageUrl || undefined,
    imagePublicId: watchedPublicId || undefined,
    sortOrder: editingCategory?.sortOrder ?? 0,
    isActive: watchedActive ?? true,
    createdAt: '',
    updatedAt: '',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Category Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Single source of truth for homepage category cards, hierarchy, visibility, and Cloudinary imagery.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>Add New Category</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateSubcategoryModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gold-500/60 bg-burgundy-950 text-gold-300 text-xs font-bold uppercase tracking-wider shadow-md hover:bg-burgundy-900 hover:text-gold-100 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>Add New Subcategory</span>
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-medium ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="flex-1">{banner.message}</span>
          <button type="button" onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* View Mode & Metal Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        {/* View Mode Switcher: Categories vs Subcategories vs Split View */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              viewMode === 'split'
                ? 'bg-burgundy-900 text-gold-200 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Split View (Both)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('categories')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              viewMode === 'categories'
                ? 'bg-burgundy-900 text-gold-200 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Main Categories</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                viewMode === 'categories'
                  ? 'bg-gold-500/30 text-gold-200'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {filteredMainCategories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('subcategories')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              viewMode === 'subcategories'
                ? 'bg-burgundy-900 text-gold-200 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Subcategories</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                viewMode === 'subcategories'
                  ? 'bg-gold-500/30 text-gold-200'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {filteredSubcategories.length}
            </span>
          </button>
        </div>

        {/* Metal Group Filter: ALL / GOLD / SILVER (Horizontally scrollable with no visible scrollbar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth shrink-0 py-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mr-1 shrink-0">
            Metal:
          </span>
          <button
            type="button"
            onClick={() => setMetalFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              metalFilter === 'ALL'
                ? 'bg-stone-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100 border border-stone-200 bg-white'
            }`}
          >
            All Metals ({allMainCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setMetalFilter('GOLD')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              metalFilter === 'GOLD'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50 border border-amber-200 bg-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" />
            <span>Gold</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-900/30 text-[10px]">
              {allMainCategories.filter((c) => (c.metalType || 'GOLD') === 'GOLD' || c.metalType === 'ALL').length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMetalFilter('SILVER')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              metalFilter === 'SILVER'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block shrink-0" />
            <span>Silver</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800/30 text-[10px]">
              {allMainCategories.filter((c) => c.metalType === 'SILVER' || c.metalType === 'ALL').length}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MAIN CATEGORIES TABLE */}
      {(viewMode === 'split' || viewMode === 'categories') && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 sm:px-6 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-burgundy-900/10 text-burgundy-900 flex items-center justify-center font-bold">
                <FolderTree className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-base text-burgundy-950 flex items-center gap-2">
                  <span>Main Categories</span>
                  <span className="px-2 py-0.5 rounded-full bg-burgundy-100 text-burgundy-900 text-xs font-mono font-semibold">
                    {filteredMainCategories.length}
                  </span>
                </h2>
                <p className="text-[11px] text-stone-500">
                  Primary jewellery categories for storefront homepage cards, navbar navigation, and product assignment.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-burgundy-900 text-gold-200 text-xs font-semibold hover:bg-burgundy-800 self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-gold-400" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Desktop Table Presentation */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="p-4">Category Details</th>
                  <th className="p-4">Metal Group</th>
                  <th className="p-4">Assigned Subcategories</th>
                  <th className="p-4">Storefront Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">
                      Loading categories...
                    </td>
                  </tr>
                ) : filteredMainCategories.length > 0 ? (
                  filteredMainCategories.map((cat) => {
                    const isNavel = cat.name.toLowerCase().includes('navel');
                    const isSilver = cat.metalType === 'SILVER';
                    const isCommon = cat.metalType === 'ALL';
                    const assignedSubs = subcategoriesByParentMap.get(cat._id) || [];

                    return (
                      <tr key={cat._id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-lg bg-[#3A060E] overflow-hidden shrink-0 border border-gold-400/50 shadow-xs">
                              <img
                                src={cat.imageUrl || '/logo.jpg'}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/logo.jpg';
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-serif font-bold text-sm text-burgundy-950">
                                  {cat.name}
                                </span>
                                {cat.sku && (
                                  <span className="px-1.5 py-0.5 rounded bg-burgundy-50 border border-gold-300/60 font-mono text-[10px] font-semibold text-burgundy-900">
                                    {cat.sku}
                                  </span>
                                )}
                                {isNavel && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold animate-pulse">
                                    Pending Client Confirmation
                                  </span>
                                )}
                              </div>
                              {cat.description && (
                                <span className="text-[11px] text-stone-500 line-clamp-1 max-w-xs block mt-0.5">
                                  {cat.description}
                                </span>
                              )}
                              {cat.imagePublicId && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-400 mt-0.5">
                                  <Cloud className="w-3 h-3 text-gold-600" />
                                  <span className="truncate max-w-[140px]">{cat.imagePublicId}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          {isCommon ? (
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gold-100 text-gold-950 border border-gold-300">
                              COMMON • ALL
                            </span>
                          ) : isSilver ? (
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                              SILVER
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                              {cat.metalType || 'GOLD'}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {assignedSubs.length > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-gold-50 border border-gold-300/70 text-burgundy-950 font-bold text-[11px]">
                                  {assignedSubs.length} {assignedSubs.length === 1 ? 'Subcategory' : 'Subcategories'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedParentFilter(cat._id);
                                    setViewMode('subcategories');
                                  }}
                                  className="text-[11px] text-burgundy-900 font-semibold hover:underline inline-flex items-center gap-0.5"
                                  title="Filter subcategories table to this category"
                                >
                                  <span>View</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {assignedSubs.slice(0, 4).map((sub) => (
                                  <span
                                    key={sub._id}
                                    className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-medium"
                                  >
                                    {sub.name}
                                  </span>
                                ))}
                                {assignedSubs.length > 4 && (
                                  <span className="text-[10px] text-stone-400 font-medium self-center">
                                    +{assignedSubs.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-stone-400 italic">None</span>
                              <button
                                type="button"
                                onClick={() => openCreateSubcategoryModal(cat._id)}
                                className="text-[11px] font-bold text-gold-700 hover:text-gold-900 hover:underline flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Sub</span>
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={busyCategoryId === cat._id}
                            onClick={() => handleToggleActive(cat)}
                            title="Click to toggle public visibility"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors disabled:opacity-50 ${
                              cat.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                            }`}
                          >
                            {cat.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{cat.isActive ? 'Active' : 'Hidden'}</span>
                          </button>
                        </td>

                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPreviewCategory(cat)}
                            className="p-1.5 rounded-lg border border-gold-300/70 hover:bg-gold-50 text-burgundy-900"
                            title="Preview Category Card"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(cat);
                            }}
                            className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-stone-500">
                      No main categories matching selected metal filter. Use "Add New Category" above to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Subcategories Cards */}
          <div className="block md:hidden p-3.5 space-y-3">
            {isLoading ? (
              <div className="p-6 text-center text-stone-400 text-xs">
                Loading subcategories...
              </div>
            ) : filteredSubcategories.length > 0 ? (
              filteredSubcategories.map((sub) => {
                const pid = getCategoryParentId(sub);
                const parent = allMainCategories.find((p) => p._id === pid);
                const effectiveMetal = sub.metalType || parent?.metalType || 'GOLD';
                const isSilver = effectiveMetal === 'SILVER';
                const isCommon = effectiveMetal === 'ALL';

                return (
                  <div
                    key={sub._id}
                    className="bg-[#FCFAF6] border border-stone-200/90 rounded-xl p-3.5 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gold-50 border border-gold-300/80 flex items-center justify-center text-burgundy-900 font-bold shrink-0">
                          <GitFork className="w-3.5 h-3.5 text-gold-700" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-serif font-bold text-sm text-burgundy-950 truncate">
                            {sub.name}
                          </h4>
                          {sub.sku && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-gold-50 border border-gold-300 font-mono text-[9px] font-semibold text-burgundy-900">
                              {sub.sku}
                            </span>
                          )}
                        </div>
                      </div>

                      {isCommon ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gold-100 text-gold-950 border border-gold-300 shrink-0">
                          ALL
                        </span>
                      ) : isSilver ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-300 shrink-0">
                          SILVER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                          {effectiveMetal}
                        </span>
                      )}
                    </div>

                    {/* Assigned Parent Category Pill */}
                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-semibold text-stone-500 uppercase shrink-0">Parent:</span>
                        {parent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-burgundy-50 border border-gold-300 text-burgundy-950 font-bold text-[10px] truncate">
                            <FolderTree className="w-3 h-3 text-gold-700 shrink-0" />
                            <span className="truncate">{parent.name}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-600 font-semibold italic">Unassigned</span>
                        )}
                      </div>
                    </div>

                    {/* Actions and Status Footer */}
                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={busyCategoryId === sub._id}
                        onClick={() => handleToggleActive(sub)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors disabled:opacity-50 ${
                          sub.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {sub.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{sub.isActive ? 'Active' : 'Hidden'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewCategory(sub)}
                          className="p-1.5 rounded-lg border border-gold-300/70 hover:bg-gold-50 text-burgundy-900"
                          title="Preview Subcategory"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditSubcategoryModal(sub)}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                          title="Edit Subcategory"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(sub);
                          }}
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                          title="Delete Subcategory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-stone-500 text-xs">
                {selectedParentFilter
                  ? 'No subcategories found under the selected parent category.'
                  : 'No subcategories created yet.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: SUBCATEGORIES TABLE */}
      {(viewMode === 'split' || viewMode === 'subcategories') && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 sm:px-6 bg-stone-50 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold-500/15 text-gold-900 flex items-center justify-center font-bold">
                <GitFork className="w-4 h-4 text-gold-700" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-base text-burgundy-950 flex items-center gap-2">
                  <span>Subcategories</span>
                  <span className="px-2 py-0.5 rounded-full bg-gold-100 text-burgundy-900 text-xs font-mono font-semibold">
                    {filteredSubcategories.length}
                  </span>
                </h2>
                <p className="text-[11px] text-stone-500">
                  Secondary jewellery types assigned to a parent category for granular product filtering.
                </p>
              </div>
            </div>

            {/* Subcategories Filter & Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter by Parent Category Dropdown */}
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="subcat-parent-filter"
                  className="text-[11px] font-semibold text-stone-500 uppercase whitespace-nowrap"
                >
                  Parent:
                </label>
                <select
                  id="subcat-parent-filter"
                  value={selectedParentFilter}
                  onChange={(e) => setSelectedParentFilter(e.target.value)}
                  className="text-xs p-2 border border-stone-300 rounded-lg bg-white text-stone-800 font-medium outline-none focus:border-gold-500"
                >
                  <option value="">All Parent Categories ({allSubcategories.length})</option>
                  {allMainCategories.map((p) => {
                    const count = subcategoriesByParentMap.get(p._id)?.length || 0;
                    return (
                      <option key={p._id} value={p._id}>
                        {p.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <input
                  type="text"
                  value={subcategorySearchQuery}
                  onChange={(e) => setSubcategorySearchQuery(e.target.value)}
                  placeholder="Filter subcategories..."
                  className="text-xs pl-7 pr-7 py-2 border border-stone-300 rounded-lg outline-none focus:border-gold-500 w-36 sm:w-44 bg-white font-medium"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2.5" />
                {subcategorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSubcategorySearchQuery('')}
                    className="absolute right-2 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => openCreateSubcategoryModal(selectedParentFilter || undefined)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold-500/60 bg-burgundy-950 text-gold-300 text-xs font-semibold hover:bg-burgundy-900 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-gold-400" />
                <span>Add Subcategory</span>
              </button>
            </div>
          </div>

          {/* Desktop Table Presentation */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="p-4">Subcategory Name &amp; SKU</th>
                  <th className="p-4">Assigned Parent Category</th>
                  <th className="p-4">Metal Group</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">
                      Loading subcategories...
                    </td>
                  </tr>
                ) : filteredSubcategories.length > 0 ? (
                  filteredSubcategories.map((sub) => {
                    const pid = getCategoryParentId(sub);
                    const parent = allMainCategories.find((p) => p._id === pid);
                    const effectiveMetal = sub.metalType || parent?.metalType || 'GOLD';
                    const isSilver = effectiveMetal === 'SILVER';
                    const isCommon = effectiveMetal === 'ALL';

                    return (
                      <tr key={sub._id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gold-50 border border-gold-300/80 flex items-center justify-center text-burgundy-900 font-bold shrink-0">
                              <GitFork className="w-4 h-4 text-gold-700" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-serif font-bold text-sm text-burgundy-950">
                                  {sub.name}
                                </span>
                                {sub.sku && (
                                  <span className="px-1.5 py-0.5 rounded bg-gold-50 border border-gold-300 font-mono text-[10px] font-semibold text-burgundy-900">
                                    {sub.sku}
                                  </span>
                                )}
                              </div>
                              {sub.description && (
                                <span className="text-[11px] text-stone-500 line-clamp-1 max-w-xs block mt-0.5">
                                  {sub.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          {parent ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-burgundy-50 border border-gold-300 text-burgundy-950 font-bold text-xs">
                                <FolderTree className="w-3.5 h-3.5 text-gold-700" />
                                <span>{parent.name}</span>
                              </span>
                              {parent.sku && (
                                <span className="font-mono text-[10px] text-stone-500 font-medium">
                                  ({parent.sku})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-semibold">
                              Unassigned Parent
                            </span>
                          )}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          {isCommon ? (
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gold-100 text-gold-950 border border-gold-300">
                              COMMON • ALL
                            </span>
                          ) : isSilver ? (
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                              SILVER
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                              {effectiveMetal}
                            </span>
                          )}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={busyCategoryId === sub._id}
                            onClick={() => handleToggleActive(sub)}
                            title="Click to toggle public visibility"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors disabled:opacity-50 ${
                              sub.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                            }`}
                          >
                            {sub.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{sub.isActive ? 'Active' : 'Hidden'}</span>
                          </button>
                        </td>

                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPreviewCategory(sub)}
                            className="p-1.5 rounded-lg border border-gold-300/70 hover:bg-gold-50 text-burgundy-900"
                            title="Preview Subcategory"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditSubcategoryModal(sub)}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                            title="Edit Subcategory"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(sub);
                            }}
                            className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                            title="Delete Subcategory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-stone-500">
                      {selectedParentFilter
                        ? 'No subcategories found under the selected parent category.'
                        : 'No subcategories created yet. Use "Add New Subcategory" to create one.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Subcategories Cards */}
          <div className="block md:hidden p-3.5 space-y-3">
            {isLoading ? (
              <div className="p-6 text-center text-stone-400 text-xs">
                Loading subcategories...
              </div>
            ) : filteredSubcategories.length > 0 ? (
              filteredSubcategories.map((sub) => {
                const pid = getCategoryParentId(sub);
                const parent = allMainCategories.find((p) => p._id === pid);
                const effectiveMetal = sub.metalType || parent?.metalType || 'GOLD';
                const isSilver = effectiveMetal === 'SILVER';
                const isCommon = effectiveMetal === 'ALL';

                return (
                  <div
                    key={sub._id}
                    className="bg-[#FCFAF6] border border-stone-200/90 rounded-xl p-3.5 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gold-50 border border-gold-300/80 flex items-center justify-center text-burgundy-900 font-bold shrink-0">
                          <GitFork className="w-3.5 h-3.5 text-gold-700" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-serif font-bold text-sm text-burgundy-950 truncate">
                            {sub.name}
                          </h4>
                          {sub.sku && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-gold-50 border border-gold-300 font-mono text-[9px] font-semibold text-burgundy-900">
                              {sub.sku}
                            </span>
                          )}
                        </div>
                      </div>

                      {isCommon ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gold-100 text-gold-950 border border-gold-300 shrink-0">
                          ALL
                        </span>
                      ) : isSilver ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-300 shrink-0">
                          SILVER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                          {effectiveMetal}
                        </span>
                      )}
                    </div>

                    {/* Assigned Parent Category Pill */}
                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-semibold text-stone-500 uppercase shrink-0">Parent:</span>
                        {parent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-burgundy-50 border border-gold-300 text-burgundy-950 font-bold text-[10px] truncate">
                            <FolderTree className="w-3 h-3 text-gold-700 shrink-0" />
                            <span className="truncate">{parent.name}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-600 font-semibold italic">Unassigned</span>
                        )}
                      </div>
                    </div>

                    {/* Actions and Status Footer */}
                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={busyCategoryId === sub._id}
                        onClick={() => handleToggleActive(sub)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors disabled:opacity-50 ${
                          sub.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {sub.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{sub.isActive ? 'Active' : 'Hidden'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewCategory(sub)}
                          className="p-1.5 rounded-lg border border-gold-300/70 hover:bg-gold-50 text-burgundy-900"
                          title="Preview Subcategory"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditSubcategoryModal(sub)}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                          title="Edit Subcategory"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(sub);
                          }}
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                          title="Delete Subcategory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-stone-500 text-xs">
                {selectedParentFilter
                  ? 'No subcategories found under the selected parent category.'
                  : 'No subcategories created yet.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal with Live Storefront Preview */}
      {isModalOpen && (
        <AdminModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 overflow-y-auto bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gold-500/40 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-modal-enter">
            <div className="bg-burgundy-900 text-gold-100 p-4 sm:p-5 border-b border-gold-600/40 flex items-center justify-between shrink-0">
              <h2 className="font-serif font-bold text-lg text-gold-100">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
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
              onSubmit={handleSubmit(onSubmit)}
              className="p-5 sm:p-6 overflow-y-auto text-xs grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              <div className="md:col-span-7 space-y-4">
                {modalError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
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
                      Category Name *
                    </label>
                    <input
                      type="text"
                      {...register('name', {
                        onChange: (e) => {
                          if (!editingCategory && !isSkuManual) {
                            requestAutoCategorySku(e.target.value);
                          }
                        },
                      })}
                      placeholder="e.g. Heritage Temple Collections"
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                    {errors.name && <p className="text-red-600 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold uppercase text-stone-700">
                        Category Code (SKU)
                      </label>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          isSkuManual
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isSkuManual ? 'Custom' : 'Auto-Generated'}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        {...register('sku', {
                          onChange: (e) => {
                            const upper = String(e.target.value || '').toUpperCase();
                            setValue('sku', upper, { shouldDirty: true });
                            setIsSkuManual(upper.trim().length > 0);
                          },
                        })}
                        placeholder="Auto-generated (e.g. SRJ-CAT-NCK)"
                        className="flex-1 min-w-0 p-2.5 border rounded-lg font-mono uppercase outline-none focus:border-gold-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsSkuManual(false);
                          requestAutoCategorySku(watchedName || '', editingCategory?._id);
                        }}
                        title="Auto-generate Category SKU"
                        className="px-2.5 py-2 border border-stone-200 rounded-lg text-burgundy-900 hover:bg-gold-50 shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {errors.sku && <p className="text-red-600 mt-1">{errors.sku.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Metal Group
                  </label>
                  <select
                    {...register('metalType')}
                    className="w-full p-2.5 border rounded-lg outline-none bg-white focus:border-gold-500 font-medium text-stone-800"
                  >
                    <option value="ALL">Common / All Metals (Gold, Silver, Platinum)</option>
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="DIAMOND">Diamond</option>
                  </select>
                </div>

                <ImageDropzone
                  label="Category Cover Image (Cloudinary Upload)"
                  value={watchedImageUrl}
                  publicId={watchedPublicId}
                  onChange={(url) =>
                    setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
                  }
                  onPublicIdChange={(pid) =>
                    setValue('imagePublicId', pid, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
                  }
                  uploadFolder="categories"
                  helperText="Upload PNG/JPG/WEBP (max 10MB) to Cloudinary or paste a hosted image URL"
                />

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('isActive')} className="w-4 h-4 rounded text-burgundy-900 focus:ring-gold-500" />
                    <span className="font-semibold text-stone-700">Published / Active</span>
                  </label>
                </div>
              </div>

              {/* Right Column: Live Storefront Card Preview */}
              <div className="md:col-span-5 bg-[#FAF4EA] rounded-2xl border border-[#DEC48C] p-4 flex flex-col justify-start space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A4792B]">
                    Storefront Card Preview
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      livePreviewCategory.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {livePreviewCategory.isActive ? 'Visible on Home' : 'Draft / Hidden'}
                  </span>
                </div>

                <div className="max-w-[200px] mx-auto py-1">
                  <CategoryCard category={livePreviewCategory} previewOnly />
                </div>

                <div className="text-[10px] text-stone-500 border-t border-[#E6D6B5] pt-2.5 space-y-1">
                  <p>
                    <strong>Category SKU:</strong>{' '}
                    <span className="font-mono text-burgundy-900">
                      {watchedSku || 'Auto-generated on save'}
                    </span>
                  </p>
                  <p>
                    Public storefront links are managed automatically by the system.
                  </p>
                </div>
              </div>

              {modalError && (
                <div className="md:col-span-12 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-medium">{modalError}</span>
                </div>
              )}

              <div className="md:col-span-12 pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalError(null);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 border rounded-lg text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-burgundy-900 text-gold-200 rounded-lg font-bold shadow-md hover:bg-burgundy-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Publish Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminModalPortal>
      )}

      {/* Standalone Row Preview Modal */}
      {previewCategory && (
        <AdminModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewCategory(null);
            }}
          >
            <div className="w-full max-w-sm bg-[#FAF4EA] rounded-2xl border border-[#C99B3B] shadow-2xl overflow-hidden animate-modal-enter">
              <div className="bg-burgundy-900 text-gold-100 px-5 py-3.5 flex items-center justify-between">
                <span className="font-serif font-bold text-sm">Category Homepage Preview</span>
                <button type="button" onClick={() => setPreviewCategory(null)} className="text-gold-300 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="max-w-[220px] mx-auto">
                  <CategoryCard category={previewCategory} previewOnly />
                </div>
                {previewCategory.description && (
                  <p className="text-xs text-[#5C3D35] text-center">{previewCategory.description}</p>
                )}
                <div className="text-[11px] text-stone-600 bg-white/75 rounded-lg p-3 border border-[#E6D6B5] space-y-1">
                  <p><strong>Status:</strong> {previewCategory.isActive ? 'Published on Public Site' : 'Hidden from Public Site'}</p>
                  {previewCategory.imagePublicId && (
                    <p className="truncate"><strong>Cloudinary ID:</strong> {previewCategory.imagePublicId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AdminModalPortal>
      )}

      {/* Create / Edit Subcategory Modal */}
      {isSubcatModalOpen && (
        <AdminModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gold-500/40 overflow-hidden my-auto animate-modal-enter">
              <div className="bg-burgundy-900 text-gold-100 p-4 sm:p-5 border-b border-gold-600/40 flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-lg text-gold-100">
                    {editingSubcategory ? 'Edit Subcategory' : 'Create New Subcategory'}
                  </h2>
                  <p className="text-[11px] text-gold-300/80 mt-0.5">
                    {editingSubcategory
                      ? 'Update subcategory name or reassign it to another main category.'
                      : 'Assign a new subcategory to an existing active main category.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubcatError(null);
                    setIsSubcatModalOpen(false);
                    setEditingSubcategory(null);
                  }}
                  className="text-gold-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubcategorySubmit} className="p-5 sm:p-6 space-y-4 text-xs">
                {subcatError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{subcatError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubcatError(null)}
                      className="text-red-500 hover:text-red-800 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={subcatName}
                    onChange={(e) => setSubcatName(e.target.value)}
                    placeholder="Enter subcategory name (e.g. Long, Short, Bracelet, Antique)"
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500 font-medium text-stone-800"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Manually typed subcategory name for jewellery classification.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Select Category *
                  </label>
                  <select
                    required
                    value={subcatParentId}
                    onChange={(e) => setSubcatParentId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg outline-none bg-white focus:border-gold-500 font-medium text-stone-800"
                  >
                    <option value="">Select Main Category</option>
                    {mainCategories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.metalType === 'ALL' ? '(Common • All Metals)' : `(${c.metalType || 'GOLD'})`}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-400 mt-1">
                    This subcategory will appear only under the selected main category.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    disabled={isSubcatSubmitting}
                    onClick={() => {
                      setSubcatError(null);
                      setIsSubcatModalOpen(false);
                      setEditingSubcategory(null);
                    }}
                    className="px-4 py-2 border rounded-xl text-stone-600 hover:bg-stone-50 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubcatSubmitting || !subcatName.trim() || !subcatParentId}
                    className="px-5 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 font-bold uppercase tracking-wider text-xs shadow-md hover:opacity-95 disabled:opacity-50"
                  >
                    {isSubcatSubmitting
                      ? 'Saving...'
                      : editingSubcategory
                      ? 'Update Subcategory'
                      : 'Create Subcategory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AdminModalPortal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-2xl border border-red-200 shadow-2xl p-6 space-y-4 animate-modal-enter">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-burgundy-950">
                    {Boolean(deleteTarget.parentCategoryId || deleteTarget.parentCategory)
                      ? `Delete Subcategory "${deleteTarget.name}"?`
                      : `Delete Category "${deleteTarget.name}"?`}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    {Boolean(deleteTarget.parentCategoryId || deleteTarget.parentCategory)
                      ? 'This removes the subcategory from selection dropdowns. Deletion is blocked if active jewellery products are currently assigned to it.'
                      : 'This removes the category from the public website carousel and catalogue. Deletion is blocked if active jewellery products or subcategories still belong to it.'}
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </AdminModalPortal>
      )}
    </div>
  );
};
