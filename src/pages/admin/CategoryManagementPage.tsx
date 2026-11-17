import React, { useEffect, useRef, useState } from 'react';
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
  parentCategoryId: z.string().optional().or(z.literal('')),
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
      parentCategoryId: '',
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
      parentCategoryId: cat.parentCategoryId || '',
      imageUrl: cat.imageUrl || '',
      imagePublicId: cat.imagePublicId || '',
      isActive: cat.isActive,
    });
    setIsModalOpen(true);
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
        parentCategoryId: data.parentCategoryId || null,
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

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Add New Category</span>
        </button>
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

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Category</th>
                <th className="p-4">Hierarchy / Media</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-stone-400">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-[#3A060E] overflow-hidden shrink-0 border border-gold-400/50">
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
                        </div>
                        {cat.description && (
                          <span className="text-[11px] text-stone-500 line-clamp-1 max-w-xs block mt-0.5">
                            {cat.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 space-y-1">
                      <div>
                        {cat.parentCategory ? (
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                            Sub of: {cat.parentCategory.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-gold-100 text-burgundy-900 font-bold">
                            Primary Collection
                          </span>
                        )}
                      </div>
                      {cat.imagePublicId && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-500">
                          <Cloud className="w-3 h-3 text-gold-600" />
                          <span className="truncate max-w-[140px]">{cat.imagePublicId}</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4">
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-stone-500">
                    No categories created yet. Use "Add New Category" to create and publish jewellery categories manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                    Parent Category (Optional for Subcategory)
                  </label>
                  <select
                    {...register('parentCategoryId')}
                    className="w-full p-2.5 border rounded-lg outline-none bg-white focus:border-gold-500"
                  >
                    <option value="">None (Top-Level Category)</option>
                    {categories
                      .filter((c) => !editingCategory || c._id !== editingCategory._id)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
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
                    Delete Category "{deleteTarget.name}"?
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    This removes the category from the public website carousel and catalogue. Deletion is blocked if active jewellery products or subcategories still belong to it.
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
