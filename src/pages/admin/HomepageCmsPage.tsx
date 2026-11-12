import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  Clock,
  Building2,
  ExternalLink,
  AlertCircle,
  Save,
  Images
} from 'lucide-react';
import { cmsApi, StoreAdminPayload } from '@/services/api/cms.api';
import { ImageDropzone } from '@/components/admin/ImageDropzone';
import { BannerManagementPanel } from '@/components/admin/BannerManagementPanel';
import { DigiContent, DigiFaq, StoreLocation, StoreOpeningHour } from '@/types';
import { stripHtmlAndControlChars } from '@/utils/inputSanitize';

interface DigiDraft {
  headline: string;
  subtitle: string;
  description: string;
  bannerImageUrl: string;
  bannerImagePublicId: string;
  rateLabel: string;
  rateSourceLabel: string;
  ctaText: string;
  ctaLink: string;
  calculatorEnabled: boolean;
  minAmountInr: number;
  maxAmountInr: number;
  decimalPrecision: number;
  defaultAmountInr: number;
  purityKey: string;
  disclaimerText: string;
  faqs: DigiFaq[];
}

function buildDigiDraft(existing: DigiContent | null | undefined, metal: 'GOLD' | 'SILVER'): DigiDraft {
  return {
    headline: existing?.headline || '',
    subtitle: existing?.subtitle || '',
    description: existing?.description || '',
    bannerImageUrl: existing?.bannerImageUrl || existing?.mediaUrl || '',
    bannerImagePublicId: existing?.bannerImagePublicId || '',
    rateLabel: existing?.rateLabel || '',
    rateSourceLabel: existing?.rateSourceLabel || '',
    ctaText: existing?.ctaText || 'Enquire on WhatsApp',
    ctaLink: existing?.ctaLink || '',
    calculatorEnabled: existing?.calculatorConfig?.isEnabled ?? true,
    minAmountInr: existing?.calculatorConfig?.minAmountInr ?? 100,
    maxAmountInr: existing?.calculatorConfig?.maxAmountInr ?? 1000000,
    decimalPrecision: existing?.calculatorConfig?.decimalPrecision ?? 4,
    defaultAmountInr:
      existing?.calculatorConfig?.defaultAmountInr ?? (metal === 'GOLD' ? 5000 : 1000),
    purityKey: existing?.calculatorConfig?.purityKey || (metal === 'GOLD' ? '24K' : '999'),
    disclaimerText: existing?.calculatorConfig?.disclaimerText || '',
    faqs: existing?.faqs ? [...existing.faqs] : [],
  };
}

const createEmptyStoreForm = (): StoreAdminPayload => ({
  storeName: '',
  branchCode: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: 'Tamil Nadu',
  postalCode: '',
  phoneNumbers: [''],
  email: '',
  whatsappNumber: '',
  googleMapsUrl: '',
  openingHours: [],
  displayOrder: 0,
  isFlagship: false,
  isActive: true,
  images: [],
  imagePublicIds: []
});

interface HomepageCmsPageProps {
  defaultTab?: 'BANNERS' | 'STORES' | 'DIGI';
}

export const HomepageCmsPage: React.FC<HomepageCmsPageProps> = ({ defaultTab = 'BANNERS' }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'BANNERS' | 'STORES' | 'DIGI'>(defaultTab);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Store modal state
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [savingStore, setSavingStore] = useState(false);
  const [storeForm, setStoreForm] = useState<StoreAdminPayload>(createEmptyStoreForm());
  const [primaryImageUrl, setPrimaryImageUrl] = useState('');
  const [primaryImagePublicId, setPrimaryImagePublicId] = useState('');

  // Digi CMS editor state (lazy-overlay per metal over fetched DB data)
  const [digiMetal, setDigiMetal] = useState<'GOLD' | 'SILVER'>('GOLD');
  const [digiDrafts, setDigiDrafts] = useState<Record<'GOLD' | 'SILVER', DigiDraft | null>>({
    GOLD: null,
    SILVER: null,
  });
  const [savingDigi, setSavingDigi] = useState(false);

  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: cmsApi.adminGetStores
  });

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

  const sortedStores = useMemo(
    () => [...stores].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [stores]
  );

  const invalidateStores = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
    queryClient.invalidateQueries({ queryKey: ['stores'] });
    queryClient.invalidateQueries({ queryKey: ['homepage'] });
  };

  const openCreateStore = () => {
    setEditingStoreId(null);
    setErrorMsg(null);
    setStoreForm({
      ...createEmptyStoreForm(),
      displayOrder: sortedStores.length + 1
    });
    setPrimaryImageUrl('');
    setPrimaryImagePublicId('');
    setIsStoreModalOpen(true);
  };

  const openEditStore = (store: StoreLocation) => {
    setEditingStoreId(store._id);
    setErrorMsg(null);
    const phones =
      store.phoneNumbers && store.phoneNumbers.length > 0
        ? store.phoneNumbers
        : store.phone
        ? [store.phone]
        : [''];
    const imgUrl = store.imageUrl || store.images?.[0] || '';
    const pubId = store.imagePublicIds?.[0] || '';

    setStoreForm({
      storeName: store.storeName || store.name || '',
      branchCode: store.branchCode || '',
      addressLine1: store.addressLine1 || store.address || '',
      addressLine2: store.addressLine2 || '',
      city: store.city || '',
      state: store.state || 'Tamil Nadu',
      postalCode: store.postalCode || store.pincode || '',
      phoneNumbers: phones,
      email: store.email || '',
      whatsappNumber: store.whatsappNumber || '',
      googleMapsUrl: store.googleMapsUrl || '',
      openingHours: store.openingHoursStructured ? [...store.openingHoursStructured] : [],
      displayOrder: store.displayOrder ?? 0,
      isFlagship: Boolean(store.isFlagship),
      isActive: store.isActive ?? true,
      images: store.images || (imgUrl ? [imgUrl] : []),
      imagePublicIds: store.imagePublicIds || (pubId ? [pubId] : [])
    });
    setPrimaryImageUrl(imgUrl);
    setPrimaryImagePublicId(pubId);
    setIsStoreModalOpen(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    setErrorMsg(null);

    try {
      const cleanedPhones = storeForm.phoneNumbers.map((p) => p.trim()).filter(Boolean);
      if (cleanedPhones.length === 0) {
        throw new Error('At least one valid contact phone number is required.');
      }

      if (storeForm.whatsappNumber?.trim()) {
        const waDigits = storeForm.whatsappNumber.replace(/\D/g, '');
        if (waDigits.length < 10 || waDigits.length > 15) {
          throw new Error('WhatsApp number must contain 10 to 15 digits.');
        }
      }

      const cleanPostal = storeForm.postalCode.trim();
      if (!/^[A-Za-z0-9\s-]{5,10}$/.test(cleanPostal)) {
        throw new Error('Please enter a valid 5–10 character postal/PIN code.');
      }

      const cleanedHours: StoreOpeningHour[] = storeForm.openingHours
        .map((row) => ({
          days: stripHtmlAndControlChars(row.days).trim(),
          openTime: stripHtmlAndControlChars(row.openTime).trim(),
          closeTime: stripHtmlAndControlChars(row.closeTime).trim()
        }))
        .filter((row) => row.days && row.openTime && row.closeTime);

      const payload: StoreAdminPayload = {
        ...storeForm,
        storeName: stripHtmlAndControlChars(storeForm.storeName).trim(),
        addressLine1: stripHtmlAndControlChars(storeForm.addressLine1).trim(),
        addressLine2: storeForm.addressLine2 ? stripHtmlAndControlChars(storeForm.addressLine2).trim() : '',
        city: stripHtmlAndControlChars(storeForm.city).trim(),
        state: stripHtmlAndControlChars(storeForm.state).trim(),
        postalCode: cleanPostal,
        branchCode: storeForm.branchCode.trim().toUpperCase(),
        phoneNumbers: cleanedPhones,
        whatsappNumber: storeForm.whatsappNumber?.trim() || '',
        openingHours: cleanedHours,
        images: primaryImageUrl.trim() ? [primaryImageUrl.trim()] : [],
        imagePublicIds: primaryImageUrl.trim() && primaryImagePublicId.trim() ? [primaryImagePublicId.trim()] : []
      };

      if (editingStoreId) {
        await cmsApi.adminUpdateStore(editingStoreId, payload);
        setMsg(`Showroom "${payload.storeName}" updated and synced to public site.`);
      } else {
        await cmsApi.adminCreateStore(payload);
        setMsg(`Showroom "${payload.storeName}" added and synced to public site.`);
      }

      invalidateStores();
      setIsStoreModalOpen(false);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to save showroom record.'
      );
    } finally {
      setSavingStore(false);
    }
  };

  const handleToggleStoreActive = async (store: StoreLocation) => {
    try {
      await cmsApi.adminUpdateStore(store._id, {
        isActive: !(store.isActive ?? true)
      });
      setMsg(
        `Showroom "${store.name}" ${(store.isActive ?? true) ? 'deactivated' : 'activated'}.`
      );
      invalidateStores();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to update showroom status.');
    }
  };

  const handleDeleteStore = async (store: StoreLocation) => {
    if (!window.confirm(`Remove showroom "${store.name}" from active records?`)) return;
    try {
      await cmsApi.adminDeleteStore(store._id);
      setMsg(`Showroom "${store.name}" removed.`);
      invalidateStores();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to remove showroom.');
    }
  };

  const handleAddHoursRow = () => {
    setStoreForm((prev) => ({
      ...prev,
      openingHours: [...prev.openingHours, { days: 'Monday – Sunday', openTime: '10:00 AM', closeTime: '08:30 PM' }]
    }));
  };

  const currentDigiFetched = digiMetal === 'GOLD' ? digiGold : digiSilver;
  const activeDigiDraft: DigiDraft = useMemo(
    () => digiDrafts[digiMetal] ?? buildDigiDraft(currentDigiFetched, digiMetal),
    [digiDrafts, digiMetal, currentDigiFetched]
  );

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

    const headline = stripHtmlAndControlChars(activeDigiDraft.headline).trim();
    const description = stripHtmlAndControlChars(activeDigiDraft.description).trim();
    if (headline.length < 3) {
      setErrorMsg('Headline must be at least 3 characters.');
      return;
    }
    if (description.length < 10) {
      setErrorMsg('Verified description must be at least 10 characters.');
      return;
    }
    if (activeDigiDraft.maxAmountInr < activeDigiDraft.minAmountInr) {
      setErrorMsg('Maximum calculator INR amount must be greater than or equal to minimum amount.');
      return;
    }

    setSavingDigi(true);
    try {
      const cleanedFaqs = activeDigiDraft.faqs
        .map((f, idx) => ({
          question: stripHtmlAndControlChars(f.question).trim(),
          answer: stripHtmlAndControlChars(f.answer).trim(),
          displayOrder: idx,
        }))
        .filter((f) => f.question.length >= 4 && f.answer.length >= 4);

      await cmsApi.adminUpdateDigiContent(digiMetal, {
        sectionKey: 'overview',
        title: headline,
        subtitle: stripHtmlAndControlChars(activeDigiDraft.subtitle).trim(),
        contentBody: description,
        bannerImageUrl: activeDigiDraft.bannerImageUrl.trim() || undefined,
        bannerImagePublicId: activeDigiDraft.bannerImagePublicId.trim() || undefined,
        rateLabel: stripHtmlAndControlChars(activeDigiDraft.rateLabel).trim() || undefined,
        rateSourceLabel: stripHtmlAndControlChars(activeDigiDraft.rateSourceLabel).trim() || undefined,
        ctaText: stripHtmlAndControlChars(activeDigiDraft.ctaText).trim() || undefined,
        ctaLink: activeDigiDraft.ctaLink.trim() || undefined,
        calculatorConfig: {
          isEnabled: activeDigiDraft.calculatorEnabled,
          minAmountInr: Number(activeDigiDraft.minAmountInr) || 100,
          maxAmountInr: Number(activeDigiDraft.maxAmountInr) || 1000000,
          decimalPrecision: Math.min(6, Math.max(2, Number(activeDigiDraft.decimalPrecision) || 4)),
          defaultAmountInr: Number(activeDigiDraft.defaultAmountInr) || (digiMetal === 'GOLD' ? 5000 : 1000),
          purityKey: activeDigiDraft.purityKey || (digiMetal === 'GOLD' ? '24K' : '999'),
          disclaimerText: stripHtmlAndControlChars(activeDigiDraft.disclaimerText).trim() || undefined,
        },
        faqItems: cleanedFaqs,
      });

      setDigiDrafts((prev) => ({ ...prev, [digiMetal]: null }));
      queryClient.invalidateQueries({ queryKey: ['digi', digiMetal.toLowerCase()] });
      setMsg(`Saved Digi${digiMetal === 'GOLD' ? 'Gold' : 'Silver'} CMS guide & calculator settings.`);
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
            CMS & Showcase Content Editor
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage homepage promotional banners, showroom locations, operating hours, photos, and DigiGold/Silver guides synced to public pages.
          </p>
        </div>

        {activeTab === 'STORES' && (
          <button
            type="button"
            onClick={openCreateStore}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>Add Showroom</span>
          </button>
        )}
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

      {/* Tabs */}
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
          onClick={() => setActiveTab('STORES')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'STORES'
              ? 'border-burgundy-900 text-burgundy-900 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Showrooms & Boutiques ({stores.length})</span>
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
          <HelpCircle className="w-4 h-4" />
          <span>DigiGold & DigiSilver Guidance</span>
        </button>
      </div>

      {/* Homepage Banners Tab */}
      {activeTab === 'BANNERS' && (
        <BannerManagementPanel
          onStatusMessage={(text) => setMsg(text)}
          onErrorMessage={(text) => setErrorMsg(text)}
        />
      )}

      {/* Stores Tab */}
      {activeTab === 'STORES' && (
        <div className="space-y-4">
          {storesLoading ? (
            <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
              Loading showroom locations...
            </div>
          ) : sortedStores.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-stone-200 text-center space-y-3">
              <Building2 className="w-10 h-10 text-gold-600 mx-auto" />
              <p className="text-sm font-semibold text-burgundy-950">No showrooms configured yet</p>
              <button
                type="button"
                onClick={openCreateStore}
                className="px-4 py-2 rounded-lg bg-burgundy-900 text-gold-200 text-xs font-semibold"
              >
                Create First Showroom
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {sortedStores.map((store) => {
                const fullAddress = [
                  store.addressLine1 || store.address,
                  store.addressLine2,
                  [store.city, store.state].filter(Boolean).join(', '),
                  store.postalCode || store.pincode
                ]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div
                    key={store._id}
                    className={`rounded-2xl border p-5 bg-white shadow-sm flex flex-col justify-between gap-4 ${
                      store.isActive === false ? 'border-stone-200 opacity-75' : 'border-gold-300/70'
                    }`}
                  >
                    <div className="flex gap-4">
                      {store.imageUrl ? (
                        <img
                          src={store.imageUrl}
                          alt={store.name}
                          className="w-24 h-24 rounded-xl object-cover border border-gold-200 shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-burgundy-950 flex flex-col items-center justify-center text-gold-300 shrink-0 p-2 text-center">
                          <Building2 className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-mono">{store.branchCode || 'BRANCH'}</span>
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1 min-w-0 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            Order: {store.displayOrder ?? 0}
                          </span>
                          {store.isFlagship && (
                            <span className="px-2 py-0.5 rounded bg-brand-gold-gradient text-burgundy-950 text-[10px] font-bold uppercase">
                              Flagship
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              store.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {store.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-base text-burgundy-950 truncate">
                          {store.name}
                        </h3>
                        <p className="text-stone-600 leading-relaxed">{fullAddress}</p>
                        <p className="flex items-center gap-1.5 text-stone-700">
                          <Phone className="w-3.5 h-3.5 text-gold-600" />
                          <span>{(store.phoneNumbers || [store.phone]).filter(Boolean).join(', ')}</span>
                        </p>
                        <p className="flex items-start gap-1.5 text-stone-600">
                          <Clock className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                          <span>
                            {store.openingHours ? (
                              store.openingHours
                            ) : (
                              <span className="text-amber-700 font-medium">
                                Opening hours missing — please confirm & edit
                              </span>
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {store.googleMapsUrl && (
                          <a
                            href={store.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-gold-700 hover:text-gold-900 font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Maps URL</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStoreActive(store)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 font-medium text-stone-700"
                        >
                          {store.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditStore(store)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-burgundy-50 text-burgundy-900 hover:bg-burgundy-100 font-semibold"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStore(store)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                          title="Delete showroom"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DigiGold / DigiSilver Tab */}
      {activeTab === 'DIGI' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6 text-xs text-stone-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-serif font-bold text-base text-burgundy-950">
                DigiGold & DigiSilver Consultation Copy
              </h2>
              <p className="text-stone-500 mt-0.5">
                Configure only client-verified guidance copy. Online transactions and wallet features remain disabled platform-wide.
              </p>
            </div>
            <div className="flex gap-2">
              {(['GOLD', 'SILVER'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectDigiMetal(m)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold ${
                    digiMetal === m
                      ? 'bg-burgundy-900 text-gold-200'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Digi{m === 'GOLD' ? 'Gold' : 'Silver'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveDigiContent} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Headline *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={activeDigiDraft.headline}
                    onChange={(e) => patchDigiDraft((d) => ({ ...d, headline: e.target.value }))}
                    placeholder={`e.g. Digi${digiMetal === 'GOLD' ? 'Gold' : 'Silver'} Guide & Calculator`}
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={activeDigiDraft.subtitle}
                    onChange={(e) => patchDigiDraft((d) => ({ ...d, subtitle: e.target.value }))}
                    placeholder="Advisory subtitle..."
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Verified Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    value={activeDigiDraft.description}
                    onChange={(e) => patchDigiDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="Enter verified Digi consultation guidance..."
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ImageDropzone
                  label={`Digi${digiMetal === 'GOLD' ? 'Gold' : 'Silver'} Header Banner (Optional)`}
                  uploadFolder="digi"
                  value={activeDigiDraft.bannerImageUrl}
                  publicId={activeDigiDraft.bannerImagePublicId}
                  onChange={(url) => patchDigiDraft((d) => ({ ...d, bannerImageUrl: url }))}
                  onPublicIdChange={(pid) => patchDigiDraft((d) => ({ ...d, bannerImagePublicId: pid }))}
                  helperText="Subtle luxury artwork integrated into the maroon hero banner"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Rate Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={activeDigiDraft.rateLabel}
                      onChange={(e) => patchDigiDraft((d) => ({ ...d, rateLabel: e.target.value }))}
                      placeholder={digiMetal === 'GOLD' ? "Today's 24K Rate" : "Today's 999 Silver Rate"}
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Rate Source Label
                    </label>
                    <input
                      type="text"
                      value={activeDigiDraft.rateSourceLabel}
                      onChange={(e) => patchDigiDraft((d) => ({ ...d, rateSourceLabel: e.target.value }))}
                      placeholder="Showroom Counter Reference"
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Primary CTA Text
                    </label>
                    <input
                      type="text"
                      value={activeDigiDraft.ctaText}
                      onChange={(e) => patchDigiDraft((d) => ({ ...d, ctaText: e.target.value }))}
                      placeholder="Enquire on WhatsApp"
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Purity Tracked
                    </label>
                    <select
                      value={activeDigiDraft.purityKey}
                      onChange={(e) => patchDigiDraft((d) => ({ ...d, purityKey: e.target.value }))}
                      className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
                    >
                      {digiMetal === 'GOLD' ? (
                        <>
                          <option value="24K">24K Fine Gold</option>
                          <option value="22K">22K 916 Gold</option>
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
                </div>
              </div>
            </div>

            {/* Calculator Configuration */}
            <div className="rounded-2xl border border-gold-300/70 bg-ivory-50/80 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold-300/60 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-sm text-burgundy-950">
                    Bi-Directional Calculator Settings
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Control public Rupee ↔ Gram estimator bounds, precision, and disclaimer notice.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-burgundy-900">
                  <input
                    type="checkbox"
                    checked={activeDigiDraft.calculatorEnabled}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({ ...d, calculatorEnabled: e.target.checked }))
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span>Enable Calculator on Public Page</span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Min INR (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={activeDigiDraft.minAmountInr}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({ ...d, minAmountInr: Number(e.target.value) || 1 }))
                    }
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Max INR (₹)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={activeDigiDraft.maxAmountInr}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({ ...d, maxAmountInr: Number(e.target.value) || 100000 }))
                    }
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Default Preset (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={activeDigiDraft.defaultAmountInr}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({
                        ...d,
                        defaultAmountInr: Number(e.target.value) || 1000,
                      }))
                    }
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Gram Decimals
                  </label>
                  <select
                    value={activeDigiDraft.decimalPrecision}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({
                        ...d,
                        decimalPrecision: Number(e.target.value) || 4,
                      }))
                    }
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  >
                    <option value={2}>2 Decimals</option>
                    <option value={3}>3 Decimals</option>
                    <option value={4}>4 Decimals</option>
                    <option value={6}>6 Decimals</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  Calculator Disclaimer Text
                </label>
                <input
                  type="text"
                  value={activeDigiDraft.disclaimerText}
                  onChange={(e) =>
                    patchDigiDraft((d) => ({ ...d, disclaimerText: e.target.value }))
                  }
                  placeholder="Indicative showroom reference only. No online payment occurs here."
                  className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Dynamic FAQs Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm text-burgundy-950">
                  Page FAQs ({activeDigiDraft.faqs.length})
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    patchDigiDraft((d) => ({
                      ...d,
                      faqs: [...d.faqs, { question: '', answer: '' }],
                    }))
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gold-400 text-burgundy-900 font-semibold hover:bg-ivory-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add FAQ Item</span>
                </button>
              </div>

              {activeDigiDraft.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-stone-500">
                      FAQ #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        patchDigiDraft((d) => ({
                          ...d,
                          faqs: d.faqs.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-red-600 hover:text-red-800 text-[11px] font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({
                        ...d,
                        faqs: d.faqs.map((item, i) =>
                          i === idx ? { ...item, question: e.target.value } : item
                        ),
                      }))
                    }
                    placeholder="Question..."
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) =>
                      patchDigiDraft((d) => ({
                        ...d,
                        faqs: d.faqs.map((item, i) =>
                          i === idx ? { ...item, answer: e.target.value } : item
                        ),
                      }))
                    }
                    placeholder="Verified answer..."
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={savingDigi}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-burgundy-900 hover:bg-burgundy-800 text-gold-200 font-bold uppercase tracking-wider disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-gold-400" />
              <span>{savingDigi ? 'Saving...' : `Publish Digi${digiMetal === 'GOLD' ? 'Gold' : 'Silver'} CMS`}</span>
            </button>
          </form>
        </div>
      )}

      {/* Showroom Create / Edit Modal */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-gold-400 w-full max-w-3xl overflow-hidden shadow-2xl my-6 max-h-[90vh] flex flex-col animate-modal-enter">
            <div className="bg-brand-maroon-gradient p-5 text-gold-100 flex items-center justify-between shrink-0">
              <h2 className="font-serif font-bold text-lg text-gold-100">
                {editingStoreId ? 'Edit Showroom Details' : 'Add New Showroom'}
              </h2>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="text-gold-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="p-6 space-y-5 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Showroom Name *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    placeholder="e.g. Coimbatore Heritage Showroom"
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={10}
                    value={storeForm.branchCode}
                    onChange={(e) => setStoreForm({ ...storeForm, branchCode: e.target.value.toUpperCase() })}
                    placeholder="CBE01"
                    className="w-full p-2.5 border rounded-lg uppercase font-mono outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    value={storeForm.addressLine1}
                    onChange={(e) => setStoreForm({ ...storeForm, addressLine1: e.target.value })}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={storeForm.addressLine2 || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, addressLine2: e.target.value })}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={storeForm.state}
                    onChange={(e) => setStoreForm({ ...storeForm, state: e.target.value })}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    value={storeForm.postalCode}
                    onChange={(e) => setStoreForm({ ...storeForm, postalCode: e.target.value })}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Phone Numbers * (comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.phoneNumbers.join(', ')}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        phoneNumbers: e.target.value.split(',').map((s) => s.trimStart())
                      })
                    }
                    placeholder="+914222456789"
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={storeForm.whatsappNumber || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, whatsappNumber: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={storeForm.email || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Google Maps / Directions URL
                  </label>
                  <input
                    type="url"
                    value={storeForm.googleMapsUrl || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, googleMapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={storeForm.displayOrder ?? 0}
                    onChange={(e) => setStoreForm({ ...storeForm, displayOrder: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              {/* Opening Hours Builder */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold uppercase text-stone-700">
                    Operating Hours Schedule
                  </span>
                  <button
                    type="button"
                    onClick={handleAddHoursRow}
                    className="px-2.5 py-1 rounded bg-white border border-gold-400 text-burgundy-900 font-semibold hover:bg-gold-50"
                  >
                    + Add Schedule Row
                  </button>
                </div>

                {storeForm.openingHours.length === 0 ? (
                  <p className="text-stone-500 italic">
                    No hours configured yet. Leave empty until confirmed with client, or click “Add Schedule Row”.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {storeForm.openingHours.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-10 gap-2 items-center">
                        <input
                          type="text"
                          value={row.days}
                          onChange={(e) => {
                            const updated = [...storeForm.openingHours];
                            updated[idx] = { ...row, days: e.target.value };
                            setStoreForm({ ...storeForm, openingHours: updated });
                          }}
                          placeholder="Mon – Sun"
                          className="sm:col-span-4 p-2 border rounded bg-white"
                        />
                        <input
                          type="text"
                          value={row.openTime}
                          onChange={(e) => {
                            const updated = [...storeForm.openingHours];
                            updated[idx] = { ...row, openTime: e.target.value };
                            setStoreForm({ ...storeForm, openingHours: updated });
                          }}
                          placeholder="10:00 AM"
                          className="sm:col-span-2 p-2 border rounded bg-white"
                        />
                        <input
                          type="text"
                          value={row.closeTime}
                          onChange={(e) => {
                            const updated = [...storeForm.openingHours];
                            updated[idx] = { ...row, closeTime: e.target.value };
                            setStoreForm({ ...storeForm, openingHours: updated });
                          }}
                          placeholder="08:30 PM"
                          className="sm:col-span-3 p-2 border rounded bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setStoreForm({
                              ...storeForm,
                              openingHours: storeForm.openingHours.filter((_, i) => i !== idx)
                            });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ImageDropzone
                label="Showroom Exterior / Boutique Photo"
                value={primaryImageUrl}
                publicId={primaryImagePublicId}
                onChange={setPrimaryImageUrl}
                onPublicIdChange={setPrimaryImagePublicId}
                uploadFolder="stores"
                helperText="Upload directly via Cloudinary or paste a verified image path."
              />

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeForm.isFlagship}
                    onChange={(e) => setStoreForm({ ...storeForm, isFlagship: e.target.checked })}
                    className="rounded accent-burgundy-900"
                  />
                  <span className="font-semibold text-stone-800">Mark as Flagship Boutique</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeForm.isActive}
                    onChange={(e) => setStoreForm({ ...storeForm, isActive: e.target.checked })}
                    className="rounded accent-burgundy-900"
                  />
                  <span className="font-semibold text-stone-800">Active on Public Website</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStore}
                  className="px-6 py-2 rounded-lg bg-burgundy-900 text-gold-200 font-bold hover:bg-burgundy-800 disabled:opacity-50"
                >
                  {savingStore ? 'Saving...' : editingStoreId ? 'Update Showroom' : 'Publish Showroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
