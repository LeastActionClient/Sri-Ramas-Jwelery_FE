import { apiClient } from './client';
import { ApiResponse, SchemePlan } from '@/types';

export function adaptScheme(raw: any): SchemePlan {
  if (!raw) return raw;

  const termsText: string = raw.termsAndConditions || '';
  const terms: string[] = Array.isArray(raw.terms) && raw.terms.length > 0
    ? raw.terms.map((line: string) => String(line).trim()).filter(Boolean)
    : termsText
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);

  const benefitsText: string = raw.benefitDescription || '';
  const benefits: string[] = Array.isArray(raw.benefits) && raw.benefits.length > 0
    ? raw.benefits.map((line: string) => String(line).trim()).filter(Boolean)
    : benefitsText
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);

  const minPaise = raw.minMonthlyAmountPaise ?? raw.minimumMonthlyAmountPaise;
  const parsedTenure =
    typeof raw.tenureMonths === 'number' && raw.tenureMonths > 0
      ? raw.tenureMonths
      : undefined;

  return {
    _id: raw._id?.toString() || raw.id || '',
    name: raw.name || '',
    slug: raw.slug || '',
    tagline: raw.tagline || '',
    shortDescription: raw.shortDescription || raw.tagline || '',
    fullDescription: raw.fullDescription || '',
    description:
      raw.shortDescription ||
      raw.tagline ||
      raw.fullDescription ||
      raw.benefitDescription ||
      '',
    benefits,
    durationLabel: raw.durationLabel || '',
    minimumMonthlyAmountPaise: typeof minPaise === 'number' && minPaise > 0 ? minPaise : undefined,
    minMonthlyAmountPaise: typeof minPaise === 'number' && minPaise > 0 ? minPaise : undefined,
    maxMonthlyAmountPaise:
      typeof raw.maxMonthlyAmountPaise === 'number' && raw.maxMonthlyAmountPaise > 0
        ? raw.maxMonthlyAmountPaise
        : undefined,
    tenureMonths: parsedTenure,
    bonusPercentage: typeof raw.bonusPercentage === 'number' ? raw.bonusPercentage : undefined,
    benefitDescription: raw.benefitDescription || benefits.join('\n'),
    goldWeightBenefit: Boolean(raw.goldWeightBenefit),
    terms,
    termsAndConditions: termsText || terms.join('\n'),
    bannerImageUrl: raw.bannerImageUrl || '',
    bannerImagePublicId: raw.bannerImagePublicId || '',
    mobileBannerImageUrl: raw.mobileBannerImageUrl || '',
    mobileBannerImagePublicId: raw.mobileBannerImagePublicId || '',
    logoImageUrl: raw.logoImageUrl || '',
    textAlignment: raw.textAlignment === 'right' ? 'right' : 'left',
    ctaText: raw.ctaText || 'Enquire Now',
    buttonName: raw.buttonName || raw.ctaText || 'Enquire Now',
    navigationDestination: raw.navigationDestination || (raw.slug ? `/schemes/${raw.slug}` : '/contact'),
    whatsappMessage: raw.whatsappMessage || '',
    layoutConfig: raw.layoutConfig || undefined,
    displayOrder: raw.displayOrder ?? 0,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function serializeSchemePayload(data: Partial<SchemePlan>) {
  const minPaiseRaw = data.minMonthlyAmountPaise ?? data.minimumMonthlyAmountPaise;
  const minPaise =
    typeof minPaiseRaw === 'number' && minPaiseRaw > 0 ? minPaiseRaw : undefined;

  const benefitsArr = Array.isArray(data.benefits)
    ? data.benefits.map((b) => b.trim()).filter(Boolean)
    : data.benefitDescription
      ? data.benefitDescription
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean)
      : [];

  const termsArr = Array.isArray(data.terms)
    ? data.terms.map((t) => t.trim()).filter(Boolean)
    : data.termsAndConditions
      ? data.termsAndConditions
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  const termsStr = data.termsAndConditions?.trim() || termsArr.join('\n') || undefined;
  const benefitStr = data.benefitDescription?.trim() || benefitsArr.join('\n') || undefined;

  return {
    name: data.name?.trim(),
    slug: data.slug?.trim() || undefined,
    tagline: data.tagline?.trim() || undefined,
    shortDescription: data.shortDescription?.trim() || undefined,
    fullDescription: data.fullDescription?.trim() || undefined,
    benefits: benefitsArr,
    terms: termsArr,
    durationLabel: data.durationLabel?.trim() || undefined,
    tenureMonths:
      typeof data.tenureMonths === 'number' && data.tenureMonths > 0
        ? data.tenureMonths
        : undefined,
    minMonthlyAmountPaise: minPaise,
    maxMonthlyAmountPaise:
      typeof data.maxMonthlyAmountPaise === 'number' && data.maxMonthlyAmountPaise > 0
        ? data.maxMonthlyAmountPaise
        : undefined,
    benefitDescription: benefitStr,
    termsAndConditions: termsStr,
    goldWeightBenefit: Boolean(data.goldWeightBenefit),
    bannerImageUrl: data.bannerImageUrl?.trim() || undefined,
    bannerImagePublicId: data.bannerImagePublicId?.trim() || undefined,
    mobileBannerImageUrl: data.mobileBannerImageUrl?.trim() || undefined,
    mobileBannerImagePublicId: data.mobileBannerImagePublicId?.trim() || undefined,
    logoImageUrl: data.logoImageUrl?.trim() || undefined,
    textAlignment: data.textAlignment === 'right' ? 'right' : 'left',
    ctaText: data.buttonName?.trim() || data.ctaText?.trim() || 'Enquire Now',
    buttonName: data.buttonName?.trim() || data.ctaText?.trim() || 'Enquire Now',
    navigationDestination: data.navigationDestination?.trim() || undefined,
    whatsappMessage: data.whatsappMessage?.trim() || undefined,
    layoutConfig: data.layoutConfig !== undefined ? data.layoutConfig : undefined,
    isActive: data.isActive ?? true,
    displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
  };
}

export const schemesApi = {
  getSchemes: async (): Promise<SchemePlan[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/public/schemes');
    return (res.data.data || []).map(adaptScheme);
  },

  getSchemeBySlug: async (slug: string): Promise<SchemePlan> => {
    const res = await apiClient.get<ApiResponse<any>>(`/public/schemes/${slug}`);
    return adaptScheme(res.data.data);
  },

  adminGetSchemes: async (): Promise<SchemePlan[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/schemes');
    return (res.data.data || []).map(adaptScheme);
  },

  adminCreateScheme: async (data: Partial<SchemePlan>): Promise<SchemePlan> => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/schemes', serializeSchemePayload(data));
    return adaptScheme(res.data.data);
  },

  adminUpdateScheme: async (id: string, data: Partial<SchemePlan>): Promise<SchemePlan> => {
    const res = await apiClient.put<ApiResponse<any>>(`/admin/schemes/${id}`, serializeSchemePayload(data));
    return adaptScheme(res.data.data);
  },

  adminDeleteScheme: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/schemes/${id}`);
  },
};
