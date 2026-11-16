import { apiClient } from './client';
import {
  ApiResponse,
  BannerButtonStyle,
  BannerContentMode,
  BannerHeightOption,
  BannerPosition,
  BannerTextAlignment,
  BannerTextColor,
  BannerTextPosition,
  HeroBanner,
  StoreLocation,
  StoreOpeningHour,
  Testimonial,
  DigiContent
} from '@/types';
import { adaptProduct } from './products.api';
import { adaptCategory } from './categories.api';

export interface BannerAdminPayload {
  smallHeading?: string;
  title: string;
  highlightedText?: string;
  subtitle?: string;
  description?: string;
  desktopImageUrl: string;
  desktopImagePublicId?: string;
  mobileImageUrl?: string;
  mobileImagePublicId?: string;
  imageAlt?: string;
  ctaText?: string;
  ctaLink?: string;
  buttonName?: string;
  navigationDestination?: string;
  destinationType?: 'PAGE' | 'CATEGORY' | 'PRODUCT';
  destinationId?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  mediaUrl?: string;
  position: BannerPosition;
  contentMode: BannerContentMode;
  textAlignment: BannerTextAlignment;
  textPosition?: BannerTextPosition;
  textColor?: BannerTextColor;
  buttonStyle?: BannerButtonStyle;
  overlayOpacity?: number;
  bannerHeight?: BannerHeightOption;
  displayOrder: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
}

export function adaptBanner(raw: any): HeroBanner {
  if (!raw) return raw;
  const desktopImageUrl = raw.desktopImageUrl || raw.imageUrl || raw.mediaUrl || '';
  const ctaLink = raw.navigationDestination || raw.ctaLink || raw.targetLink || '';
  const displayOrder = typeof raw.displayOrder === 'number' ? raw.displayOrder : raw.sortOrder ?? 0;

  return {
    _id: raw._id?.toString() || raw.id || '',
    smallHeading: raw.smallHeading || '',
    title: raw.title || '',
    highlightedText: raw.highlightedText || '',
    subtitle: raw.subtitle || '',
    description: raw.description || '',
    desktopImageUrl,
    desktopImagePublicId: raw.desktopImagePublicId || '',
    imageUrl: desktopImageUrl,
    mediaUrl: raw.mediaUrl || desktopImageUrl,
    mediaType: raw.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
    buttonName: raw.buttonName || raw.ctaText || '',
    navigationDestination: ctaLink,
    destinationType: raw.destinationType || 'PAGE',
    destinationId: raw.destinationId || '',
    mobileImageUrl: raw.mobileImageUrl || '',
    mobileImagePublicId: raw.mobileImagePublicId || '',
    imageAlt: raw.imageAlt || raw.title || 'Promotional Jewellery Banner',
    ctaText: raw.buttonName || raw.ctaText || '',
    ctaLink,
    targetLink: ctaLink,
    position: (raw.position as BannerPosition) || 'HOME_HERO',
    contentMode: raw.contentMode === 'image' ? 'image' : 'layered',
    textAlignment:
      raw.textAlignment === 'left' || raw.textAlignment === 'center' ? raw.textAlignment : 'right',
    textPosition:
      raw.textPosition === 'top' || raw.textPosition === 'bottom' ? raw.textPosition : 'center',
    textColor:
      raw.textColor === 'pure-white' || raw.textColor === 'burgundy-dark'
        ? raw.textColor
        : 'cream-gold',
    buttonStyle:
      raw.buttonStyle === 'gold-solid' || raw.buttonStyle === 'burgundy-gold'
        ? raw.buttonStyle
        : 'gold-outline',
    overlayOpacity:
      typeof raw.overlayOpacity === 'number' ? Math.min(90, Math.max(0, raw.overlayOpacity)) : 35,
    bannerHeight:
      raw.bannerHeight === 'compact' || raw.bannerHeight === 'tall' ? raw.bannerHeight : 'standard',
    displayOrder,
    sortOrder: displayOrder,
    startDate: raw.startDate || null,
    endDate: raw.endDate || null,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

export function serializeBannerPayload(
  data: Partial<BannerAdminPayload> | Partial<HeroBanner>,
  isPartial: boolean = false
): Record<string, any> {
  const desktopImageUrl = (
    (data as Partial<BannerAdminPayload>).desktopImageUrl ??
    (data as Partial<HeroBanner>).imageUrl ??
    ''
  ).trim();
  const ctaLink = (
    (data as Partial<BannerAdminPayload>).ctaLink ??
    (data as Partial<HeroBanner>).targetLink ??
    ''
  ).trim();
  const displayOrder =
    (data as Partial<BannerAdminPayload>).displayOrder ?? (data as Partial<HeroBanner>).sortOrder;

  const payload: Record<string, any> = {};
  if (!isPartial || data.smallHeading !== undefined) {
    payload.smallHeading = (data.smallHeading || '').trim();
  }
  if (!isPartial || data.title !== undefined) payload.title = (data.title || '').trim();
  if (!isPartial || data.highlightedText !== undefined) {
    payload.highlightedText = (data.highlightedText || '').trim();
  }
  if (!isPartial || data.subtitle !== undefined) payload.subtitle = (data.subtitle || '').trim();
  if (!isPartial || data.description !== undefined) payload.description = (data.description || '').trim();
  if (!isPartial || desktopImageUrl) payload.desktopImageUrl = desktopImageUrl;
  if (!isPartial || data.desktopImagePublicId !== undefined) {
    payload.desktopImagePublicId = (data.desktopImagePublicId || '').trim();
  }
  if (!isPartial || data.mobileImageUrl !== undefined) {
    payload.mobileImageUrl = (data.mobileImageUrl || '').trim();
  }
  if (!isPartial || data.mobileImagePublicId !== undefined) {
    payload.mobileImagePublicId = (data.mobileImagePublicId || '').trim();
  }
  if (!isPartial || data.imageAlt !== undefined) payload.imageAlt = (data.imageAlt || '').trim();
  if (!isPartial || data.ctaText !== undefined) payload.ctaText = (data.ctaText || '').trim();
  if (!isPartial || (data as Partial<BannerAdminPayload>).ctaLink !== undefined || (data as Partial<HeroBanner>).targetLink !== undefined) {
    payload.ctaLink = ctaLink;
  }
  if (!isPartial || data.position !== undefined) payload.position = data.position || 'HOME_HERO';
  if (!isPartial || data.contentMode !== undefined) payload.contentMode = data.contentMode || 'layered';
  if (!isPartial || data.textAlignment !== undefined) {
    payload.textAlignment = data.textAlignment || 'right';
  }
  if (!isPartial || data.textPosition !== undefined) {
    payload.textPosition = data.textPosition || 'center';
  }
  if (!isPartial || data.textColor !== undefined) {
    payload.textColor = data.textColor || 'cream-gold';
  }
  if (!isPartial || data.buttonStyle !== undefined) {
    payload.buttonStyle = data.buttonStyle || 'gold-outline';
  }
  if (!isPartial || data.overlayOpacity !== undefined) {
    payload.overlayOpacity = Number(data.overlayOpacity ?? 35);
  }
  if (!isPartial || data.bannerHeight !== undefined) {
    payload.bannerHeight = data.bannerHeight || 'standard';
  }
  if (!isPartial || data.startDate !== undefined) {
    payload.startDate = data.startDate ? data.startDate : null;
  }
  if (!isPartial || data.endDate !== undefined) {
    payload.endDate = data.endDate ? data.endDate : null;
  }
  if (!isPartial || (data as any).mediaType !== undefined) {
    payload.mediaType = (data as any).mediaType || 'IMAGE';
  }
  if (!isPartial || (data as any).mediaUrl !== undefined) {
    payload.mediaUrl = (data as any).mediaUrl || '';
  }
  if (!isPartial || (data as any).buttonName !== undefined) {
    payload.buttonName = (data as any).buttonName || '';
  }
  if (!isPartial || (data as any).navigationDestination !== undefined) {
    payload.navigationDestination = (data as any).navigationDestination || '';
  }
  if (!isPartial || (data as any).destinationType !== undefined) {
    payload.destinationType = (data as any).destinationType || 'PAGE';
  }
  if (!isPartial || (data as any).destinationId !== undefined) {
    payload.destinationId = (data as any).destinationId || '';
  }
  if (!isPartial || displayOrder !== undefined) payload.displayOrder = Number(displayOrder ?? 0);
  if (!isPartial || data.isActive !== undefined) payload.isActive = data.isActive ?? true;
  return payload;
}

export interface HomepageAggregateData {
  banners: HeroBanner[];
  featuredCategories: any[];
  featuredProducts: any[];
  newArrivals: any[];
  activeOffers: any[];
  activeSchemes?: any[];
  stores: StoreLocation[];
  flagshipStore?: StoreLocation | null;
  testimonials: Testimonial[];
  rates: any;
}

export function formatOpeningHoursText(hours?: StoreOpeningHour[] | string): string {
  if (!hours) return '';
  if (typeof hours === 'string') return hours.trim();
  if (!Array.isArray(hours) || hours.length === 0) return '';
  return hours
    .filter((entry) => entry && (entry.days || entry.openTime || entry.closeTime))
    .map((entry) => `${entry.days}: ${entry.openTime} – ${entry.closeTime}`)
    .join(' | ');
}

export function adaptStore(raw: any): StoreLocation {
  if (!raw) return raw;
  const name = raw.storeName || raw.name || '';
  const addressLine1 = raw.addressLine1 || raw.address || '';
  const addressLine2 = raw.addressLine2 || '';
  const address = [addressLine1, addressLine2].filter(Boolean).join(', ');
  const pincode = raw.postalCode || raw.pincode || '';
  const phoneNumbers: string[] = Array.isArray(raw.phoneNumbers)
    ? raw.phoneNumbers.filter(Boolean)
    : raw.phone
    ? [raw.phone]
    : [];
  const openingHoursStructured: StoreOpeningHour[] = Array.isArray(raw.openingHours)
    ? raw.openingHours
    : [];
  const images: string[] = Array.isArray(raw.images)
    ? raw.images.filter(Boolean)
    : raw.imageUrl
    ? [raw.imageUrl]
    : [];
  const imagePublicIds: string[] = Array.isArray(raw.imagePublicIds)
    ? raw.imagePublicIds
    : [];

  return {
    _id: raw._id?.toString() || raw.id || '',
    name,
    storeName: name,
    branchCode: raw.branchCode || '',
    address,
    addressLine1,
    addressLine2,
    city: raw.city || '',
    state: raw.state || 'Tamil Nadu',
    pincode,
    postalCode: pincode,
    phone: phoneNumbers[0] || '',
    phoneNumbers,
    whatsappNumber: raw.whatsappNumber || '',
    email: raw.email || '',
    openingHours: formatOpeningHoursText(raw.openingHours),
    openingHoursStructured,
    googleMapsUrl: raw.googleMapsUrl || '',
    displayOrder: typeof raw.displayOrder === 'number' ? raw.displayOrder : 0,
    isFlagship: Boolean(raw.isFlagship),
    isActive: raw.isActive ?? true,
    imageUrl: images[0] || undefined,
    images,
    imagePublicIds
  };
}

export interface StoreAdminPayload {
  storeName: string;
  branchCode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumbers: string[];
  email?: string;
  whatsappNumber?: string;
  googleMapsUrl?: string;
  openingHours: StoreOpeningHour[];
  displayOrder?: number;
  isFlagship: boolean;
  isActive: boolean;
  images?: string[];
  imagePublicIds?: string[];
}

export function serializeStorePayload(
  data: Partial<StoreAdminPayload> | Partial<StoreLocation>,
  isPartial: boolean = false
) {
  const adminData = data as Partial<StoreAdminPayload>;
  const locData = data as Partial<StoreLocation>;

  const hasPhones = Array.isArray(adminData.phoneNumbers) || locData.phone !== undefined;
  const phones =
    Array.isArray(adminData.phoneNumbers)
      ? adminData.phoneNumbers.map((p) => p.trim()).filter(Boolean)
      : locData.phone
      ? [locData.phone.trim()]
      : [];

  const hasHours = Array.isArray(locData.openingHoursStructured) || Array.isArray(adminData.openingHours);
  const hours = Array.isArray(locData.openingHoursStructured)
    ? locData.openingHoursStructured
    : Array.isArray(adminData.openingHours)
    ? adminData.openingHours
    : [];

  const hasImages = Array.isArray(adminData.images) || locData.imageUrl !== undefined;
  const images = Array.isArray(adminData.images)
    ? adminData.images.filter(Boolean)
    : locData.imageUrl
    ? [locData.imageUrl]
    : [];

  const payload: Record<string, any> = {};

  if (!isPartial || adminData.storeName !== undefined || locData.name !== undefined) {
    payload.storeName = (adminData.storeName || locData.name || '').trim();
  }
  if (!isPartial || data.branchCode !== undefined) {
    payload.branchCode = (data.branchCode || '').trim().toUpperCase();
  }
  if (!isPartial || adminData.addressLine1 !== undefined || locData.address !== undefined) {
    payload.addressLine1 = (adminData.addressLine1 || locData.address || '').trim();
  }
  if (!isPartial || data.addressLine2 !== undefined) {
    payload.addressLine2 = (data.addressLine2 || '').trim();
  }
  if (!isPartial || data.city !== undefined) {
    payload.city = (data.city || '').trim();
  }
  if (!isPartial || data.state !== undefined) {
    payload.state = (data.state || 'Tamil Nadu').trim();
  }
  if (!isPartial || adminData.postalCode !== undefined || locData.pincode !== undefined) {
    payload.postalCode = (adminData.postalCode || locData.pincode || '').trim();
  }
  if (!isPartial || hasPhones) {
    payload.phoneNumbers = phones;
  }
  if (!isPartial || data.email !== undefined) {
    payload.email = (data.email || '').trim();
  }
  if (!isPartial || data.whatsappNumber !== undefined) {
    payload.whatsappNumber = (data.whatsappNumber || '').trim();
  }
  if (!isPartial || data.googleMapsUrl !== undefined) {
    payload.googleMapsUrl = (data.googleMapsUrl || '').trim();
  }
  if (!isPartial || hasHours) {
    payload.openingHours = hours;
  }
  if (!isPartial || data.displayOrder !== undefined) {
    payload.displayOrder = Number(data.displayOrder ?? 0);
  }
  if (!isPartial || data.isFlagship !== undefined) {
    payload.isFlagship = Boolean(data.isFlagship);
  }
  if (!isPartial || data.isActive !== undefined) {
    payload.isActive = data.isActive ?? true;
  }
  if (!isPartial || hasImages) {
    payload.images = images;
  }
  if (!isPartial || adminData.imagePublicIds !== undefined) {
    payload.imagePublicIds = Array.isArray(adminData.imagePublicIds) ? adminData.imagePublicIds : [];
  }

  return payload;
}

function adaptDigiContent(rawListOrObj: any, metal: 'GOLD' | 'SILVER'): DigiContent | null {
  const raw = Array.isArray(rawListOrObj) ? rawListOrObj[0] : rawListOrObj;
  if (!raw) return null;
  const calcRaw = raw.calculatorConfig;
  return {
    _id: raw._id?.toString(),
    metal: raw.metal || metal,
    sectionKey: raw.sectionKey || 'overview',
    headline: raw.title || raw.headline || '',
    subtitle: raw.subtitle || '',
    description: raw.contentBody || raw.description || '',
    purityGuarantee: raw.purityGuarantee || '',
    vaultPartner: raw.vaultPartner || '',
    insurancePartner: raw.insurancePartner || '',
    minimumInvestmentPaise: raw.minimumInvestmentPaise,
    mediaUrl: raw.mediaUrl,
    bannerImageUrl: raw.bannerImageUrl || raw.mediaUrl || '',
    bannerImagePublicId: raw.bannerImagePublicId || '',
    rateLabel: raw.rateLabel || '',
    rateSourceLabel: raw.rateSourceLabel || '',
    ctaText: raw.ctaText || '',
    ctaLink: raw.ctaLink || '',
    calculatorConfig: calcRaw
      ? {
          isEnabled: calcRaw.isEnabled ?? true,
          minAmountInr: calcRaw.minAmountInr ?? 100,
          maxAmountInr: calcRaw.maxAmountInr ?? 1000000,
          decimalPrecision: calcRaw.decimalPrecision ?? 4,
          defaultAmountInr: calcRaw.defaultAmountInr ?? 5000,
          purityKey: calcRaw.purityKey || (metal === 'GOLD' ? '24K' : '999'),
          disclaimerText: calcRaw.disclaimerText || '',
        }
      : {
          isEnabled: true,
          minAmountInr: 100,
          maxAmountInr: 1000000,
          decimalPrecision: 4,
          defaultAmountInr: 5000,
          purityKey: metal === 'GOLD' ? '24K' : '999',
          disclaimerText: '',
        },
    faqs: Array.isArray(raw.faqItems)
      ? raw.faqItems
      : Array.isArray(raw.faqs)
      ? raw.faqs
      : []
  };
}

export const cmsApi = {
  getHomepageData: async (): Promise<HomepageAggregateData> => {
    const res = await apiClient.get<ApiResponse<any>>('/public/homepage');
    const raw = res.data.data || {};
    const stores = Array.isArray(raw.stores)
      ? raw.stores.map(adaptStore)
      : raw.flagshipStore
      ? [adaptStore(raw.flagshipStore)]
      : [];
    return {
      banners: (raw.heroBanners || raw.banners || []).map(adaptBanner),
      featuredCategories: (raw.featuredCategories || []).map(adaptCategory),
      featuredProducts: (raw.featuredProducts || []).map(adaptProduct),
      newArrivals: (raw.newArrivals || []).map(adaptProduct),
      activeOffers: raw.activeOffers || [],
      activeSchemes: raw.activeSchemes || [],
      stores,
      flagshipStore: raw.flagshipStore ? adaptStore(raw.flagshipStore) : stores[0] || null,
      testimonials: raw.testimonials || [],
      rates: raw.todayRates || raw.rates || null
    };
  },

  getPublicBanners: async (position?: BannerPosition): Promise<HeroBanner[]> => {
    const query = position ? `?position=${encodeURIComponent(position)}` : '';
    const res = await apiClient.get<ApiResponse<any[]>>(`/public/banners${query}`);
    return (res.data.data || []).map(adaptBanner);
  },

  getStores: async (): Promise<StoreLocation[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/public/stores');
    return (res.data.data || []).map(adaptStore);
  },

  getTestimonials: async (): Promise<Testimonial[]> => {
    const res = await apiClient.get<ApiResponse<Testimonial[]>>('/public/testimonials');
    return res.data.data;
  },

  getDigiContent: async (metal: 'GOLD' | 'SILVER'): Promise<DigiContent | null> => {
    const res = await apiClient.get<ApiResponse<any>>(`/public/digi/${metal.toLowerCase()}`);
    return adaptDigiContent(res.data.data, metal);
  },

  adminGetStores: async (): Promise<StoreLocation[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/cms/stores');
    return (res.data.data || []).map(adaptStore);
  },

  adminGetBanners: async (): Promise<HeroBanner[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/cms/banners');
    return (res.data.data || []).map(adaptBanner);
  },

  adminGetBannerDestinations: async (
    search?: string
  ): Promise<{
    pages: Array<{ label: string; value: string }>;
    categories: Array<{ id: string; label: string; value: string }>;
    products: Array<{ id: string; label: string; value: string }>;
  }> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiClient.get<ApiResponse<any>>(`/admin/cms/banner-destinations${query}`);
    return res.data.data;
  },

  adminUpdateBanner: async (
    id: string,
    data: Partial<BannerAdminPayload> | Partial<HeroBanner>
  ): Promise<HeroBanner> => {
    const payload = serializeBannerPayload(data, true);
    const res = await apiClient.put<ApiResponse<any>>(`/admin/cms/banners/${id}`, payload);
    return adaptBanner(res.data.data);
  },

  adminCreateBanner: async (
    data: Partial<BannerAdminPayload> | Partial<HeroBanner>
  ): Promise<HeroBanner> => {
    const payload = serializeBannerPayload(data, false);
    const res = await apiClient.post<ApiResponse<any>>('/admin/cms/banners', payload);
    return adaptBanner(res.data.data);
  },

  adminUpdateBannerStatus: async (id: string, isActive: boolean): Promise<HeroBanner> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/cms/banners/${id}/status`, {
      isActive
    });
    return adaptBanner(res.data.data);
  },

  adminReorderBanners: async (
    items: Array<{ id: string; displayOrder: number }>
  ): Promise<HeroBanner[]> => {
    const res = await apiClient.patch<ApiResponse<any[]>>('/admin/cms/banners/reorder', { items });
    return (res.data.data || []).map(adaptBanner);
  },

  adminDeleteBanner: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/cms/banners/${id}`);
  },

  adminUpdateStore: async (id: string, data: Partial<StoreAdminPayload> | Partial<StoreLocation>): Promise<StoreLocation> => {
    const payload = serializeStorePayload(data, true);
    const res = await apiClient.put<ApiResponse<any>>(`/admin/cms/stores/${id}`, payload);
    return adaptStore(res.data.data);
  },

  adminCreateStore: async (data: Partial<StoreAdminPayload> | Partial<StoreLocation>): Promise<StoreLocation> => {
    const payload = serializeStorePayload(data, false);
    const res = await apiClient.post<ApiResponse<any>>('/admin/cms/stores', payload);
    return adaptStore(res.data.data);
  },

  adminDeleteStore: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/cms/stores/${id}`);
  },

  adminUpdateDigiContent: async (
    metal: 'GOLD' | 'SILVER',
    data: {
      sectionKey?: string;
      title?: string;
      headline?: string;
      subtitle?: string;
      contentBody?: string;
      description?: string;
      mediaUrl?: string;
      bannerImageUrl?: string;
      bannerImagePublicId?: string;
      rateLabel?: string;
      rateSourceLabel?: string;
      ctaText?: string;
      ctaLink?: string;
      calculatorConfig?: {
        isEnabled?: boolean;
        minAmountInr?: number;
        maxAmountInr?: number;
        decimalPrecision?: number;
        defaultAmountInr?: number;
        purityKey?: string;
        disclaimerText?: string;
      };
      faqItems?: { question: string; answer: string; displayOrder?: number }[];
    }
  ): Promise<DigiContent | null> => {
    const payload = {
      metal,
      sectionKey: data.sectionKey || 'overview',
      title: (data.title || data.headline || '').trim(),
      subtitle: data.subtitle?.trim() || undefined,
      contentBody: (data.contentBody || data.description || '').trim(),
      mediaUrl: data.mediaUrl || undefined,
      bannerImageUrl: data.bannerImageUrl?.trim() || undefined,
      bannerImagePublicId: data.bannerImagePublicId?.trim() || undefined,
      rateLabel: data.rateLabel?.trim() || undefined,
      rateSourceLabel: data.rateSourceLabel?.trim() || undefined,
      ctaText: data.ctaText?.trim() || undefined,
      ctaLink: data.ctaLink?.trim() || undefined,
      calculatorConfig: data.calculatorConfig,
      faqItems: data.faqItems || []
    };
    const res = await apiClient.put<ApiResponse<any>>('/admin/cms/digi/section', payload);
    return adaptDigiContent(res.data.data, metal);
  }
};
