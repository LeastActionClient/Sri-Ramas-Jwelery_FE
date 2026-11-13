import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Monitor,
  Smartphone,
  ExternalLink,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { BannerAdminPayload, cmsApi } from '@/services/api/cms.api';
import { categoriesApi } from '@/services/api/categories.api';
import { ImageDropzone } from '@/components/admin/ImageDropzone';
import { PromotionalBannerCarousel } from '@/components/customer/PromotionalBannerCarousel';
import {
  BannerButtonStyle,
  BannerContentMode,
  BannerHeightOption,
  BannerTextAlignment,
  BannerTextColor,
  BannerTextPosition,
  HeroBanner
} from '@/types';

interface BannerManagementPanelProps {
  onStatusMessage?: (msg: string) => void;
  onErrorMessage?: (err: string) => void;
}

const toDateInputValue = (value?: string | null): string => {
  if (!value) return '';
  return value.slice(0, 10);
};

const createEmptyBannerForm = (nextOrder: number): BannerAdminPayload => ({
  smallHeading: 'Exclusive Collection',
  title: '',
  highlightedText: '',
  subtitle: '',
  description: '',
  desktopImageUrl: '',
  desktopImagePublicId: '',
  mobileImageUrl: '',
  mobileImagePublicId: '',
  imageAlt: '',
  ctaText: 'Explore Collection',
  ctaLink: '/products',
  position: 'HOME_HERO',
  contentMode: 'layered',
  textAlignment: 'right',
  textPosition: 'center',
  textColor: 'cream-gold',
  buttonStyle: 'gold-outline',
  overlayOpacity: 35,
  bannerHeight: 'standard',
  displayOrder: nextOrder,
  startDate: null,
  endDate: null,
  isActive: true
});

const QUICK_CTA_PRESETS = [
  { label: 'Silver Collection', url: '/products?metalType=SILVER' },
  { label: 'Silver Rings', url: '/products?metalType=SILVER&category=rings' },
  { label: 'Gold Collection', url: '/products?metalType=GOLD' },
  { label: 'Diamond Collection', url: '/products?metalType=DIAMOND' },
  { label: 'Platinum Collection', url: '/products?metalType=PLATINUM' },
  { label: 'All Collections', url: '/products' },
  { label: 'Savings Schemes', url: '/schemes' }
];

export const BannerManagementPanel: React.FC<BannerManagementPanelProps> = ({
  onStatusMessage,
  onErrorMessage
}) => {
  const queryClient = useQueryClient();
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerAdminPayload>(() => createEmptyBannerForm(1));
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [editorPreviewViewport, setEditorPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [previewModalBanners, setPreviewModalBanners] = useState<HeroBanner[] | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>('Homepage Carousel Preview');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  const [deleteCandidate, setDeleteCandidate] = useState<HeroBanner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: cmsApi.adminGetBanners
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesApi.adminGetCategories
  });

  const sortedBanners = useMemo(
    () =>
      [...banners].sort(
        (a, b) => (a.displayOrder ?? a.sortOrder ?? 0) - (b.displayOrder ?? b.sortOrder ?? 0)
      ),
    [banners]
  );

  const activeBanners = useMemo(
    () => sortedBanners.filter((b) => b.isActive !== false),
    [sortedBanners]
  );

  const notifySuccess = (text: string) => {
    setLocalErr(null);
    setLocalMsg(text);
    onStatusMessage?.(text);
  };

  const notifyError = (text: string) => {
    setLocalMsg(null);
    setLocalErr(text);
    onErrorMessage?.(text);
  };

  const invalidateBannerQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    queryClient.invalidateQueries({ queryKey: ['banners'] });
    queryClient.invalidateQueries({ queryKey: ['homepage'] });
  };

  const openCreateModal = () => {
    setEditingBannerId(null);
    setLocalErr(null);
    setBannerForm(createEmptyBannerForm(sortedBanners.length + 1));
    setEditorPreviewViewport('desktop');
    setIsEditorOpen(true);
  };

  const openEditModal = (banner: HeroBanner) => {
    setEditingBannerId(banner._id);
    setLocalErr(null);
    setBannerForm({
      smallHeading: banner.smallHeading || '',
      title: banner.title || '',
      highlightedText: banner.highlightedText || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      desktopImageUrl: banner.desktopImageUrl || banner.imageUrl || '',
      desktopImagePublicId: banner.desktopImagePublicId || '',
      mobileImageUrl: banner.mobileImageUrl || '',
      mobileImagePublicId: banner.mobileImagePublicId || '',
      imageAlt: banner.imageAlt || '',
      ctaText: banner.ctaText || '',
      ctaLink: banner.ctaLink || banner.targetLink || '/products',
      position: banner.position || 'HOME_HERO',
      contentMode: banner.contentMode || 'layered',
      textAlignment: banner.textAlignment || 'right',
      textPosition: banner.textPosition || 'center',
      textColor: banner.textColor || 'cream-gold',
      buttonStyle: banner.buttonStyle || 'gold-outline',
      overlayOpacity: typeof banner.overlayOpacity === 'number' ? banner.overlayOpacity : 35,
      bannerHeight: banner.bannerHeight || 'standard',
      displayOrder: banner.displayOrder ?? banner.sortOrder ?? 1,
      startDate: banner.startDate || null,
      endDate: banner.endDate || null,
      isActive: banner.isActive ?? true
    });
    setEditorPreviewViewport('desktop');
    setIsEditorOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.desktopImageUrl.trim()) {
      notifyError('Please upload or enter a desktop promotional banner image.');
      return;
    }
    if (
      bannerForm.startDate &&
      bannerForm.endDate &&
      new Date(bannerForm.endDate) < new Date(bannerForm.startDate)
    ) {
      notifyError('Schedule end date must be on or after the start date.');
      return;
    }

    setSaving(true);
    setLocalErr(null);
    try {
      const payload: BannerAdminPayload = {
        ...bannerForm,
        imageAlt: bannerForm.imageAlt?.trim() || `${bannerForm.title.trim()} promotional banner`
      };

      if (editingBannerId) {
        await cmsApi.adminUpdateBanner(editingBannerId, payload);
        notifySuccess(`Banner "${payload.title}" updated and synced to the homepage.`);
      } else {
        await cmsApi.adminCreateBanner(payload);
        notifySuccess(`Banner "${payload.title}" published to Homepage Banner CMS.`);
      }
      invalidateBannerQueries();
      setIsEditorOpen(false);
    } catch (err: any) {
      notifyError(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to save promotional banner.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (banner: HeroBanner) => {
    setTogglingId(banner._id);
    try {
      const nextState = !(banner.isActive ?? true);
      await cmsApi.adminUpdateBannerStatus(banner._id, nextState);
      notifySuccess(
        nextState
          ? `"${banner.title}" activated and live on homepage carousel.`
          : `"${banner.title}" disabled and hidden from public carousel.`
      );
      invalidateBannerQueries();
    } catch (err: any) {
      notifyError(err?.response?.data?.error?.message || 'Failed to update banner visibility.');
    } finally {
      setTogglingId(null);
    }
  };

  const persistOrder = async (reorderedList: HeroBanner[]) => {
    setReordering(true);
    try {
      await cmsApi.adminReorderBanners(
        reorderedList.map((item, idx) => ({
          id: item._id,
          displayOrder: idx + 1
        }))
      );
      invalidateBannerQueries();
      notifySuccess('Homepage banner display order updated.');
    } catch (err: any) {
      notifyError(err?.response?.data?.error?.message || 'Failed to reorder homepage banners.');
    } finally {
      setReordering(false);
    }
  };

  const handleStepOrder = async (index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= sortedBanners.length) return;
    const nextList = [...sortedBanners];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(targetIdx, 0, moved);
    await persistOrder(nextList);
  };

  const handleDropOnBanner = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const sourceIdx = sortedBanners.findIndex((b) => b._id === draggedId);
    const targetIdx = sortedBanners.findIndex((b) => b._id === targetId);
    setDraggedId(null);
    if (sourceIdx < 0 || targetIdx < 0) return;

    const nextList = [...sortedBanners];
    const [moved] = nextList.splice(sourceIdx, 1);
    nextList.splice(targetIdx, 0, moved);
    await persistOrder(nextList);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await cmsApi.adminDeleteBanner(deleteCandidate._id);
      notifySuccess(`Deleted banner "${deleteCandidate.title}".`);
      invalidateBannerQueries();
      setDeleteCandidate(null);
    } catch (err: any) {
      notifyError(err?.response?.data?.error?.message || 'Failed to delete banner.');
    } finally {
      setDeleting(false);
    }
  };

  const liveModalPreviewBanner: HeroBanner = {
    _id: editingBannerId || 'preview-draft',
    smallHeading: bannerForm.smallHeading || '',
    title: bannerForm.title || 'Silver Necklace',
    highlightedText: bannerForm.highlightedText || '',
    subtitle: bannerForm.subtitle || '',
    description: bannerForm.description || '',
    desktopImageUrl: bannerForm.desktopImageUrl,
    imageUrl: bannerForm.desktopImageUrl,
    mobileImageUrl: bannerForm.mobileImageUrl || undefined,
    imageAlt: bannerForm.imageAlt || bannerForm.title || 'Banner preview',
    ctaText: bannerForm.ctaText || '',
    ctaLink: bannerForm.ctaLink || '/products',
    targetLink: bannerForm.ctaLink || '/products',
    position: bannerForm.position,
    contentMode: bannerForm.contentMode,
    textAlignment: bannerForm.textAlignment,
    textPosition: bannerForm.textPosition || 'center',
    textColor: bannerForm.textColor || 'cream-gold',
    buttonStyle: bannerForm.buttonStyle || 'gold-outline',
    overlayOpacity: typeof bannerForm.overlayOpacity === 'number' ? bannerForm.overlayOpacity : 35,
    bannerHeight: bannerForm.bannerHeight || 'standard',
    displayOrder: bannerForm.displayOrder,
    sortOrder: bannerForm.displayOrder,
    startDate: bannerForm.startDate || null,
    endDate: bannerForm.endDate || null,
    isActive: true
  };

  const availableCategoryLinks = useMemo(
    () =>
      categories
        .filter((cat) => cat.isActive !== false && cat.slug)
        .slice(0, 6)
        .map((cat) => ({
          label: cat.name,
          url: `/products?category=${encodeURIComponent(cat.slug)}`
        })),
    [categories]
  );

  return (
    <div className="space-y-5">
      {/* Banner Studio Coverage & Action Bar */}
      <div className="bg-[#FCF7EC] border border-gold-300/80 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-burgundy-950">
              Homepage Promotional Carousel
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {activeBanners.length} Active
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-200 text-stone-700">
              {sortedBanners.length - activeBanners.length} Paused
            </span>
          </div>
          <p className="text-xs text-stone-600 max-w-2xl">
            Manage promotional banners, separate desktop & mobile visuals, CTA links, layered text overlays, visibility, and drag-and-drop sequence synced directly to the Sri Ramas Jewellery homepage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {activeBanners.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPreviewModalTitle(
                  `Live Homepage Carousel Preview (${activeBanners.length} Active Slide${activeBanners.length === 1 ? '' : 's'})`
                );
                setPreviewModalBanners(activeBanners);
                setPreviewViewport('desktop');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gold-400 bg-white text-burgundy-900 text-xs font-bold hover:bg-gold-50 transition-colors"
            >
              <Eye className="w-4 h-4 text-gold-700" />
              <span>Preview Carousel</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>Add Banner</span>
          </button>
        </div>
      </div>

      {!onStatusMessage && localMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 rounded-xl flex items-center justify-between gap-2 animate-toast-enter">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{localMsg}</span>
          </div>
          <button type="button" onClick={() => setLocalMsg(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!onErrorMessage && localErr && (
        <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800 rounded-xl flex items-center justify-between gap-2 animate-toast-enter">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{localErr}</span>
          </div>
          <button type="button" onClick={() => setLocalErr(null)} className="text-red-700 hover:text-red-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner Listing */}
      {isLoading ? (
        <div className="p-10 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
          Loading promotional banners...
        </div>
      ) : sortedBanners.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-stone-200 text-center space-y-3">
          <ImageIcon className="w-10 h-10 text-gold-600 mx-auto" />
          <p className="font-serif text-base font-bold text-burgundy-950">
            No promotional banners configured yet
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Upload a full campaign artwork banner or a clean jewellery backdrop with customizable heading and CTA overlay.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-burgundy-900 text-gold-200 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Banner</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reordering && (
            <div className="text-[11px] font-semibold text-burgundy-800 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving new slide sequence...</span>
            </div>
          )}

          {sortedBanners.map((banner, idx) => {
            const isActive = banner.isActive !== false;
            const isCompleteArtwork = banner.contentMode === 'image';
            return (
              <div
                key={banner._id}
                draggable
                onDragStart={() => setDraggedId(banner._id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnBanner(banner._id)}
                onDragEnd={() => setDraggedId(null)}
                className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-sm transition-all ${
                  draggedId === banner._id
                    ? 'opacity-50 border-burgundy-500 ring-2 ring-gold-400'
                    : isActive
                      ? 'border-gold-300/80 hover:border-gold-500'
                      : 'border-stone-200 opacity-80 bg-stone-50/70'
                }`}
              >
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
                  {/* Reorder Handle + Wide 3:1 Thumbnail */}
                  <div className="xl:col-span-5 flex items-center gap-3">
                    <div
                      className="flex flex-col items-center gap-1 shrink-0 text-stone-400"
                      title="Drag to reorder slide"
                    >
                      <button
                        type="button"
                        disabled={idx === 0 || reordering}
                        onClick={() => handleStepOrder(idx, -1)}
                        className="p-1 rounded hover:bg-stone-100 text-stone-500 disabled:opacity-30"
                        aria-label="Move banner up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing text-gold-700" />
                      <button
                        type="button"
                        disabled={idx === sortedBanners.length - 1 || reordering}
                        onClick={() => handleStepOrder(idx, 1)}
                        className="p-1 rounded hover:bg-stone-100 text-stone-500 disabled:opacity-30"
                        aria-label="Move banner down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-burgundy-950 border border-gold-300/60 shadow-inner">
                        <img
                          src={banner.desktopImageUrl || banner.imageUrl}
                          alt={banner.imageAlt || banner.title}
                          className="w-full h-full object-cover object-center"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-gold-200 font-mono text-[10px] font-bold">
                          Slide #{idx + 1}
                        </span>
                        {banner.mobileImageUrl && (
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[9px] text-white font-semibold flex items-center gap-1">
                            <Smartphone className="w-2.5 h-2.5 text-gold-300" />
                            Mobile Variant
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="xl:col-span-7 flex flex-col justify-between gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-burgundy-50 text-burgundy-900 text-[10px] font-semibold border border-burgundy-200">
                          {isCompleteArtwork ? (
                            <>
                              <ImageIcon className="w-3 h-3" />
                              <span>Full Artwork Image</span>
                            </>
                          ) : (
                            <>
                              <Layers className="w-3 h-3" />
                              <span>
                                Layered CMS ({banner.textAlignment || 'right'} • {banner.bannerHeight || 'standard'})
                              </span>
                            </>
                          )}
                        </span>
                        <span className="font-mono text-[10px] text-stone-500 px-2 py-0.5 rounded bg-stone-100">
                          Order: {banner.displayOrder ?? idx + 1}
                        </span>
                        {(banner.startDate || banner.endDate) && (
                          <span className="font-mono text-[10px] text-amber-800 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                            {banner.startDate ? toDateInputValue(banner.startDate) : 'Now'} →{' '}
                            {banner.endDate ? toDateInputValue(banner.endDate) : 'Ongoing'}
                          </span>
                        )}
                      </div>

                      <div>
                        {banner.smallHeading && (
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-burgundy-700">
                            {banner.smallHeading}
                          </p>
                        )}
                        <h3 className="font-serif text-base font-bold text-burgundy-950">
                          {banner.title}
                          {banner.highlightedText ? (
                            <span className="ml-1.5 text-xs font-normal text-gold-700">
                              (Gold accent: “{banner.highlightedText}”)
                            </span>
                          ) : null}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-gold-800 font-medium">{banner.subtitle}</p>
                        )}
                        {banner.description && (
                          <p className="text-stone-600 mt-1 line-clamp-2">{banner.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-600 pt-1">
                        <span>
                          <strong className="text-stone-800">CTA:</strong>{' '}
                          {banner.ctaText || 'Clickable Banner'}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="inline-flex items-center gap-1 font-mono text-burgundy-900">
                          <ExternalLink className="w-3 h-3 text-gold-700" />
                          <span>{banner.ctaLink || banner.targetLink || '/products'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewModalTitle(`Banner Preview — ${banner.title}`);
                          setPreviewModalBanners([{ ...banner, isActive: true }]);
                          setPreviewViewport('desktop');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-gold-400 hover:bg-gold-50 text-stone-700 font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold-700" />
                        <span>Preview</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={togglingId === banner._id}
                          onClick={() => handleToggleActive(banner)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors disabled:opacity-50 ${
                            isActive
                              ? 'border-stone-200 text-stone-700 hover:bg-stone-100'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Disable</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(banner)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-burgundy-50 text-burgundy-900 hover:bg-burgundy-100 font-semibold"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(banner)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete promotional banner"
                          aria-label={`Delete banner ${banner.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Banner Modal with Live Preview */}
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditorOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl border border-gold-400 w-full max-w-4xl overflow-hidden shadow-2xl my-6 max-h-[92vh] flex flex-col animate-modal-enter">
            <div className="bg-brand-maroon-gradient p-5 text-gold-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-serif font-bold text-lg text-gold-100">
                  {editingBannerId ? 'Edit Promotional Banner' : 'Add Promotional Banner'}
                </h2>
                <p className="text-[11px] text-gold-300 mt-0.5">
                  Configure artwork, mobile crop variant, CTA link, content overlay mode, and display order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-gold-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-5 text-xs overflow-y-auto">
              {/* Live Homepage Preview Panel inside Editor */}
              {bannerForm.desktopImageUrl.trim() && (
                <div className="rounded-xl border border-gold-300 bg-[#FAF5EA] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold uppercase tracking-wider text-burgundy-950">
                      Live Homepage Preview ({bannerForm.contentMode === 'image' ? 'Complete Artwork' : 'Layered CMS'})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditorPreviewViewport('desktop')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold ${
                          editorPreviewViewport === 'desktop'
                            ? 'bg-burgundy-900 text-gold-200'
                            : 'bg-white text-stone-700 border border-stone-300'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorPreviewViewport('mobile')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold ${
                          editorPreviewViewport === 'mobile'
                            ? 'bg-burgundy-900 text-gold-200'
                            : 'bg-white text-stone-700 border border-stone-300'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>
                  <div
                    className={
                      editorPreviewViewport === 'mobile'
                        ? 'max-w-[375px] mx-auto border border-stone-300 rounded-2xl p-2 bg-white shadow-inner'
                        : ''
                    }
                  >
                    <PromotionalBannerCarousel
                      banners={[liveModalPreviewBanner]}
                      forceViewport={editorPreviewViewport}
                    />
                  </div>
                </div>
              )}

              {/* 1. Image Settings */}
              <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm font-bold text-burgundy-950">
                    1. Image Settings
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    Clean text-free jewellery photography recommended
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ImageDropzone
                    label="Desktop Background Image * (Recommended 3:1 e.g. 1800x600)"
                    altText={bannerForm.imageAlt || bannerForm.title || 'Desktop Banner'}
                    value={bannerForm.desktopImageUrl}
                    publicId={bannerForm.desktopImagePublicId}
                    onChange={(url) =>
                      setBannerForm((prev) => ({ ...prev, desktopImageUrl: url }))
                    }
                    onPublicIdChange={(pid) =>
                      setBannerForm((prev) => ({ ...prev, desktopImagePublicId: pid }))
                    }
                    uploadFolder="banners"
                    helperText="Upload text-free luxury background (PNG/JPG/WEBP) or /images/banners/... Replace anytime."
                  />

                  <ImageDropzone
                    label="Mobile Background Image (Optional 16:9 e.g. 1024x576)"
                    altText={`${bannerForm.title || 'Banner'} mobile variant`}
                    value={bannerForm.mobileImageUrl || ''}
                    publicId={bannerForm.mobileImagePublicId || ''}
                    onChange={(url) =>
                      setBannerForm((prev) => ({ ...prev, mobileImageUrl: url }))
                    }
                    onPublicIdChange={(pid) =>
                      setBannerForm((prev) => ({ ...prev, mobileImagePublicId: pid }))
                    }
                    uploadFolder="banners"
                    helperText="Optional crop tailored for phones (<640px). Falls back cleanly to desktop photo when empty."
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Image Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    maxLength={240}
                    value={bannerForm.imageAlt || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageAlt: e.target.value })}
                    placeholder="Descriptive text for banner imagery..."
                    className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              {/* 2. Content Settings */}
              <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm font-bold text-burgundy-950">
                    2. Content Settings
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    Rendered dynamically as crisp HTML layers over the photo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Small Heading / Eyebrow
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={bannerForm.smallHeading || ''}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, smallHeading: e.target.value })
                      }
                      placeholder="e.g. Exclusive Collection"
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Main Heading *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={160}
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="e.g. Silver Necklace"
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Highlighted Gold Text
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={bannerForm.highlightedText || ''}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, highlightedText: e.target.value })
                      }
                      placeholder="Phrase in Main Heading (e.g. Necklace)"
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      maxLength={240}
                      value={bannerForm.subtitle || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      placeholder="e.g. Timeless Elegance in Pure Silver"
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={500}
                      value={bannerForm.description || ''}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, description: e.target.value })
                      }
                      placeholder="Short supporting collection note..."
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={bannerForm.ctaText || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                      placeholder="e.g. Explore Collection"
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      CTA Destination URL
                    </label>
                    <input
                      type="text"
                      maxLength={300}
                      value={bannerForm.ctaLink || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                      placeholder="/products?metalType=SILVER or /categories"
                      className="w-full p-2.5 border rounded-lg font-mono outline-none focus:border-gold-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[...QUICK_CTA_PRESETS, ...availableCategoryLinks]
                        .slice(0, 8)
                        .map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setBannerForm({ ...bannerForm, ctaLink: preset.url })}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gold-300 bg-gold-50/70 text-burgundy-900 hover:bg-gold-100"
                          >
                            {preset.label}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Design Settings */}
              <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                <h3 className="font-serif text-sm font-bold text-burgundy-950">
                  3. Design Settings
                </h3>

                {/* Render Mode Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        mode: 'layered' as BannerContentMode,
                        title: 'Layered HTML Text & CTA (Recommended)',
                        desc: 'Renders editable Heading, Eyebrow, Gold Highlight, Subtitle & Button live over a clean text-free photo.',
                        icon: Layers
                      },
                      {
                        mode: 'image' as BannerContentMode,
                        title: 'Full Artwork Image Only',
                        desc: 'Displays artwork edge-to-edge as a pure clickable visual with no overlaid text.',
                        icon: ImageIcon
                      }
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const selected = bannerForm.contentMode === option.mode;
                    return (
                      <button
                        key={option.mode}
                        type="button"
                        onClick={() => setBannerForm({ ...bannerForm, contentMode: option.mode })}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                          selected
                            ? 'border-burgundy-900 bg-burgundy-50/70 ring-1 ring-gold-400'
                            : 'border-stone-200 bg-white hover:border-gold-400'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            selected ? 'bg-burgundy-900 text-gold-300' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-burgundy-950">{option.title}</p>
                          <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                            {option.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Horizontal Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'left' as BannerTextAlignment, label: 'Left', icon: AlignLeft },
                          { id: 'center' as BannerTextAlignment, label: 'Center', icon: AlignCenter },
                          { id: 'right' as BannerTextAlignment, label: 'Right', icon: AlignRight }
                        ] as const
                      ).map((align) => {
                        const AlignIcon = align.icon;
                        return (
                          <button
                            key={align.id}
                            type="button"
                            onClick={() =>
                              setBannerForm({ ...bannerForm, textAlignment: align.id })
                            }
                            className={`py-2 px-2 rounded-lg border font-semibold flex items-center justify-center gap-1 ${
                              bannerForm.textAlignment === align.id
                                ? 'bg-burgundy-900 text-gold-200 border-burgundy-900'
                                : 'bg-white text-stone-700 border-stone-300 hover:border-gold-400'
                            }`}
                          >
                            <AlignIcon className="w-3.5 h-3.5" />
                            <span>{align.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Text Vertical Position
                    </label>
                    <select
                      value={bannerForm.textPosition || 'center'}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          textPosition: e.target.value as BannerTextPosition
                        })
                      }
                      className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                    >
                      <option value="top">Top</option>
                      <option value="center">Middle Centered (Recommended)</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Banner Height
                    </label>
                    <select
                      value={bannerForm.bannerHeight || 'standard'}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          bannerHeight: e.target.value as BannerHeightOption
                        })
                      }
                      className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                    >
                      <option value="compact">Compact (3.5:1 Wide)</option>
                      <option value="standard">Standard (3:1 Classic Wide)</option>
                      <option value="tall">Tall Showcase (2.45:1)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Text Color Theme
                    </label>
                    <select
                      value={bannerForm.textColor || 'cream-gold'}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          textColor: e.target.value as BannerTextColor
                        })
                      }
                      className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                    >
                      <option value="cream-gold">Cream & Antique Gold</option>
                      <option value="pure-white">Crisp Pearl White</option>
                      <option value="burgundy-dark">Royal Burgundy (for Light Photos)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      CTA Button Style
                    </label>
                    <select
                      value={bannerForm.buttonStyle || 'gold-outline'}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          buttonStyle: e.target.value as BannerButtonStyle
                        })
                      }
                      className="w-full p-2 border rounded-lg bg-white outline-none focus:border-gold-500"
                    >
                      <option value="gold-outline">Antique Gold Outline Pill</option>
                      <option value="gold-solid">Metallic Gold Solid Fill</option>
                      <option value="burgundy-gold">Burgundy Velvet & Gold Rim</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold uppercase text-stone-700">
                        Overlay Darkness
                      </label>
                      <span className="font-mono font-bold text-burgundy-900">
                        {bannerForm.overlayOpacity ?? 35}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={5}
                      value={bannerForm.overlayOpacity ?? 35}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          overlayOpacity: Number(e.target.value)
                        })
                      }
                      className="w-full accent-burgundy-900"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Display & Schedule Settings */}
              <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="font-serif text-sm font-bold text-burgundy-950">
                  4. Display & Schedule Settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={bannerForm.displayOrder}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, displayOrder: Number(e.target.value) })
                      }
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Schedule Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={toDateInputValue(bannerForm.startDate)}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          startDate: e.target.value ? e.target.value : null
                        })
                      }
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Schedule End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={toDateInputValue(bannerForm.endDate)}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          endDate: e.target.value ? e.target.value : null
                        })
                      }
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={bannerForm.isActive}
                    onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                    className="rounded accent-burgundy-900"
                  />
                  <span className="font-semibold text-stone-800">
                    Active on Public Homepage Carousel
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-burgundy-900 text-gold-200 font-bold hover:bg-burgundy-800 disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingBannerId
                      ? 'Update Promotional Banner'
                      : 'Publish Promotional Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Responsive Preview Modal */}
      {previewModalBanners && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewModalBanners(null);
          }}
        >
          <div className="bg-white rounded-2xl border border-gold-400 w-full max-w-6xl overflow-hidden shadow-2xl animate-modal-enter">
            <div className="bg-brand-maroon-gradient p-4 text-gold-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold-300" />
                <h3 className="font-serif font-bold text-base">{previewModalTitle}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold ${
                    previewViewport === 'desktop'
                      ? 'bg-gold-400 text-burgundy-950'
                      : 'bg-burgundy-900/70 text-gold-200 border border-gold-500/40'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold ${
                    previewViewport === 'mobile'
                      ? 'bg-gold-400 text-burgundy-950'
                      : 'bg-burgundy-900/70 text-gold-200 border border-gold-500/40'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalBanners(null)}
                  className="ml-2 text-gold-300 hover:text-white"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-[#FDFBF5]">
              <div
                className={
                  previewViewport === 'mobile'
                    ? 'max-w-[375px] mx-auto border-2 border-stone-300 rounded-2xl p-2 bg-white shadow-xl'
                    : ''
                }
              >
                <PromotionalBannerCarousel
                  banners={previewModalBanners}
                  forceViewport={previewViewport}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Banner Deletion */}
      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteCandidate(null);
          }}
        >
          <div className="bg-white rounded-2xl border border-gold-400 max-w-md w-full p-6 space-y-4 shadow-2xl animate-modal-enter">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-red-50 text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-burgundy-950">
                  Delete Promotional Banner?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Are you sure you want to remove <strong>“{deleteCandidate.title}”</strong> from Homepage Banners? It will be removed from the public slider immediately.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100 text-xs">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
