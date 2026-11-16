import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  UploadCloud,
  Images,
  X,
  Check,
  Copy,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  buildClientStudioPrompt,
  mediaApi,
  METAL_STUDIO_SPECS,
  resolveClientMetalType,
  STUDIO_METAL_TYPES,
  StudioMediaAsset,
  StudioMetalType,
} from '@/services/api/media.api';
import { AdminModalPortal } from './AdminModalPortal';
import { ImageDropzone } from './ImageDropzone';
import { Product } from '@/types';

const METAL_BADGE_CLASSES: Record<StudioMetalType, string> = {
  GOLD: 'bg-amber-950/90 text-gold-200 border border-gold-400/50',
  SILVER: 'bg-slate-800/90 text-slate-100 border border-slate-300/50',
  DIAMOND: 'bg-sky-950/90 text-sky-100 border border-sky-300/60',
  PLATINUM: 'bg-zinc-900/90 text-zinc-100 border border-zinc-400/60',
};

interface ProductStudioMediaModalProps {
  product: Product;
  onClose: () => void;
  onImageKept?: (result: { secureUrl: string; publicId: string; updatedProduct?: any }) => void;
}

type StudioTab = 'generate' | 'upload' | 'library';

export const ProductStudioMediaModal: React.FC<ProductStudioMediaModalProps> = ({
  product,
  onClose,
  onImageKept,
}) => {
  const queryClient = useQueryClient();
  const initialProductMetal = useMemo(
    () =>
      resolveClientMetalType(
        product.metal?.metalType || product.metalType,
        `${product.metal?.purity || product.purity || ''} ${product.title || product.name || ''} ${product.category?.name || ''}`
      ),
    [product]
  );

  const [activeTab, setActiveTab] = useState<StudioTab>('generate');
  const [backgroundStyle, setBackgroundStyle] = useState<'burgundy-velvet' | 'ivory-silk'>(
    'burgundy-velvet'
  );
  const [selectedMetalType, setSelectedMetalType] = useState<StudioMetalType>(initialProductMetal);
  const [libraryMetalFilter, setLibraryMetalFilter] = useState<'ALL' | StudioMetalType>('ALL');
  const uploadedPublicIdRef = useRef<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>(() =>
    buildClientStudioPrompt({
      productName: product.title || product.name || '',
      categoryName: product.category?.name,
      metalType: initialProductMetal,
      purity: product.metal?.purity || product.purity,
      description: product.description,
      backgroundStyle: 'burgundy-velvet',
    })
  );
  const [keepGallery, setKeepGallery] = useState(false);
  const [providerChoice, setProviderChoice] = useState<'auto' | 'gemini' | 'openai'>('auto');
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [keyProvider, setKeyProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [attachingUrl, setAttachingUrl] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const { data: libraryData, isLoading: loadingLibrary, refetch: refetchLibrary } = useQuery({
    queryKey: ['admin-media-library', 'products'],
    queryFn: () => mediaApi.listMedia('products'),
  });

  const studioStatus = libraryData?.status;
  const assets = useMemo(() => libraryData?.assets || [], [libraryData?.assets]);

  const getAssetMetal = (asset: StudioMediaAsset): StudioMetalType =>
    asset.metalType || resolveClientMetalType(undefined, `${asset.altText || ''} ${asset.publicId}`);

  const metalCounts = useMemo(() => {
    const counts: Record<StudioMetalType, number> = {
      GOLD: 0,
      SILVER: 0,
      DIAMOND: 0,
      PLATINUM: 0,
    };
    for (const asset of assets) {
      counts[getAssetMetal(asset)] += 1;
    }
    return counts;
  }, [assets]);

  const filteredLibraryAssets = useMemo(() => {
    if (libraryMetalFilter === 'ALL') return assets;
    return assets.filter((asset) => getAssetMetal(asset) === libraryMetalFilter);
  }, [assets, libraryMetalFilter]);

  const currentImages = useMemo(
    () => (product.images || []).map((img) => img.url).filter(Boolean),
    [product.images]
  );
  const [latestUrl, setLatestUrl] = useState<string>(currentImages[0] || '');

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['homepage'] });
    queryClient.invalidateQueries({ queryKey: ['admin-media-library'] });
  };

  const handleResetPrompt = (
    style: 'burgundy-velvet' | 'ivory-silk',
    metalOverride: StudioMetalType = selectedMetalType
  ) => {
    setBackgroundStyle(style);
    setSelectedMetalType(metalOverride);
    const matchingPurity =
      metalOverride === initialProductMetal
        ? product.metal?.purity || product.purity
        : METAL_STUDIO_SPECS[metalOverride].defaultMetalDesc;
    setCustomPrompt(
      buildClientStudioPrompt({
        productName: product.title || product.name || '',
        categoryName: product.category?.name,
        metalType: metalOverride,
        purity: matchingPurity,
        description: product.description,
        backgroundStyle: style,
      })
    );
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(customPrompt);
      setCopiedPrompt(true);
      setStatusBanner({
        type: 'info',
        message: 'Studio prompt copied. You can paste a generated image straight back in the Upload tab via Ctrl+V.',
      });
      window.setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      setStatusBanner({ type: 'error', message: 'Could not access clipboard for prompt copy.' });
    }
  };

  const handleSaveProviderKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setStatusBanner(null);

    try {
      await mediaApi.saveAiConfig({
        provider: keyProvider,
        apiKey: apiKeyInput.trim(),
        isEnabled: true,
      });
      setApiKeyInput('');
      setShowKeySetup(false);
      setStatusBanner({
        type: 'success',
        message: `${keyProvider === 'gemini' ? 'Gemini' : 'OpenAI'} AI key encrypted and saved in server settings.`,
      });
      await refetchLibrary();
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.response?.data?.error?.message || err?.message || 'Failed to save API key.',
      });
    } finally {
      setSavingKey(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setStatusBanner(null);

    try {
      const hasValidProductId = /^[0-9a-fA-F]{24}$/.test(product._id || '');
      const matchingPurity =
        selectedMetalType === initialProductMetal
          ? product.metal?.purity || product.purity
          : METAL_STUDIO_SPECS[selectedMetalType].defaultMetalDesc;
      const result = await mediaApi.generateProductImage({
        productId: hasValidProductId ? product._id : undefined,
        productName: product.title || product.name || 'Jewellery Piece',
        sku: product.sku,
        categoryName: product.category?.name,
        metalType: selectedMetalType,
        purity: matchingPurity,
        description: product.description,
        customPrompt: customPrompt.trim(),
        backgroundStyle,
        provider: providerChoice,
        saveToProduct: hasValidProductId,
        keepExistingImages: keepGallery,
      });

      setLatestUrl(result.secureUrl);
      setStatusBanner({
        type: 'success',
        message: `Generated via ${result.providerUsed} (${result.modelUsed}) and kept in studio storage.`,
      });
      invalidateAll();
      onImageKept?.({
        secureUrl: result.secureUrl,
        publicId: result.publicId,
        updatedProduct: result.product,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Unable to generate product studio image.';
      const isUnconfigured =
        msg.includes('AI image generation key is not configured') ||
        err?.response?.data?.error?.details?.some?.(
          (d: any) => d.code === 'AI_PROVIDER_UNCONFIGURED'
        );

      if (isUnconfigured) {
        setShowKeySetup(true);
      }
      setStatusBanner({
        type: 'error',
        message: msg,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleAttachAsset = async (asset: StudioMediaAsset) => {
    const hasValidProductId = /^[0-9a-fA-F]{24}$/.test(product._id || '');
    if (!hasValidProductId) {
      onImageKept?.({ secureUrl: asset.secureUrl, publicId: asset.publicId });
      setLatestUrl(asset.secureUrl);
      setStatusBanner({
        type: 'success',
        message: 'Studio image selected for this product form. Click Save to persist.',
      });
      return;
    }

    setAttachingUrl(asset.secureUrl);
    setStatusBanner(null);

    try {
      const updated = await mediaApi.attachMediaToProduct({
        productId: product._id,
        secureUrl: asset.secureUrl,
        publicId: asset.publicId,
        keepExistingImages: keepGallery,
      });
      setLatestUrl(asset.secureUrl);
      setStatusBanner({
        type: 'success',
        message: `Attached and kept "${asset.altText || asset.publicId}" on ${product.sku}.`,
      });
      invalidateAll();
      onImageKept?.({
        secureUrl: asset.secureUrl,
        publicId: asset.publicId,
        updatedProduct: updated,
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.response?.data?.error?.message || 'Failed to attach image to product.',
      });
    } finally {
      setAttachingUrl(null);
    }
  };

  const handleDeleteAsset = async (asset: StudioMediaAsset) => {
    if (!asset._id) return;
    if (!window.confirm(`Delete saved asset "${asset.altText || asset.publicId}" from Media Library?`)) {
      return;
    }

    try {
      await mediaApi.deleteMedia(asset._id);
      setStatusBanner({ type: 'info', message: 'Media asset removed from library.' });
      await refetchLibrary();
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.response?.data?.error?.message || 'Failed to remove media asset.',
      });
    }
  };

  return (
    <AdminModalPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
      <div className="bg-white rounded-2xl border border-gold-400 w-full max-w-4xl overflow-hidden shadow-2xl my-6 max-h-[92vh] flex flex-col animate-modal-enter">
        {/* Header */}
        <div className="bg-brand-maroon-gradient p-5 text-gold-100 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin Jewellery Photography Studio</span>
            </div>
            <h2 className="font-serif font-bold text-lg text-white truncate mt-0.5">
              {product.title || product.name} ({product.sku})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gold-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close studio media modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage & AI Status Bar */}
        <div className="bg-[#FAF5EB] border-b border-gold-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              {studioStatus?.cloudinaryConfigured
                ? 'Cloudinary CDN Connected'
                : 'Persistent Backend Storage Active (/uploads)'}
            </span>
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full ${
                studioStatus?.aiImageGenerationConfigured
                  ? 'text-burgundy-900 bg-gold-200/80'
                  : 'text-amber-800 bg-amber-100'
              }`}
            >
              <KeyRound className="w-3 h-3" />
              {studioStatus?.aiImageGenerationConfigured
                ? `AI Generator Ready (${
                    [
                      studioStatus.geminiConfigured && 'Gemini',
                      studioStatus.openaiConfigured && 'OpenAI',
                    ]
                      .filter(Boolean)
                      .join(' & ')
                  })`
                : 'AI Key Optional — Not Configured'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowKeySetup((prev) => !prev)}
            className="text-burgundy-900 font-bold hover:text-gold-700 underline underline-offset-2"
          >
            {showKeySetup ? 'Hide AI Key Setup' : 'Configure AI Provider Key'}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 px-5 pt-2 bg-stone-50/60 shrink-0">
          {[
            { id: 'generate' as const, label: 'Generate Studio Photo (AI)', icon: Sparkles },
            { id: 'upload' as const, label: 'Upload / Paste (Ctrl+V)', icon: UploadCloud },
            {
              id: 'library' as const,
              label: `Kept Media Library (${assets.length})`,
              icon: Images,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  active
                    ? 'border-burgundy-900 text-burgundy-950 bg-white rounded-t-lg'
                    : 'border-transparent text-stone-500 hover:text-burgundy-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {statusBanner && (
            <div
              className={`flex items-start gap-2 rounded-xl border p-3 ${
                statusBanner.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : statusBanner.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {statusBanner.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-relaxed">{statusBanner.message}</span>
            </div>
          )}

          {/* Optional AI Provider Key Configuration Accordion */}
          {showKeySetup && (
            <form
              onSubmit={handleSaveProviderKey}
              className="rounded-xl border border-gold-300 bg-gold-50/40 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-burgundy-950">
                    Connect Google Gemini or OpenAI Image Studio Key
                  </h3>
                  <p className="text-[11px] text-stone-600">
                    Keys are AES-256-GCM encrypted in your backend database so generated photos save straight into `/uploads/products/`.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <select
                  value={keyProvider}
                  onChange={(e) => setKeyProvider(e.target.value as 'gemini' | 'openai')}
                  className="sm:col-span-3 p-2 border border-stone-300 rounded-lg bg-white font-semibold"
                >
                  <option value="gemini">Google Gemini (Imagen)</option>
                  <option value="openai">OpenAI (gpt-image-1)</option>
                </select>
                <input
                  type="password"
                  required
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    keyProvider === 'gemini' ? 'Paste AIza... Gemini API Key' : 'Paste sk-... OpenAI API Key'
                  }
                  className="sm:col-span-6 p-2 border border-stone-300 rounded-lg font-mono text-xs"
                />
                <button
                  type="submit"
                  disabled={savingKey}
                  className="sm:col-span-3 px-3 py-2 rounded-lg bg-burgundy-900 text-gold-200 font-bold hover:bg-burgundy-800 disabled:opacity-50"
                >
                  {savingKey ? 'Saving...' : 'Save Studio Key'}
                </button>
              </div>
            </form>
          )}

          {/* Main Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              {activeTab === 'generate' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-stone-700 block mb-1.5">
                        Metal Collection ({METAL_STUDIO_SPECS[selectedMetalType].label})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {STUDIO_METAL_TYPES.map((metal) => (
                          <button
                            key={metal}
                            type="button"
                            onClick={() => handleResetPrompt(backgroundStyle, metal)}
                            className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors ${
                              selectedMetalType === metal
                                ? 'bg-burgundy-900 text-gold-200 border-burgundy-900'
                                : 'bg-white text-stone-700 border-stone-300 hover:border-gold-500'
                            }`}
                          >
                            {METAL_STUDIO_SPECS[metal].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold uppercase tracking-wider text-stone-700 block mb-1.5">
                        Studio Backdrop
                      </span>
                      <div className="flex gap-2">
                        {(
                          [
                            { id: 'burgundy-velvet', label: 'Deep Burgundy Velvet' },
                            { id: 'ivory-silk', label: 'Warm Ivory Silk' },
                          ] as const
                        ).map((bg) => (
                          <button
                            key={bg.id}
                            type="button"
                            onClick={() => handleResetPrompt(bg.id, selectedMetalType)}
                            className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                              backgroundStyle === bg.id
                                ? 'bg-burgundy-900 text-gold-200 border-burgundy-900'
                                : 'bg-white text-stone-700 border-stone-300 hover:border-gold-500'
                            }`}
                          >
                            {bg.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold uppercase tracking-wider text-stone-700 block mb-1.5">
                        Provider
                      </span>
                      <select
                        value={providerChoice}
                        onChange={(e) => setProviderChoice(e.target.value as any)}
                        className="px-3 py-1.5 border border-stone-300 rounded-lg bg-white font-semibold"
                      >
                        <option value="auto">Auto (Configured Key)</option>
                        <option value="gemini">Google Gemini Imagen</option>
                        <option value="openai">OpenAI gpt-image-1</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold uppercase tracking-wider text-stone-700">
                        Tailored Luxury Studio Prompt
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleResetPrompt(backgroundStyle, selectedMetalType)}
                          className="text-[11px] font-semibold text-stone-600 hover:text-burgundy-900 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyPrompt}
                          className="text-[11px] font-semibold text-burgundy-900 hover:text-gold-700 flex items-center gap-1"
                        >
                          {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPrompt ? 'Copied' : 'Copy Prompt'}</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full p-3 border border-stone-300 rounded-xl outline-none focus:border-gold-500 text-xs leading-relaxed"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                    <input
                      type="checkbox"
                      checked={keepGallery}
                      onChange={(e) => setKeepGallery(e.target.checked)}
                      className="rounded accent-burgundy-900"
                    />
                    <span className="font-medium">
                      Keep existing product photos in gallery (add new studio photo as primary image)
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating || !customPrompt.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 font-bold shadow-md hover:opacity-95 disabled:opacity-50"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-gold-300" />
                      )}
                      <span>
                        {generating ? 'Generating Studio Photograph...' : 'Generate & Keep Studio Image'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
                    >
                      Or Upload / Paste Photo
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                      Kept Library Metal Tag
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {STUDIO_METAL_TYPES.map((metal) => (
                        <button
                          key={metal}
                          type="button"
                          onClick={() => handleResetPrompt(backgroundStyle, metal)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                            selectedMetalType === metal
                              ? 'bg-burgundy-900 text-gold-200 border-burgundy-900'
                              : 'bg-white text-stone-700 border-stone-300 hover:border-gold-500'
                          }`}
                        >
                          {METAL_STUDIO_SPECS[metal].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                    <input
                      type="checkbox"
                      checked={keepGallery}
                      onChange={(e) => setKeepGallery(e.target.checked)}
                      className="rounded accent-burgundy-900"
                    />
                    <span className="font-medium">
                      Keep existing images in product gallery when saving new primary photo
                    </span>
                  </label>

                  <ImageDropzone
                    label={`Upload & Keep Photo for ${product.sku}`}
                    altText={`[${selectedMetalType}] ${product.title || product.name || product.sku} — Studio Upload`}
                    value={latestUrl}
                    onPublicIdChange={(pid) => {
                      uploadedPublicIdRef.current = pid;
                    }}
                    onChange={async (url) => {
                      setLatestUrl(url);
                      const hasValidProductId = /^[0-9a-fA-F]{24}$/.test(product._id || '');
                      if (url && hasValidProductId) {
                        try {
                          const updated = await mediaApi.attachMediaToProduct({
                            productId: product._id,
                            secureUrl: url,
                            publicId: uploadedPublicIdRef.current || undefined,
                            keepExistingImages: keepGallery,
                          });
                          setStatusBanner({
                            type: 'success',
                            message: `Studio photo (${METAL_STUDIO_SPECS[selectedMetalType].label}) saved cleanly to server storage and attached to ${product.sku}.`,
                          });
                          invalidateAll();
                          onImageKept?.({
                            secureUrl: url,
                            publicId: uploadedPublicIdRef.current || '',
                            updatedProduct: updated,
                          });
                        } catch (err: any) {
                          setStatusBanner({
                            type: 'error',
                            message: err?.response?.data?.error?.message || 'Image uploaded but could not attach to product.',
                          });
                        }
                      } else if (url) {
                        onImageKept?.({ secureUrl: url, publicId: uploadedPublicIdRef.current || '' });
                      }
                    }}
                    uploadFolder="products"
                    helperText="Saves directly to Cloudinary or persistent backend /uploads/products/ storage & attaches to this product."
                  />
                </div>
              )}

              {activeTab === 'library' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-stone-600 font-medium">
                      Select any saved studio image below to attach & keep on {product.sku}:
                    </span>
                    <button
                      type="button"
                      onClick={() => refetchLibrary()}
                      className="text-[11px] font-semibold text-burgundy-900 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'ALL', label: `All Metals (${assets.length})` },
                        ...STUDIO_METAL_TYPES.map((metal) => ({
                          id: metal,
                          label: `${METAL_STUDIO_SPECS[metal].label} (${metalCounts[metal]})`,
                        })),
                      ] as const
                    ).map((filterItem) => (
                      <button
                        key={filterItem.id}
                        type="button"
                        onClick={() => setLibraryMetalFilter(filterItem.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                          libraryMetalFilter === filterItem.id
                            ? 'bg-burgundy-900 text-gold-200 border-burgundy-900'
                            : 'bg-stone-50 text-stone-700 border-stone-300 hover:border-gold-400'
                        }`}
                      >
                        {filterItem.label}
                      </button>
                    ))}
                  </div>

                  {loadingLibrary ? (
                    <div className="p-8 text-center text-stone-500">Loading kept studio media...</div>
                  ) : filteredLibraryAssets.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-stone-300 rounded-xl text-stone-500">
                      {assets.length === 0
                        ? 'No kept studio assets recorded yet. Upload or generate a product image to populate the library.'
                        : `No kept ${libraryMetalFilter === 'ALL' ? '' : METAL_STUDIO_SPECS[libraryMetalFilter].label + ' '}studio images saved yet. Switch to Generate or Upload/Paste with ${libraryMetalFilter === 'ALL' ? 'the desired metal' : METAL_STUDIO_SPECS[libraryMetalFilter].label} selected to build this collection.`}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                      {filteredLibraryAssets.map((asset) => {
                        const isAssigned = latestUrl === asset.secureUrl;
                        const assetMetal = getAssetMetal(asset);
                        return (
                          <div
                            key={asset.publicId}
                            className={`rounded-xl border overflow-hidden bg-stone-50 flex flex-col ${
                              isAssigned ? 'border-burgundy-900 ring-2 ring-gold-400' : 'border-stone-200'
                            }`}
                          >
                            <div className="aspect-square bg-burgundy-950 relative">
                              <img
                                src={asset.secureUrl}
                                alt={asset.altText || asset.publicId}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-gold-200 font-semibold uppercase">
                                {asset.source === 'public-static'
                                  ? 'Studio Disk'
                                  : asset.source === 'cloudinary'
                                    ? 'Cloudinary'
                                    : 'Server Kept'}
                              </span>
                              <span
                                className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${METAL_BADGE_CLASSES[assetMetal]}`}
                              >
                                {assetMetal}
                              </span>
                            </div>
                            <div className="p-2 flex-1 flex flex-col justify-between gap-2">
                              <p className="text-[11px] font-semibold text-burgundy-950 line-clamp-2">
                                {asset.altText || asset.publicId}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={attachingUrl === asset.secureUrl}
                                  onClick={() => handleAttachAsset(asset)}
                                  className="flex-1 py-1.5 rounded-lg bg-burgundy-900 text-gold-100 text-[10px] font-bold hover:bg-burgundy-800 disabled:opacity-50"
                                >
                                  {attachingUrl === asset.secureUrl
                                    ? 'Keeping...'
                                    : isAssigned
                                      ? 'Selected'
                                      : 'Keep for Product'}
                                </button>
                                {asset._id && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAsset(asset)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                    title="Delete from library"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Current Product Image Preview */}
            <div className="lg:col-span-4 bg-[#FCF7EC] border border-[#DFC389] rounded-2xl p-4 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold-800 block">
                Active Product Photo
              </span>
              <div className="aspect-square rounded-xl overflow-hidden bg-burgundy-950 border border-gold-300/60 flex items-center justify-center">
                {latestUrl ? (
                  <img
                    src={latestUrl}
                    alt={product.title || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center text-gold-200/80 space-y-1.5">
                    <Sparkles className="w-6 h-6 mx-auto text-gold-400" />
                    <p className="font-serif text-xs uppercase tracking-wider">No Photo Assigned</p>
                    <p className="text-[10px] text-gold-100/65">
                      Generate or upload on the left to save & keep permanently.
                    </p>
                  </div>
                )}
              </div>
              {currentImages.length > 1 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
                    Kept Gallery ({currentImages.length} images)
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {currentImages.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setLatestUrl(url)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border shrink-0 ${
                          latestUrl === url ? 'border-burgundy-900 ring-1 ring-gold-500' : 'border-stone-300'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Any uploaded or generated photograph is registered in MongoDB Media Assets and served seamlessly on the storefront.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminModalPortal>
  );
};
