import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  X,
  AlertCircle,
  Save,
  Images,
  Coins,
  Calculator
} from 'lucide-react';
import { cmsApi } from '@/services/api/cms.api';
import { ImageDropzone } from '@/components/admin/ImageDropzone';
import { BannerManagementPanel } from '@/components/admin/BannerManagementPanel';
import { DigiContent } from '@/types';
import { stripHtmlAndControlChars } from '@/utils/inputSanitize';

// Simplified DigiGold & DigiSilver form state required by Master Prompt:
// 1. Header Image / Media upload
// 2. Calculator configuration section
interface DigiDraft {
  headline: string;
  bannerImageUrl: string;
  bannerImagePublicId: string;
  calculatorEnabled: boolean;
  minAmountInr: number;
  maxAmountInr: number;
  decimalPrecision: number;
  defaultAmountInr: number;
  purityKey: string;
  disclaimerText: string;
}

function buildDigiDraft(existing: DigiContent | null | undefined, metal: 'GOLD' | 'SILVER'): DigiDraft {
  return {
    headline: existing?.headline || (existing as any)?.title || `Digi${metal === 'GOLD' ? 'Gold' : 'Silver'} Guidance & Estimates`,
    bannerImageUrl: existing?.bannerImageUrl || existing?.mediaUrl || '',
    bannerImagePublicId: existing?.bannerImagePublicId || '',
    calculatorEnabled: existing?.calculatorConfig?.isEnabled ?? true,
    minAmountInr: existing?.calculatorConfig?.minAmountInr ?? 100,
    maxAmountInr: existing?.calculatorConfig?.maxAmountInr ?? 1000000,
    decimalPrecision: existing?.calculatorConfig?.decimalPrecision ?? 4,
    defaultAmountInr:
      existing?.calculatorConfig?.defaultAmountInr ?? (metal === 'GOLD' ? 5000 : 1000),
    purityKey: existing?.calculatorConfig?.purityKey || (metal === 'GOLD' ? '24K' : '999'),
    disclaimerText:
      existing?.calculatorConfig?.disclaimerText ||
      'Estimates are indicative benchmarks based on authoritative published bullion rates. Physical conversion and advisory are conducted at Sri Ramas Jewellery showrooms.',
  };
}

interface HomepageCmsPageProps {
  defaultTab?: 'BANNERS' | 'DIGI';
}

export const HomepageCmsPage: React.FC<HomepageCmsPageProps> = ({ defaultTab = 'BANNERS' }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'BANNERS' | 'DIGI'>(defaultTab);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Digi CMS editor state (lazy per metal)
  const [digiMetal, setDigiMetal] = useState<'GOLD' | 'SILVER'>('GOLD');
  const [digiDrafts, setDigiDrafts] = useState<Record<'GOLD' | 'SILVER', DigiDraft | null>>({
    GOLD: null,
    SILVER: null,
  });
  const [savingDigi, setSavingDigi] = useState(false);

  const { data: banners = [] } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: cmsApi.adminGetBanners
  });

  const { data: digiGold } = useQuery({
    queryKey: ['digi', 'gold'],
    queryFn: () => cmsApi.getDigiContent('GOLD')
  });

  const { data: digiSilver } = useQuery({
    queryKey: ['digi', 'silver'],
    queryFn: () => cmsApi.getDigiContent('SILVER')
  });

  const activeDigiDraft: DigiDraft =
    digiDrafts[digiMetal] ??
    buildDigiDraft(digiMetal === 'GOLD' ? digiGold : digiSilver, digiMetal);

  const patchDigiDraft = (updater: (prev: DigiDraft) => DigiDraft) => {
    setDigiDrafts((prev) => {
      const base = prev[digiMetal] ?? buildDigiDraft(digiMetal === 'GOLD' ? digiGold : digiSilver, digiMetal);
      return {
        ...prev,
        [digiMetal]: updater(base),
      };
    });
  };

  const handleSelectDigiMetal = (metal: 'GOLD' | 'SILVER') => {
    setDigiMetal(metal);
    setErrorMsg(null);
  };

  const handleSaveDigiContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeDigiDraft.maxAmountInr < activeDigiDraft.minAmountInr) {
      setErrorMsg('Maximum calculator INR amount must be greater than or equal to minimum amount.');
      return;
    }

    setSavingDigi(true);
    try {
      await cmsApi.adminUpdateDigiContent(digiMetal, {
        sectionKey: 'overview',
        title: activeDigiDraft.headline || `Digi${digiMetal === 'GOLD' ? 'Gold' : 'Silver'} Guidance`,
        contentBody: 'Live showroom bullion benchmarks and bi-directional calculation estimator.',
        bannerImageUrl: activeDigiDraft.bannerImageUrl.trim() || undefined,
        bannerImagePublicId: activeDigiDraft.bannerImagePublicId.trim() || undefined,
        calculatorConfig: {
          isEnabled: activeDigiDraft.calculatorEnabled,
          minAmountInr: Number(activeDigiDraft.minAmountInr) || 100,
          maxAmountInr: Number(activeDigiDraft.maxAmountInr) || 1000000,
          decimalPrecision: Math.min(6, Math.max(2, Number(activeDigiDraft.decimalPrecision) || 4)),
          defaultAmountInr: Number(activeDigiDraft.defaultAmountInr) || (digiMetal === 'GOLD' ? 5000 : 1000),
          purityKey: activeDigiDraft.purityKey || (digiMetal === 'GOLD' ? '24K' : '999'),
          disclaimerText: stripHtmlAndControlChars(activeDigiDraft.disclaimerText).trim() || undefined,
        },
      });

      setDigiDrafts((prev) => ({ ...prev, [digiMetal]: null }));
      queryClient.invalidateQueries({ queryKey: ['digi', digiMetal.toLowerCase()] });
      setMsg(`Published Digi${digiMetal === 'GOLD' ? 'Gold' : 'Silver'} CMS header & calculator settings successfully.`);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error?.message || 'Failed to update Digi informational section.'
      );
    } finally {
      setSavingDigi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            {activeTab === 'DIGI' ? 'DigiGold & DigiSilver CMS' : 'Homepage Promotional Banners'}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {activeTab === 'DIGI'
              ? 'Configure DigiGold and DigiSilver header media, calculation bounds, and public estimates.'
              : 'Manage promotional banners and artwork displayed on the public homepage carousel.'}
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 rounded-xl flex items-center justify-between gap-2 animate-toast-enter">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
          <button type="button" onClick={() => setMsg(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800 rounded-xl flex items-center justify-between gap-2 animate-toast-enter">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-stone-200 gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('BANNERS')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'BANNERS'
              ? 'border-burgundy-900 text-burgundy-900 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Images className="w-4 h-4" />
          <span>Homepage Banners ({banners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('DIGI');
            handleSelectDigiMetal(digiMetal);
          }}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'DIGI'
              ? 'border-burgundy-900 text-burgundy-900 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>DigiGold &amp; DigiSilver CMS</span>
        </button>
      </div>

      {/* Homepage Banners Tab */}
      {activeTab === 'BANNERS' && (
        <BannerManagementPanel
          onStatusMessage={(text) => setMsg(text)}
          onErrorMessage={(text) => setErrorMsg(text)}
        />
      )}

      {/* DigiGold & DigiSilver Guidance Tab */}
      {activeTab === 'DIGI' && (
        <div className="space-y-6">
          {/* Metal Sub-Tabs */}
          <div className="flex items-center gap-2 bg-[#FCF7EC] p-1.5 rounded-xl border border-gold-300/80 w-fit">
            <button
              type="button"
              onClick={() => handleSelectDigiMetal('GOLD')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                digiMetal === 'GOLD'
                  ? 'bg-burgundy-900 text-gold-200 shadow'
                  : 'text-stone-700 hover:text-burgundy-950'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-gold-400" />
              <span>DigiGold Content &amp; Calculator</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDigiMetal('SILVER')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                digiMetal === 'SILVER'
                  ? 'bg-burgundy-900 text-gold-200 shadow'
                  : 'text-stone-700 hover:text-burgundy-950'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-stone-300" />
              <span>DigiSilver Content &amp; Calculator</span>
            </button>
          </div>

          <form onSubmit={handleSaveDigiContent} className="space-y-6 max-w-4xl bg-white p-6 rounded-2xl border border-stone-200 shadow-sm text-xs">
            {/* 1. Header Media Upload */}
            <div className="space-y-3 bg-[#FAF7F0] p-4 rounded-xl border border-gold-300/70">
              <h3 className="font-serif font-bold text-sm text-burgundy-950 flex items-center gap-2">
                <span>1. Digi{digiMetal === 'GOLD' ? 'Gold' : 'Silver'} Header Media Artwork</span>
              </h3>
              <p className="text-[11px] text-stone-500">
                Upload luxury hero banner image or video displayed on the public /digi{digiMetal.toLowerCase()} page.
              </p>

              <ImageDropzone
                label={`Header Artwork for Digi${digiMetal === 'GOLD' ? 'Gold' : 'Silver'}`}
                uploadFolder="digi"
                value={activeDigiDraft.bannerImageUrl}
                publicId={activeDigiDraft.bannerImagePublicId}
                onChange={(url) => patchDigiDraft((d) => ({ ...d, bannerImageUrl: url }))}
                onPublicIdChange={(pid) => patchDigiDraft((d) => ({ ...d, bannerImagePublicId: pid }))}
                helperText="Upload PNG, JPG, WEBP, or MP4 video (up to 10MB)"
              />
            </div>

            {/* 2. Calculator Configuration */}
            <div className="space-y-4 bg-white p-5 rounded-xl border border-gold-300/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold-300/60 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-gold-600" />
                  <h3 className="font-serif font-bold text-sm text-burgundy-950">
                    2. Bi-Directional Calculator Configuration
                  </h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-burgundy-900">
                  <input
                    type="checkbox"
                    checked={activeDigiDraft.calculatorEnabled}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({ ...d, calculatorEnabled: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-burgundy-900"
                  />
                  <span>Enable Public Calculator</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Minimum Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={activeDigiDraft.minAmountInr}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({ ...d, minAmountInr: Number(e.target.value) || 100 }))
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Maximum Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={activeDigiDraft.maxAmountInr}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({ ...d, maxAmountInr: Number(e.target.value) || 1000000 }))
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Default Initial Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={activeDigiDraft.defaultAmountInr}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({ ...d, defaultAmountInr: Number(e.target.value) || 5000 }))
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Purity Key Benchmarked
                  </label>
                  <select
                    value={activeDigiDraft.purityKey}
                    onChange={(e) => patchDigiDraft((d) => ({ ...d, purityKey: e.target.value }))}
                    className="w-full p-2.5 border border-stone-300 rounded-lg bg-white outline-none focus:border-gold-500"
                  >
                    {digiMetal === 'GOLD' ? (
                      <>
                        <option value="24K">24K Fine Gold</option>
                        <option value="22K">22K (916) Gold</option>
                        <option value="18K">18K Gold</option>
                      </>
                    ) : (
                      <>
                        <option value="999">999 Fine Silver</option>
                        <option value="925">925 Sterling Silver</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Decimal Precision (Grams)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={activeDigiDraft.decimalPrecision}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({ ...d, decimalPrecision: Number(e.target.value) || 4 }))
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  Calculator Advisory Disclaimer Text
                </label>
                <textarea
                  rows={2}
                  value={activeDigiDraft.disclaimerText}
                  onChange={(e) => patchDigiDraft((d) => ({ ...d, disclaimerText: e.target.value }))}
                  placeholder="Estimates are calculated based on today's official published showroom rates..."
                  className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <span className="text-[11px] text-stone-500">
                Saved changes update MongoDB and sync with public /digi{digiMetal.toLowerCase()} page immediately.
              </span>
              <button
                type="submit"
                disabled={savingDigi}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-burgundy-900 text-gold-200 font-bold hover:bg-burgundy-800 disabled:opacity-50 shadow-md transition-all"
              >
                <Save className="w-4 h-4 text-gold-400" />
                <span>
                  {savingDigi
                    ? 'Publishing...'
                    : `Publish Digi${digiMetal === 'GOLD' ? 'Gold' : 'Silver'} Settings`}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};