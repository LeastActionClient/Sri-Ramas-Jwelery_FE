import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Upload,
  Film,
  Image as ImageIcon,
  Search,
  Loader2,
  ClipboardPaste,
  Copy,
  Check,
  UploadCloud,
  Link as LinkIcon,
  ArrowRight
} from 'lucide-react';
import { cmsApi, BannerAdminPayload } from '@/services/api/cms.api';
import { mediaApi } from '@/services/api/media.api';
import { HeroBanner } from '@/types';
import { PromotionalBannerCarousel } from '@/components/customer/PromotionalBannerCarousel';
import { AdminModalPortal } from './AdminModalPortal';

interface BannerManagementPanelProps {
  onStatusMessage?: (msg: string) => void;
  onErrorMessage?: (err: string) => void;
}

// Exactly 5 simplified fields required by Sri Ramas Jewellery Master Prompt:
// 1. Media upload (Image or Video)
// 2. Button Name (e.g. "Explore Collection")
// 3. Searchable Navigation Destination selector (Pages, Categories, Products)
// 4. Start Date (effective date/time)
// 5. End Date (expiration date/time)
interface SimplifiedBannerFormState {
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaPublicId?: string;
  buttonName: string;
  navigationDestination: string;
  destinationType: 'PAGE' | 'CATEGORY' | 'PRODUCT';
  destinationId?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const STATIC_PAGE_DESTINATIONS = [
  { label: 'Home Page', value: '/' },
  { label: 'Collections Page', value: '/collections' },
  { label: 'Savings Schemes Page', value: '/schemes' },
  { label: 'DigiGold Page', value: '/digigold' },
  { label: 'DigiSilver Page', value: '/digisilver' },
  { label: 'Heritage Page', value: '/heritage' },
  { label: 'Contact Us Page', value: '/contact' }
];

function createEmptyBannerForm(): SimplifiedBannerFormState {
  return {
    mediaUrl: '',
    mediaType: 'IMAGE',
    buttonName: 'Explore Collection',
    navigationDestination: '/collections',
    destinationType: 'PAGE',
    startDate: '',
    endDate: '',
    isActive: true
  };
}

export const BannerManagementPanel: React.FC<BannerManagementPanelProps> = ({
  onStatusMessage,
  onErrorMessage
}) => {
  const queryClient = useQueryClient();
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<SimplifiedBannerFormState>(createEmptyBannerForm);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<HeroBanner | null>(null);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [copiedMedia, setCopiedMedia] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const destinationDropdownRef = useRef<HTMLDivElement | null>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'banners'],
    queryFn: cmsApi.adminGetBanners
  });

  const { data: destinationsData } = useQuery({
    queryKey: ['admin', 'cms', 'destinations', destinationSearch],
    queryFn: () => cmsApi.adminGetBannerDestinations(destinationSearch),
    staleTime: 60000
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        destinationDropdownRef.current &&
        !destinationDropdownRef.current.contains(e.target as Node)
      ) {
        setIsDestinationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showMsg = (msg: string) => {
    setLocalMsg(msg);
    onStatusMessage?.(msg);
    setTimeout(() => setLocalMsg(null), 4000);
  };

  const showErr = (err: string) => {
    setLocalErr(err);
    onErrorMessage?.(err);
    setTimeout(() => setLocalErr(null), 6000);
  };

  const invalidateBanners = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'banners'] });
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    queryClient.invalidateQueries({ queryKey: ['banners'] });
    queryClient.invalidateQueries({ queryKey: ['banners', 'HOME_HERO'] });
    queryClient.invalidateQueries({ queryKey: ['homepage'] });
  };

  const openCreateModal = () => {
    setEditingBannerId(null);
    setLocalErr(null);
    setBannerForm(createEmptyBannerForm());
    setIsEditorOpen(true);
  };

  const openEditModal = (banner: HeroBanner) => {
    setEditingBannerId(banner._id);
    setLocalErr(null);
    const mediaUrl = banner.mediaUrl || banner.desktopImageUrl || banner.imageUrl || '';
    const isVideo = banner.mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);

    setBannerForm({
      mediaUrl,
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
      mediaPublicId: banner.desktopImagePublicId,
      buttonName: banner.buttonName || banner.ctaText || 'Explore Collection',
      navigationDestination: banner.navigationDestination || banner.ctaLink || banner.targetLink || '/collections',
      destinationType: banner.destinationType || 'PAGE',
      destinationId: banner.destinationId,
      startDate: banner.startDate ? banner.startDate.slice(0, 10) : '',
      endDate: banner.endDate ? banner.endDate.slice(0, 10) : '',
      isActive: banner.isActive ?? true
    });
    setIsEditorOpen(true);
  };

  const processMediaFileOrBlob = async (file: File | Blob, originalName?: string) => {
    setUploadingMedia(true);
    setLocalErr(null);

    try {
      const isVideo = file.type.startsWith('video/') || (originalName && /\.(mp4|webm|mov)$/i.test(originalName));
      const isImage = file.type.startsWith('image/') || (originalName && /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(originalName));

      if (!isVideo && !isImage) {
        throw new Error('Only image (PNG, JPG, WEBP) and video (MP4, WEBM) files are supported.');
      }

      const uploaded = await mediaApi.uploadImageToCloudinary(
        file,
        'banners',
        originalName || 'banner-media'
      );

      setBannerForm((prev) => ({
        ...prev,
        mediaUrl: uploaded.secureUrl,
        mediaPublicId: uploaded.publicId,
        mediaType: isVideo ? 'VIDEO' : 'IMAGE'
      }));
      showMsg('Media asset uploaded to Cloudinary successfully.');
    } catch (err: any) {
      showErr(err.message || 'Failed to upload media file.');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processMediaFileOrBlob(file, file.name);
  };

  const handlePasteMediaFromClipboard = async () => {
    if (!navigator.clipboard) {
      showMsg('Press Ctrl+V to paste your copied image or media link.');
      return;
    }

    try {
      if (typeof navigator.clipboard.read === 'function') {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const mediaType = item.types.find((t) => t.startsWith('image/') || t.startsWith('video/'));
            if (mediaType) {
              const blob = await item.getType(mediaType);
              if (blob) {
                await processMediaFileOrBlob(blob, 'pasted-media');
                return;
              }
            }
          }

          // Check for HTML or plain text image link
          for (const item of items) {
            if (item.types.includes('text/plain')) {
              const textBlob = await item.getType('text/plain');
              const text = (await textBlob.text()).trim();
              if (/^https?:\/\//i.test(text) || text.startsWith('data:')) {
                const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(text);
                setBannerForm((prev) => ({
                  ...prev,
                  mediaUrl: text,
                  mediaType: isVideo ? 'VIDEO' : 'IMAGE'
                }));
                showMsg('Media URL pasted from clipboard.');
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
          setBannerForm((prev) => ({
            ...prev,
            mediaUrl: text,
            mediaType: isVideo ? 'VIDEO' : 'IMAGE'
          }));
          showMsg('Media URL pasted from clipboard.');
          return;
        }
      }

      showErr('No image or video found in clipboard. Copy an image (Right-click → Copy image or Win+Shift+S), then press Ctrl+V or click Paste Media.');
    } catch {
      showErr('Clipboard access was blocked. Click inside the form and press Ctrl+V to paste.');
    }
  };

  const handleCopyMediaLink = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!bannerForm.mediaUrl) return;
    try {
      await navigator.clipboard.writeText(bannerForm.mediaUrl);
      setCopiedMedia(true);
      showMsg('Media URL copied to clipboard.');
      setTimeout(() => setCopiedMedia(false), 2000);
    } catch {
      showErr('Unable to copy media URL to clipboard.');
    }
  };

  const handleRemoveMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerForm((prev) => ({ ...prev, mediaUrl: '', mediaPublicId: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMedia(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMedia(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMedia(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processMediaFileOrBlob(file, file.name);
    }
  };

  // Window-level Ctrl+V listener while banner editor modal is open
  useEffect(() => {
    if (!isEditorOpen) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)
      ) {
        return;
      }

      const items = Array.from(e.clipboardData?.items || []);
      for (const item of items) {
        if (item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/'))) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processMediaFileOrBlob(file, file.name || 'clipboard-media');
            return;
          }
        }
      }

      const text = e.clipboardData?.getData('text')?.trim();
      if (text && (/^https?:\/\//i.test(text) || text.startsWith('data:'))) {
        e.preventDefault();
        const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(text);
        setBannerForm((prev) => ({
          ...prev,
          mediaUrl: text,
          mediaType: isVideo ? 'VIDEO' : 'IMAGE'
        }));
        showMsg('Media link pasted from clipboard.');
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [isEditorOpen]);

  const handleSelectDestination = (item: { label: string; value: string }, type: 'PAGE' | 'CATEGORY' | 'PRODUCT', id?: string) => {
    setBannerForm((prev) => ({
      ...prev,
      navigationDestination: item.value,
      destinationType: type,
      destinationId: id
    }));
    setIsDestinationOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setLocalErr(null);

    try {
      if (!bannerForm.mediaUrl.trim()) {
        throw new Error('Please upload an image or video, or provide a media URL.');
      }
      if (!bannerForm.buttonName.trim()) {
        throw new Error('Button name is required.');
      }
      if (!bannerForm.navigationDestination.trim()) {
        throw new Error('Please select a navigation destination.');
      }

      if (bannerForm.startDate && bannerForm.endDate) {
        if (new Date(bannerForm.endDate) < new Date(bannerForm.startDate)) {
          throw new Error('End date cannot be earlier than start date.');
        }
      }

      const payload: Partial<BannerAdminPayload> = {
        title: bannerForm.buttonName.trim(),
        desktopImageUrl: bannerForm.mediaUrl.trim(),
        desktopImagePublicId: bannerForm.mediaPublicId?.trim() || undefined,
        mediaUrl: bannerForm.mediaUrl.trim(),
        mediaType: bannerForm.mediaType,
        buttonName: bannerForm.buttonName.trim(),
        ctaText: bannerForm.buttonName.trim(),
        navigationDestination: bannerForm.navigationDestination.trim(),
        ctaLink: bannerForm.navigationDestination.trim(),
        destinationType: bannerForm.destinationType,
        destinationId: bannerForm.destinationId,
        startDate: bannerForm.startDate ? new Date(bannerForm.startDate).toISOString() : null,
        endDate: bannerForm.endDate ? new Date(bannerForm.endDate).toISOString() : null,
        isActive: bannerForm.isActive,
        position: 'HOME_HERO',
        contentMode: 'layered'
      };

      if (editingBannerId) {
        await cmsApi.adminUpdateBanner(editingBannerId, payload);
        showMsg('Homepage banner updated successfully.');
      } else {
        await cmsApi.adminCreateBanner(payload);
        showMsg('New homepage banner published successfully.');
      }

      invalidateBanners();
      setIsEditorOpen(false);
    } catch (err: any) {
      showErr(err.message || 'Failed to save promotional banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (banner: HeroBanner) => {
    try {
      await cmsApi.adminUpdateBannerStatus(banner._id, !banner.isActive);
      showMsg(`Banner visibility switched to ${!banner.isActive ? 'Active' : 'Hidden'}.`);
      invalidateBanners();
    } catch (err: any) {
      showErr(err?.message || 'Failed to toggle banner status.');
    }
  };

  const handleDelete = async (banner: HeroBanner) => {
    if (!window.confirm(`Delete banner "${banner.buttonName || banner.title}"?`)) return;
    try {
      await cmsApi.adminDeleteBanner(banner._id);
      showMsg('Banner deleted successfully.');
      invalidateBanners();
    } catch (err: any) {
      showErr(err?.message || 'Failed to delete banner.');
    }
  };

  const livePreviewBanner: HeroBanner = useMemo(() => {
    return {
      _id: editingBannerId || 'preview',
      title: bannerForm.buttonName || 'Explore Collection',
      desktopImageUrl: bannerForm.mediaUrl,
      imageUrl: bannerForm.mediaUrl,
      mediaUrl: bannerForm.mediaUrl,
      mediaType: bannerForm.mediaType,
      buttonName: bannerForm.buttonName,
      ctaText: bannerForm.buttonName,
      navigationDestination: bannerForm.navigationDestination,
      ctaLink: bannerForm.navigationDestination,
      destinationType: bannerForm.destinationType,
      position: 'HOME_HERO',
      contentMode: 'layered',
      textAlignment: 'right',
      displayOrder: 0,
      sortOrder: 0,
      isActive: bannerForm.isActive,
      startDate: bannerForm.startDate || null,
      endDate: bannerForm.endDate || null
    };
  }, [bannerForm, editingBannerId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-burgundy-950">
            Homepage Promotional Banners
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your high-impact promotional carousel, multi-media artwork, and searchable destinations.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Add Promotional Banner</span>
        </button>
      </div>

      {localMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{localMsg}</span>
          </div>
          <button type="button" onClick={() => setLocalMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {localErr && (
        <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{localErr}</span>
          </div>
          <button type="button" onClick={() => setLocalErr(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banners Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Media</th>
                <th className="p-4">Button &amp; Destination</th>
                <th className="p-4">Schedule Period</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    Loading promotional banners...
                  </td>
                </tr>
              ) : banners.length > 0 ? (
                banners.map((b) => {
                  const mediaUrl = b.mediaUrl || b.desktopImageUrl || b.imageUrl || '';
                  const isVideo = b.mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);
                  return (
                    <tr key={b._id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-16 h-10 rounded-lg bg-[#3A060E] overflow-hidden shrink-0 border border-gold-400/50 relative">
                          {isVideo ? (
                            <div className="w-full h-full flex items-center justify-center bg-black/40 text-gold-300">
                              <Film className="w-4 h-4" />
                            </div>
                          ) : mediaUrl ? (
                            <img
                              src={mediaUrl}
                              alt={b.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/70 text-white text-[8px] font-bold rounded">
                            {isVideo ? 'VIDEO' : 'IMAGE'}
                          </span>
                        </div>
                        <div>
                          <div className="font-serif font-bold text-sm text-burgundy-950">
                            {b.buttonName || b.ctaText || b.title}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {b.destinationType || 'PAGE'}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-stone-700">
                        <div className="font-semibold text-burgundy-900">
                          {b.buttonName || b.ctaText || 'Explore Collection'}
                        </div>
                        <div className="font-mono text-[11px] text-stone-500 truncate max-w-xs">
                          {b.navigationDestination || b.ctaLink || b.targetLink || '/'}
                        </div>
                      </td>

                      <td className="p-4 text-stone-600">
                        {b.startDate || b.endDate ? (
                          <div className="space-y-0.5 text-[11px] font-mono">
                            {b.startDate && <div>From: {b.startDate.slice(0, 10)}</div>}
                            {b.endDate && <div>To: {b.endDate.slice(0, 10)}</div>}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Always Active</span>
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(b)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                            b.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {b.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{b.isActive ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewBanner(b)}
                          className="p-1.5 rounded-lg border border-gold-300/70 hover:bg-gold-50 text-burgundy-900"
                          title="Preview banner"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                          title="Edit banner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                          title="Delete banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    No promotional banners configured yet. Click "Add Promotional Banner" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile App-Style Banner Cards */}
        <div className="block md:hidden p-3.5 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              Loading promotional banners...
            </div>
          ) : banners.length > 0 ? (
            banners.map((b) => {
              const mediaUrl = b.mediaUrl || b.desktopImageUrl || b.imageUrl || '';
              const isVideo = b.mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);

              return (
                <div
                  key={b._id}
                  className="bg-[#FCFAF6] border border-stone-200/90 rounded-xl p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-12 rounded-lg bg-[#3A060E] overflow-hidden shrink-0 border border-gold-400/50 relative">
                      {isVideo ? (
                        <div className="w-full h-full flex items-center justify-center bg-black/40 text-gold-300">
                          <Film className="w-5 h-5" />
                        </div>
                      ) : mediaUrl ? (
                        <img
                          src={mediaUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/75 text-white text-[8px] font-bold rounded">
                        {isVideo ? 'VIDEO' : 'IMAGE'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-serif font-bold text-sm text-burgundy-950 truncate">
                          {b.buttonName || b.ctaText || b.title}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 text-[9px] font-mono font-bold text-stone-600 uppercase shrink-0">
                          {b.destinationType || 'PAGE'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-stone-500 truncate mt-1">
                        ↳ {b.navigationDestination || b.ctaLink || b.targetLink || '/'}
                      </div>

                      <div className="text-[10px] text-stone-500 font-mono mt-1">
                        {b.startDate || b.endDate ? (
                          <span>
                            {b.startDate ? b.startDate.slice(0, 10) : 'Start'} to {b.endDate ? b.endDate.slice(0, 10) : 'End'}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Always Active</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Footer */}
                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(b)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        b.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {b.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{b.isActive ? 'Active' : 'Hidden'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewBanner(b)}
                        className="p-1.5 rounded-lg border border-gold-300/70 hover:bg-gold-50 text-burgundy-900"
                        title="Preview banner"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                        title="Edit banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b)}
                        className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                        title="Delete banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-stone-400 text-xs">
              No promotional banners configured yet.
            </div>
          )}
        </div>
      </div>

      {/* Simplified 5-Field Banner Editor Modal */}
      {isEditorOpen && (
        <AdminModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-2 sm:p-6 overflow-y-auto bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gold-500/40 overflow-hidden my-2 sm:my-4 max-h-[94vh] flex flex-col animate-modal-enter overflow-x-hidden min-w-0">
            <div className="bg-burgundy-900 text-gold-100 p-3.5 sm:p-5 border-b border-gold-600/40 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-gold-100 truncate">
                  {editingBannerId ? 'Edit Promotional Banner' : 'Create Promotional Banner'}
                </h3>
                <p className="text-[10.5px] sm:text-[11px] text-gold-300/80 line-clamp-1 sm:line-clamp-none">
                  Fill in the 5 required fields below. Saved changes update MongoDB and sync with the public homepage carousel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-gold-300 hover:text-white p-1 rounded-lg shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-w-0 w-full max-w-full">
              <div className="p-3 sm:p-6 overflow-y-auto overflow-x-hidden space-y-3.5 sm:space-y-4 text-xs w-full max-w-full min-w-0">
                {localErr && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{localErr}</span>
                  </div>
                )}

                {/* 1. Media Upload (Image or Video) with Full Copy & Paste */}
                <div className="space-y-3 rounded-xl border border-gold-300/80 bg-[#FAF7F0] p-2.5 sm:p-4 shadow-sm w-full max-w-full min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="font-semibold uppercase text-stone-800 text-[11px] sm:text-xs tracking-wider">
                      1. Media Upload (Image or Video) *
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {bannerForm.mediaUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveMedia}
                          className="text-[10.5px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-red-50 border border-red-200"
                          title="Cancel uploaded media and remove"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handlePasteMediaFromClipboard}
                        className="text-[10.5px] text-gold-700 hover:text-burgundy-900 font-bold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-amber-50 border border-gold-300"
                        title="Paste copied image or video from clipboard (Ctrl+V)"
                      >
                        <ClipboardPaste className="w-3 h-3 text-gold-600" />
                        <span>Paste Media</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-[10.5px] text-stone-600 hover:text-stone-800 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-stone-200"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>{showUrlInput ? 'Hide URL' : 'Paste URL'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,video/mp4,video/webm"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {/* Dropzone & Paste Area */}
                  {!bannerForm.mediaUrl ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                        isDraggingMedia
                          ? 'border-gold-500 bg-gold-50/70 ring-2 ring-gold-400/40'
                          : 'border-stone-300 hover:border-gold-400 bg-white/70 hover:bg-gold-50/30'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gold-100/70 border border-gold-300 flex items-center justify-center text-burgundy-900">
                        {uploadingMedia ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>

                      <div className="text-xs text-stone-700">
                        <span className="font-bold text-burgundy-950">Drag & drop image or video here</span>,{' '}
                        <span className="text-gold-700 underline font-semibold">Browse</span>, or press{' '}
                        <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px] font-mono">
                          Ctrl+V
                        </kbd>
                      </div>

                      <p className="text-[11px] text-stone-500">
                        Supports PNG, JPG, WEBP, or MP4/WEBM video (up to 50MB) to Cloudinary
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                        {uploadingMedia ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadingMedia(false);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-red-600" />
                            <span>Cancel Upload</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-burgundy-900 text-gold-200 rounded-lg text-xs font-bold hover:bg-burgundy-800 shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5 text-gold-400" />
                              <span>Browse File</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePasteMediaFromClipboard();
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gold-300 rounded-lg text-xs font-bold text-burgundy-950 hover:bg-gold-50 shadow-sm transition-colors"
                            >
                              <ClipboardPaste className="w-3.5 h-3.5 text-gold-600" />
                              <span>Paste Copied Media</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Media Preview Card with Overlay Controls & Live Bottom-Right CTA */
                    <div className="space-y-2 w-full max-w-full min-w-0">
                      <div className="relative rounded-xl border border-gold-400/70 overflow-hidden bg-[#140204] aspect-[16/9] sm:aspect-[2/1] min-h-[160px] max-h-72 flex items-center justify-center group shadow-md select-none w-full max-w-full">
                        {/* Ambient blurred backdrop */}
                        {bannerForm.mediaType !== 'VIDEO' && bannerForm.mediaUrl && (
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <img
                              src={bannerForm.mediaUrl}
                              alt=""
                              aria-hidden="true"
                              className="w-full h-full object-cover scale-125 blur-xl opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#140204]/75 via-transparent to-[#140204]/40" />
                          </div>
                        )}

                        {bannerForm.mediaType === 'VIDEO' ? (
                          <video
                            src={bannerForm.mediaUrl}
                            className="relative z-10 w-full h-full max-w-full object-contain object-center"
                            controls
                            playsInline
                            muted
                          />
                        ) : (
                          <img
                            src={bannerForm.mediaUrl}
                            alt="Banner media preview"
                            className="relative z-10 w-full h-full max-w-full object-contain object-center drop-shadow-md"
                          />
                        )}

                        {/* Live Bottom-Right CTA Button Preview - positioned safely above video scrubber controls */}
                        {bannerForm.buttonName && (
                          <div className="absolute right-2 bottom-10 sm:right-3.5 sm:bottom-3.5 z-20 pointer-events-none max-w-[65%]">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full font-serif font-bold text-[10px] sm:text-xs uppercase tracking-wider bg-brand-maroon-gradient text-gold-100 border border-gold-400 shadow-xl truncate">
                              <span className="truncate">{bannerForm.buttonName}</span>
                              <ArrowRight className="w-3 h-3 text-gold-300 shrink-0" />
                            </div>
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 max-w-[55%]">
                          <span className="px-1.5 py-0.5 rounded bg-black/75 text-white text-[9.5px] font-bold uppercase tracking-wider backdrop-blur-sm shrink-0">
                            {bannerForm.mediaType}
                          </span>
                          {bannerForm.mediaPublicId && (
                            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-200 text-[9.5px] font-mono backdrop-blur-sm truncate">
                              Cloudinary: {bannerForm.mediaPublicId.split('/').pop()}
                            </span>
                          )}
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 p-1 rounded-lg backdrop-blur-sm z-30">
                          <button
                            type="button"
                            onClick={handleCopyMediaLink}
                            className="p-1 rounded text-white/90 hover:text-white hover:bg-white/20 transition-colors"
                            title="Copy Media URL"
                          >
                            {copiedMedia ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={handlePasteMediaFromClipboard}
                            className="p-1 rounded text-white/90 hover:text-white hover:bg-white/20 transition-colors"
                            title="Paste New Media from Clipboard (Ctrl+V)"
                          >
                            <ClipboardPaste className="w-3 h-3 text-gold-300" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1 rounded text-white/90 hover:text-white hover:bg-white/20 transition-colors"
                            title="Browse to Replace"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveMedia}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-600/90 hover:bg-red-700 text-white text-[10px] font-semibold transition-colors shadow-sm"
                            title="Cancel / Remove Media"
                          >
                            <X className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Explicit Media Action Toolbar with Cancel Button - Responsive 2x2 grid on mobile */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 sm:p-2 rounded-xl bg-stone-50 border border-stone-200 w-full max-w-full min-w-0">
                        <button
                          type="button"
                          onClick={handleRemoveMedia}
                          className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                          title="Cancel uploaded media and remove"
                        >
                          <X className="w-3 h-3 text-red-600 shrink-0" />
                          <span className="truncate">Remove Media</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs"
                          title="Replace with another file"
                        >
                          <Upload className="w-3 h-3 text-stone-500 shrink-0" />
                          <span className="truncate">Replace File</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyMediaLink}
                          className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 rounded-lg text-[11px] font-medium transition-colors shadow-2xs"
                        >
                          {copiedMedia ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <Copy className="w-3 h-3 text-stone-500 shrink-0" />}
                          <span className="truncate">{copiedMedia ? 'Copied' : 'Copy URL'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handlePasteMediaFromClipboard}
                          className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white text-burgundy-950 hover:bg-gold-50 border border-gold-300 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs"
                        >
                          <ClipboardPaste className="w-3 h-3 text-gold-600 shrink-0" />
                          <span className="truncate">Paste Media</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Direct URL Input Bar - fully responsive */}
                  {(showUrlInput || !bannerForm.mediaUrl) && (
                    <div className="pt-1 flex flex-col gap-1.5 w-full min-w-0">
                      <div className="flex gap-1.5 w-full min-w-0">
                        <select
                          value={bannerForm.mediaType}
                          onChange={(e) =>
                            setBannerForm((prev) => ({
                              ...prev,
                              mediaType: e.target.value as 'IMAGE' | 'VIDEO'
                            }))
                          }
                          className="px-2 py-1.5 border border-stone-300 rounded-lg bg-white text-xs outline-none focus:border-gold-500 shrink-0 font-medium"
                        >
                          <option value="IMAGE">Image URL</option>
                          <option value="VIDEO">Video URL</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Or paste media URL (e.g. https://...)"
                          value={bannerForm.mediaUrl}
                          onChange={(e) =>
                            setBannerForm((prev) => ({ ...prev, mediaUrl: e.target.value }))
                          }
                          className="flex-1 min-w-0 p-1.5 border border-stone-300 rounded-lg text-xs bg-white outline-none focus:border-gold-500 font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={handlePasteMediaFromClipboard}
                          className="px-2.5 py-1 border border-gold-300 bg-gold-50 text-burgundy-900 rounded-lg text-xs font-semibold hover:bg-gold-100 flex items-center gap-1 shrink-0"
                          title="Paste from clipboard"
                        >
                          <ClipboardPaste className="w-3 h-3 text-gold-700" />
                          <span>Paste from Clipboard</span>
                        </button>
                        {showUrlInput && (
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(false)}
                            className="px-2.5 py-1 border border-stone-300 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-200 flex items-center gap-1 shrink-0 transition-colors"
                            title="Cancel URL input"
                          >
                            <X className="w-3 h-3 text-stone-500" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Button Name */}
                <div className="w-full min-w-0">
                  <label className="block font-semibold uppercase text-stone-700 mb-1 text-[11px] sm:text-xs">
                    2. Button Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.buttonName}
                    onChange={(e) =>
                      setBannerForm((prev) => ({ ...prev, buttonName: e.target.value }))
                    }
                    placeholder="e.g. Explore Collection, View Bridal Jewellery, Join Scheme"
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 text-xs"
                  />
                </div>

                {/* 3. Searchable Navigation Destination */}
                <div ref={destinationDropdownRef} className="relative w-full min-w-0">
                  <label className="block font-semibold uppercase text-stone-700 mb-1 text-[11px] sm:text-xs">
                    3. Searchable Navigation Destination *
                  </label>
                  <div
                    onClick={() => setIsDestinationOpen(true)}
                    className="w-full p-2.5 border border-stone-300 rounded-lg bg-white flex items-center justify-between cursor-pointer hover:border-gold-500 min-w-0"
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-burgundy-100 text-burgundy-900 text-[10px] font-bold shrink-0">
                        {bannerForm.destinationType}
                      </span>
                      <span className="font-mono text-stone-800 text-xs truncate">
                        {bannerForm.navigationDestination || 'Select destination...'}
                      </span>
                    </div>
                    <Search className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
                  </div>

                  {/* Dropdown with Search & Categorized Groups */}
                  {isDestinationOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gold-400 rounded-xl shadow-2xl max-h-72 overflow-hidden flex flex-col animate-fade-in">
                      <div className="p-2 border-b border-stone-200 bg-stone-50">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search Pages, Categories, Products..."
                            value={destinationSearch}
                            onChange={(e) => setDestinationSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-gold-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="p-2 overflow-y-auto space-y-3 divide-y divide-stone-100 text-xs">
                        {/* Group 1: Static Public Pages */}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">
                            Public Pages
                          </div>
                          <div className="space-y-0.5">
                            {(destinationsData?.pages || STATIC_PAGE_DESTINATIONS).map((p) => (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => handleSelectDestination(p, 'PAGE')}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gold-50 flex items-center justify-between transition-colors"
                              >
                                <span>{p.label}</span>
                                <span className="font-mono text-[10px] text-stone-400">{p.value}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Group 2: Categories */}
                        <div className="pt-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">
                            Jewellery Categories
                          </div>
                          <div className="space-y-0.5 max-h-36 overflow-y-auto">
                            {(destinationsData?.categories || []).length > 0 ? (
                              destinationsData?.categories.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectDestination(c, 'CATEGORY', c.id)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gold-50 flex items-center justify-between transition-colors"
                                >
                                  <span className="font-medium text-burgundy-950">{c.label}</span>
                                  <span className="font-mono text-[10px] text-stone-400 truncate max-w-[140px]">
                                    {c.value}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-2 py-1 text-stone-400 italic text-[11px]">
                                No matching categories
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Group 3: Products */}
                        <div className="pt-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">
                            Jewellery Products
                          </div>
                          <div className="space-y-0.5 max-h-36 overflow-y-auto">
                            {(destinationsData?.products || []).length > 0 ? (
                              destinationsData?.products.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleSelectDestination(p, 'PRODUCT', p.id)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gold-50 flex items-center justify-between transition-colors"
                                >
                                  <span className="font-medium text-burgundy-950 truncate max-w-[200px]">
                                    {p.label}
                                  </span>
                                  <span className="font-mono text-[10px] text-stone-400 truncate max-w-[140px]">
                                    {p.value}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-2 py-1 text-stone-400 italic text-[11px]">
                                No matching products
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Start Date & 5. End Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      4. Schedule Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={bannerForm.startDate}
                      onChange={(e) =>
                        setBannerForm((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      5. Schedule End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={bannerForm.endDate}
                      onChange={(e) =>
                        setBannerForm((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* Published / Active Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={bannerForm.isActive}
                    onChange={(e) =>
                      setBannerForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-burgundy-900"
                  />
                  <span className="font-semibold text-stone-700">
                    Active on Public Homepage Carousel
                  </span>
                </label>

                {/* Live Banner Preview */}
                <div className="space-y-2 pt-2 border-t border-stone-200 overflow-hidden w-full max-w-full min-w-0">
                  <span className="block font-bold uppercase tracking-wider text-stone-500 text-[10px]">
                    Live Storefront Banner Preview
                  </span>
                  <PromotionalBannerCarousel
                    banners={[livePreviewBanner]}
                    className="w-full max-w-full relative overflow-hidden h-36 sm:h-52 rounded-xl bg-[#140204] select-none m-0 p-0"
                  />
                </div>
              </div>

              <div className="p-3 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2 sm:gap-3 shrink-0 w-full">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !bannerForm.mediaUrl || !bannerForm.buttonName}
                  className="flex-1 sm:flex-initial px-5 py-2 bg-burgundy-900 text-gold-200 rounded-lg text-xs font-bold shadow-md hover:bg-burgundy-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingBannerId ? 'Save Changes' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminModalPortal>
      )}

      {/* Standalone Row Preview Modal */}
      {previewBanner && (
        <AdminModalPortal>
          <div
            className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewBanner(null);
            }}
          >
            <div className="bg-white rounded-2xl border border-gold-400 w-full max-w-5xl overflow-hidden shadow-2xl p-4 space-y-3 animate-modal-enter">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-burgundy-950 text-base">
                  Promotional Banner Preview
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewBanner(null)}
                  className="text-stone-600 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden aspect-[2.1/1] max-h-[50vh] bg-[#140204]">
                <PromotionalBannerCarousel
                  banners={[previewBanner]}
                  className="w-full h-full relative overflow-hidden bg-[#140204] select-none m-0 p-0 group/carousel"
                />
              </div>
            </div>
          </div>
        </AdminModalPortal>
      )}
    </div>
  );
};