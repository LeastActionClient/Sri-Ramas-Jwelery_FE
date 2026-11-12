// Standard API Envelope
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  timestamp: string;
}

// User & Auth
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'STORE_MANAGER';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  requiresPasswordChange?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

// Rates
export interface MetalRatePurity {
  purity: string; // e.g. "24K", "22K", "18K", "999", "925"
  ratePerGramPaise: number; // in integer paise (e.g. 745000 = ₹7,450.00)
}

export interface MetalRate {
  _id: string;
  metal: 'GOLD' | 'SILVER';
  purity?: string;
  ratePerGramPaise?: number;
  rates?: MetalRatePurity[];
  isManualOverride?: boolean;
  source?: string;
  reason?: string;
  overrideReason?: string;
  sourceProvider?: string;
  effectiveFrom: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiveRatesResponse {
  gold: {
    '24K': number; // in paise
    '22K': number;
    '18K': number;
    lastUpdated?: string;
  };
  silver: {
    '999': number;
    '925': number;
    lastUpdated?: string;
  };
  effectiveDate: string;
  isOverride: boolean;
  isStale?: boolean;
  source?: string;
  providerName?: string;
  isMockProvider?: boolean;
  isLiveVerified?: boolean;
  allManualOverride?: boolean;
  rawGold?: any[];
  rawSilver?: any[];
}

// Categories
export interface Category {
  _id: string;
  name: string;
  sku?: string;
  slug: string;
  description?: string;
  parentCategoryId?: string | null;
  parentCategory?: Category;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  sortOrder: number;
  displayOrder?: number;
  isActive: boolean;
  subcategories?: Category[];
  createdAt: string;
  updatedAt: string;
}

// Products
export type MetalType = 'GOLD' | 'SILVER' | 'PLATINUM' | 'DIAMOND' | 'GEMSTONE';
export type MakingChargeType = 'FLAT' | 'PERCENTAGE' | 'PER_GRAM';
export type PricingType = 'CALCULATED' | 'FIXED';

export interface ProductImage {
  url: string;
  altText?: string;
  isPrimary: boolean;
  publicId?: string;
}

export interface MetalDetail {
  metalType: MetalType;
  purity?: string; // "24K", "22K", "18K", "999", "925"
  grossWeightGrams?: number | null;
  netWeightGrams?: number | null;
}

export interface StoneDetail {
  stoneType: string; // "DIAMOND", "RUBY", "EMERALD", "CZ", etc.
  carats?: number;
  weightGrams?: number;
  pieces?: number;
  ratePaise?: number;
  clarity?: string;
  color?: string;
}

export interface MakingCharges {
  chargeType: MakingChargeType;
  value: number; // paise if FLAT or PER_GRAM, percentage integer or decimal if PERCENTAGE
}

export interface EstimatedPriceBreakdown {
  metalPricePaise: number;
  makingChargesPaise: number;
  stonePricePaise: number;
  subtotalPaise: number;
  gstPaise: number;
  totalEstimatedPaise: number;
  ratePerGramPaise: number;
}

export interface Product {
  _id: string;
  title: string;
  name?: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  category?: Category;
  subcategoryId?: string;
  subcategory?: Category;
  metal: MetalDetail;
  metalType?: string;
  purity?: string;
  grossWeightGrams?: number | null;
  netMetalWeightGrams?: number | null;
  hallmarkStatus?: boolean;
  huid?: string | null;
  stones?: StoneDetail[];
  makingCharges: MakingCharges;
  wastagePercentage?: number;
  pricingType: PricingType;
  fixedPricePaise?: number;
  estimatedPrice?: EstimatedPriceBreakdown | null;
  images: ProductImage[];
  imagePublicIds?: string[];
  gender?: 'WOMEN' | 'MEN' | 'UNISEX' | 'KIDS';
  collectionType?: 'BRIDAL' | 'HERITAGE' | 'DAILY_WEAR' | 'FESTIVE' | 'TEMPLE' | 'SOLITAIRE';
  isFeatured: boolean;
  isNewArrival: boolean;
  displayOrder?: number;
  isActive: boolean;
  visibility?: string;
  createdAt: string;
  updatedAt: string;
}

// Enquiries
export type EnquiryType = 'PRODUCT' | 'SCHEME' | 'DIGIGOLD' | 'DIGISILVER' | 'GENERAL' | 'CUSTOM_ORDER';
export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface EnquiryTimelineNote {
  _id?: string;
  note: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export interface Enquiry {
  _id: string;
  enquiryNumber: string; // e.g. "SRJ-202611-1042"
  enquiryType: EnquiryType;
  status: EnquiryStatus;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  preferredContactMethod?: 'PHONE' | 'WHATSAPP' | 'EMAIL';
  preferredContactTime?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';
  city?: string;
  productId?: string;
  product?: Product;
  schemeId?: string;
  message?: string;
  notes: EnquiryTimelineNote[];
  assignedTo?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Offers
export interface Offer {
  _id: string;
  title: string;
  code?: string;
  description: string;
  discountType: 'PERCENTAGE_MAKING' | 'FLAT_DISCOUNT' | 'GOLD_EXCHANGE_BONUS';
  discountValue: number;
  validFrom: string;
  validUntil: string;
  imageUrl?: string;
  termsAndConditions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Savings Schemes
export interface SchemePlan {
  _id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  shortDescription?: string;
  fullDescription?: string;
  benefits?: string[];
  durationLabel?: string;
  minimumMonthlyAmountPaise?: number;
  minMonthlyAmountPaise?: number;
  maxMonthlyAmountPaise?: number;
  tenureMonths?: number;
  bonusPercentage?: number;
  benefitDescription?: string;
  goldWeightBenefit?: boolean;
  terms: string[];
  termsAndConditions?: string;
  bannerImageUrl?: string;
  bannerImagePublicId?: string;
  mobileBannerImageUrl?: string;
  mobileBannerImagePublicId?: string;
  logoImageUrl?: string;
  textAlignment?: 'left' | 'right';
  ctaText?: string;
  whatsappMessage?: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// CMS Models
export type BannerContentMode = 'image' | 'layered';
export type BannerTextAlignment = 'left' | 'center' | 'right';
export type BannerTextPosition = 'top' | 'center' | 'bottom';
export type BannerTextColor = 'cream-gold' | 'pure-white' | 'burgundy-dark';
export type BannerButtonStyle = 'gold-solid' | 'gold-outline' | 'burgundy-gold';
export type BannerHeightOption = 'compact' | 'standard' | 'tall';
export type BannerPosition = 'HOME_HERO' | 'COLLECTION_HEADER' | 'SCHEME_STRIP' | 'OFFER_POPUP';

export interface HeroBanner {
  _id: string;
  smallHeading?: string;
  title: string;
  highlightedText?: string;
  subtitle?: string;
  description?: string;
  desktopImageUrl: string;
  desktopImagePublicId?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  mobileImagePublicId?: string;
  imageAlt?: string;
  ctaText?: string;
  ctaLink?: string;
  targetLink?: string;
  position: BannerPosition;
  contentMode: BannerContentMode;
  textAlignment: BannerTextAlignment;
  textPosition?: BannerTextPosition;
  textColor?: BannerTextColor;
  buttonStyle?: BannerButtonStyle;
  overlayOpacity?: number;
  bannerHeight?: BannerHeightOption;
  displayOrder: number;
  sortOrder: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreOpeningHour {
  days: string;
  openTime: string;
  closeTime: string;
}

export interface StoreLocation {
  _id: string;
  name: string;
  storeName?: string;
  branchCode?: string;
  address: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  postalCode?: string;
  phone: string;
  phoneNumbers?: string[];
  whatsappNumber?: string;
  email?: string;
  openingHours: string;
  openingHoursStructured?: StoreOpeningHour[];
  googleMapsUrl?: string;
  displayOrder?: number;
  isFlagship: boolean;
  isActive?: boolean;
  imageUrl?: string;
  images?: string[];
  imagePublicIds?: string[];
}

export interface Testimonial {
  _id: string;
  customerName: string;
  city: string;
  rating: number; // 1-5
  comment: string;
  occasion?: string; // "Wedding", "Anniversary", etc.
  date: string;
  isVerifiedPurchase: boolean;
}

export interface DigiFaq {
  question: string;
  answer: string;
  displayOrder?: number;
}

export interface DigiCalculatorConfig {
  isEnabled: boolean;
  minAmountInr: number;
  maxAmountInr: number;
  decimalPrecision: number;
  defaultAmountInr?: number;
  purityKey?: string;
  disclaimerText?: string;
}

export interface DigiContent {
  _id?: string;
  metal: 'GOLD' | 'SILVER';
  sectionKey?: string;
  headline: string;
  subtitle?: string;
  description: string;
  purityGuarantee?: string;
  vaultPartner?: string;
  insurancePartner?: string;
  minimumInvestmentPaise?: number;
  mediaUrl?: string;
  bannerImageUrl?: string;
  bannerImagePublicId?: string;
  rateLabel?: string;
  rateSourceLabel?: string;
  ctaText?: string;
  ctaLink?: string;
  calculatorConfig?: DigiCalculatorConfig;
  faqs: DigiFaq[];
}

// Audit Log
export interface AuditLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  module: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

// Dashboard Summary
export interface DashboardStats {
  totalProducts: number;
  activeEnquiries: number;
  newEnquiriesToday: number;
  resolvedEnquiries: number;
  currentRates: LiveRatesResponse;
  recentEnquiries: Enquiry[];
}
