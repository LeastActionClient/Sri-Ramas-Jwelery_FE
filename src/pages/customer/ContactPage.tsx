import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  LayoutGrid,
  Calendar,
  PenLine,
  Send,
  CheckCircle2,
  Gem,
  Sparkles,
  X,
  ExternalLink,
  Navigation,
  MessageCircle,
} from 'lucide-react';
import { enquiriesApi } from '@/services/api/enquiries.api';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { SEO } from '@/components/common/SEO';
import {
  filterAlphabeticNameInput,
  filterIndianMobileInput,
  INDIAN_MOBILE_TEN_DIGIT_REGEX,
  SAFE_HUMAN_NAME_REGEX,
  sanitizeMultilineText,
  stripHtmlAndControlChars,
} from '@/utils/inputSanitize';
import { ScrollReveal } from '@/components/motion';

const contactFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 letters')
    .max(80, 'Full name cannot exceed 80 characters')
    .regex(SAFE_HUMAN_NAME_REGEX, 'Name must contain alphabets only (no digits or symbols)'),
  customerMobile: z
    .string()
    .trim()
    .regex(
      INDIAN_MOBILE_TEN_DIGIT_REGEX,
      'Please enter a valid 10-digit Indian mobile number starting with 6-9'
    ),
  enquiryType: z.enum(['PRODUCT', 'SCHEME', 'DIGI_GOLD', 'DIGI_SILVER', 'GENERAL']),
  customerEmail: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(120, 'Email cannot exceed 120 characters')
    .optional()
    .or(z.literal('')),
  preferredContactMethod: z.enum(['WHATSAPP', 'CALL', 'EMAIL']),
  preferredContactTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']),
  preferredPurchasePeriod: z.string().optional(),
  city: z
    .string()
    .trim()
    .max(60, 'City name cannot exceed 60 characters')
    .refine(
      (val) => !val || /^[A-Za-z\s.'-]{2,60}$/.test(val),
      'City should contain letters only'
    )
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(5, 'Please share at least 5 characters of enquiry details')
    .max(1500, 'Enquiry message cannot exceed 1500 characters'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface SelectedProductContext {
  id?: string;
  name: string;
  sku: string;
  category?: string;
  metalType?: string;
  purity?: string;
  url?: string;
}

export const ContactPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    refNumber: string;
    whatsappUrl: string;
    customerName: string;
  } | null>(null);

  const { primaryStore, buildWhatsAppUrl } = useStoreWhatsApp();

  // 1. Identify incoming product context from router state or query parameters
  const incomingProduct: SelectedProductContext | null = useMemo(() => {
    const stateProduct = (location.state as any)?.product;
    if (stateProduct?.sku || stateProduct?.name) {
      return {
        id: stateProduct.id || '',
        name: stateProduct.name || '',
        sku: stateProduct.sku || '',
        category: stateProduct.category || '',
        metalType: stateProduct.metalType || '',
        purity: stateProduct.purity || '',
        url: stateProduct.url || '',
      };
    }

    const paramSku = searchParams.get('productSku');
    const paramName = searchParams.get('productName');
    if (paramSku || paramName) {
      return {
        id: '',
        name: paramName || '',
        sku: paramSku || '',
        category: searchParams.get('category') || '',
        metalType: searchParams.get('metalType') || '',
        purity: searchParams.get('purity') || '',
        url: typeof window !== 'undefined' ? `${window.location.origin}/products` : '',
      };
    }

    return null;
  }, [location.state, searchParams]);

  // 1b. Identify incoming savings scheme context from router state or query parameters
  const incomingScheme = useMemo(() => {
    const stateScheme = (location.state as any)?.scheme;
    if (stateScheme?.name) {
      return {
        id: stateScheme.id || '',
        name: stateScheme.name as string,
        description: stateScheme.description || '',
      };
    }

    const paramScheme = searchParams.get('scheme') || searchParams.get('schemeName');
    const paramType = searchParams.get('type');
    if (paramScheme) {
      return {
        id: searchParams.get('schemeId') || '',
        name: paramScheme,
        description: '',
      };
    }
    if (paramType === 'SCHEME') {
      return {
        id: searchParams.get('schemeId') || '',
        name: 'Jewellery Savings Scheme',
        description: '',
      };
    }

    return null;
  }, [location.state, searchParams]);

  const [selectedProduct, setSelectedProduct] = useState<SelectedProductContext | null>(
    incomingProduct
  );
  const [selectedScheme, setSelectedScheme] = useState<{ id?: string; name: string; description?: string } | null>(
    incomingScheme
  );

  const storeAddress = primaryStore
    ? [
        primaryStore.addressLine1 || primaryStore.address,
        primaryStore.addressLine2,
        [primaryStore.city, primaryStore.state].filter(Boolean).join(', '),
        primaryStore.postalCode || primaryStore.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const primaryPhones =
    primaryStore?.phoneNumbers && primaryStore.phoneNumbers.length > 0
      ? primaryStore.phoneNumbers
      : primaryStore?.phone
      ? [primaryStore.phone]
      : [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
    defaultValues: {
      enquiryType: selectedProduct ? 'PRODUCT' : incomingScheme ? 'SCHEME' : 'GENERAL',
      preferredContactMethod: 'WHATSAPP',
      preferredContactTime: 'ANYTIME',
      preferredPurchasePeriod: 'Within One Month',
      customerName: '',
      customerMobile: '',
      customerEmail: '',
      city: '',
      message: selectedProduct
        ? `I would like to enquire about the following jewellery product:\n\nProduct Name: ${selectedProduct.name}\nProduct SKU: ${selectedProduct.sku}\n\nPlease provide more information about this product.`
        : incomingScheme
        ? `I would like to enrol / enquire about the following savings scheme:\n\nScheme Name: ${incomingScheme.name}\n\nPlease share official scheme brochures, monthly installment details, and guidance on showroom enrollment.`
        : '',
    },
  });

  // When product context is detected, prefill the form accordingly
  useEffect(() => {
    if (selectedProduct) {
      setValue('enquiryType', 'PRODUCT');
      setValue(
        'message',
        `I would like to enquire about the following jewellery product:\n\nProduct Name: ${selectedProduct.name}\nProduct SKU: ${selectedProduct.sku}\n\nPlease provide more information about this product.`
      );
    }
  }, [selectedProduct, setValue]);

  // When savings scheme context is detected, prefill the form accordingly
  useEffect(() => {
    if (incomingScheme && !selectedProduct) {
      setSelectedScheme(incomingScheme);
      setValue('enquiryType', 'SCHEME');
      setValue(
        'message',
        `I would like to enrol / enquire about the following savings scheme:\n\nScheme Name: ${incomingScheme.name}\n\nPlease share official scheme brochures, monthly installment details, and guidance on showroom enrollment.`
      );
    }
  }, [incomingScheme, selectedProduct, setValue]);

  // Left card direct company WhatsApp instant chat URL
  const instantChatUrl = useMemo(() => {
    return buildWhatsAppUrl({
      customMessage:
        'Hello Sri Ramas Jewellery, I would like to know more about your jewellery collections and services.',
    });
  }, [buildWhatsAppUrl]);

  // Single submission handler: performs BOTH actions (MongoDB save & Company WhatsApp dispatch)
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    // Synchronously initiate blank popup window to prevent modern browser popup blockers
    let popupWindow: Window | null = null;
    try {
      popupWindow = window.open('about:blank', '_blank');
    } catch {
      popupWindow = null;
    }

    try {
      const cleanName = stripHtmlAndControlChars(data.customerName).trim();
      const cleanCity = data.city ? stripHtmlAndControlChars(data.city).trim() : '';
      let cleanMessage = sanitizeMultilineText(data.message).trim();
      if (data.preferredPurchasePeriod) {
        cleanMessage += `\n\nPreferred Purchase Period: ${data.preferredPurchasePeriod}`;
      }

      // Action 1: Save enquiry to backend & MongoDB
      const isValidObjectId = (id?: string) => !!id && /^[a-f\d]{24}$/i.test(id);

      const res = await enquiriesApi.submitPublicEnquiry({
        enquiryType: data.enquiryType as any,
        customerName: cleanName,
        customerMobile: data.customerMobile.trim(),
        customerEmail: data.customerEmail?.trim() || undefined,
        preferredContactMethod: 'WHATSAPP',
        preferredContactTime: data.preferredContactTime,
        city: cleanCity || undefined,
        productId: selectedProduct?.id && isValidObjectId(selectedProduct.id) ? selectedProduct.id : undefined,
        productName: selectedProduct?.name || undefined,
        productSku: selectedProduct?.sku || undefined,
        productUrl: selectedProduct?.url || undefined,
        schemeId: selectedScheme?.id && isValidObjectId(selectedScheme.id) ? selectedScheme.id : undefined,
        message: cleanMessage,
      });

      const refNo = res.enquiryNumber;

      // Action 2: Construct Official Store WhatsApp Dispatch URL
      let formattedWhatsAppText = `*NEW WEBSITE SHOWCASE ENQUIRY*\n` +
        `• Ref Number: ${refNo}\n` +
        `• Customer Name: ${cleanName}\n` +
        `• Mobile: +91 ${data.customerMobile.trim()}\n`;

      if (data.customerEmail?.trim()) {
        formattedWhatsAppText += `• Email: ${data.customerEmail.trim()}\n`;
      }
      if (cleanCity) {
        formattedWhatsAppText += `• City: ${cleanCity}\n`;
      }
      if (data.preferredPurchasePeriod) {
        formattedWhatsAppText += `• Purchase Period: ${data.preferredPurchasePeriod}\n`;
      }

      formattedWhatsAppText += `• Preferred Time: ${data.preferredContactTime}\n`;

      if (selectedProduct) {
        formattedWhatsAppText += `\n*SELECTED JEWELLERY PIECE*\n` +
          `• Item: ${selectedProduct.name}\n` +
          `• SKU: ${selectedProduct.sku}\n`;
      } else if (selectedScheme) {
        formattedWhatsAppText += `\n*SELECTED SAVINGS SCHEME*\n` +
          `• Scheme: ${selectedScheme.name}\n`;
      }

      formattedWhatsAppText += `\n*REQUIREMENTS / MESSAGE*\n${cleanMessage}`;

      const companyWhatsAppUrl = buildWhatsAppUrl({
        customMessage: formattedWhatsAppText,
      });

      // Dispatch to WhatsApp popup
      if (popupWindow && !popupWindow.closed) {
        popupWindow.location.href = companyWhatsAppUrl;
      } else {
        window.open(companyWhatsAppUrl, '_blank', 'noopener,noreferrer');
      }

      setSubmissionSuccess({
        refNumber: refNo,
        whatsappUrl: companyWhatsAppUrl,
        customerName: cleanName,
      });

      reset();
    } catch (err: any) {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
      setErrorMessage(
        err?.response?.data?.error?.message ||
          'Unable to submit enquiry right now. Please check your network or connect with our showroom team directly on WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmissionSuccess(null);
    setSelectedProduct(null);
    setSelectedScheme(null);
    reset({
      enquiryType: 'GENERAL',
      preferredContactMethod: 'WHATSAPP',
      preferredContactTime: 'ANYTIME',
      preferredPurchasePeriod: 'Within One Month',
      customerName: '',
      customerMobile: '',
      customerEmail: '',
      city: '',
      message: '',
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF4EC] text-stone-900 selection:bg-gold-200 selection:text-burgundy-950 relative overflow-hidden">
      <SEO
        title="Contact Sri Ramas Jewellery | Visit Our Showroom"
        description="Contact Sri Ramas Jewellery for jewellery enquiries, showroom information and assistance with our gold and silver collections."
        canonical="https://sriramasjewellery.com/contact"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Contact Showroom', path: '/contact' }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact Sri Ramas Jewellery',
          url: 'https://sriramasjewellery.com/contact',
          mainEntity: {
            '@type': 'JewelryStore',
            name: 'Sri Ramas Jewellery',
            telephone: '+91 78711 66317',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '18/995, South East Rampart, Near Old Bus Stand',
              addressLocality: 'Thanjavur',
              addressRegion: 'Tamil Nadu',
              postalCode: '613001',
              addressCountry: 'IN'
            },
            openingHours: 'Mo-Su 09:00-21:30'
          }
        }}
      />

      {/* 1. Full-Bleed Luxury Hero Section (100% Matching 2nd Image Font, Words & Design) */}
      <section className="relative w-full bg-[#1A0307] text-gold-100 min-h-[240px] sm:min-h-[280px] md:min-h-[300px] py-8 sm:py-10 md:py-12 flex flex-col justify-center border-b border-[#D4AF37]/35 overflow-hidden">
        {/* Background Image: Exactly matching the 1st image provided */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src="/images/contact-hero-bg.jpg"
            alt="Sri Ramas Jewellery Contact & Enquiry Hero Background"
            className="w-full h-full object-cover object-center scale-[1.01]"
          />
          {/* Subtle center radial vignette to guarantee 100% typography contrast while keeping side jewels luminous */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 65% at 50% 50%, rgba(20, 2, 5, 0.40) 0%, rgba(20, 2, 5, 0.12) 65%, transparent 100%)',
            }}
          />
        </div>

        {/* Hero Typography & Eyebrow Badge (100% exact copy of reference 2nd image) */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2.5 sm:space-y-3">
          <ScrollReveal variant="fade-up" immediate>
            {/* Pill Badge: CONTACT & ENQUIRY */}
            <div className="inline-flex items-center px-4 py-1 rounded-full border border-[#D4AF37]/60 bg-[#24040A]/60 backdrop-blur-sm shadow-sm mb-1">
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#F3D58C] uppercase">
                CONTACT &amp; ENQUIRY
              </span>
            </div>

            {/* Main Heading in Luxury Serif */}
            <h1
              className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-[46px] font-bold text-white tracking-wide uppercase leading-tight mt-1"
              style={{
                textShadow: '0 3px 18px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 0.85)',
              }}
            >
              CONNECT WITH SRI RAMAS JEWELLERY
            </h1>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={60}>
            {/* Subtitle matching exact wording */}
            <p
              className="text-xs sm:text-sm md:text-[15px] text-[#F5E6D3] max-w-2xl mx-auto font-light leading-relaxed"
              style={{
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
              }}
            >
              We're here to assist you with jewellery enquiries, customisation, savings schemes,<br className="hidden sm:inline" /> product availability, or any special requirements.
            </p>

            {/* Small Gold Diamond Accent Divider matching reference */}
            <div className="flex items-center justify-center gap-2.5 mt-3 select-none">
              <span className="w-12 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]/70"></span>
              <span className="text-[#D4AF37] text-[10px]">◆</span>
              <span className="w-12 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]/70"></span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. Main Page Content Section with Natural Vector Watermark Mandalas & Enlarged Bottom Ring */}
      <div className="relative w-full overflow-hidden">
        {/* Top-Left Side Mandala Watermark: Natural vector lines in radiant gold */}
        <div
          aria-hidden="true"
          className="absolute -top-16 -left-16 sm:-top-20 sm:-left-20 w-72 h-72 sm:w-96 sm:h-96 lg:w-[460px] lg:h-[460px] opacity-45 pointer-events-none select-none z-0"
        >
          <img
            src="/images/mandala-corner.svg"
            alt=""
            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(197,155,60,0.3)]"
          />
        </div>

        {/* Top-Right Side Mandala Watermark: Natural vector lines in radiant gold framing the enquiry form card */}
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 sm:-top-20 sm:-right-20 w-72 h-72 sm:w-96 sm:h-96 lg:w-[460px] lg:h-[460px] opacity-45 pointer-events-none select-none z-0"
        >
          <img
            src="/images/mandala-corner.svg"
            alt=""
            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(197,155,60,0.3)]"
          />
        </div>

        {/* Mid-Right Radiant Gold Mandala Flourish */}
        <div
          aria-hidden="true"
          className="absolute top-[40%] -right-20 w-64 h-64 lg:w-80 lg:h-80 opacity-35 pointer-events-none select-none z-0"
        >
          <img
            src="/images/mandala-corner.svg"
            alt=""
            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(197,155,60,0.3)]"
          />
        </div>

        {/* Enlarged Bottom-Right Image: Royal Ruby Ring on Burgundy Silk Velvet (Moved to right corner to be fully visible without card obstruction) */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-[420px] sm:w-[560px] md:w-[680px] lg:w-[780px] xl:w-[860px] max-w-[90vw] pointer-events-none select-none z-0"
        >
          <img
            src="/images/contact-bottom-ring-right.png"
            alt=""
            className="w-full h-auto object-contain object-right-bottom"
          />
        </div>

        {/* Floating Form & Information Cards Container */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Column: Premium 3-Card Contact, Location & Hours Layout (5 columns) */}
            <ScrollReveal variant="slide-left" distance={16} className="lg:col-span-5 space-y-5">
              {/* Card 1: Contact Card */}
              <div className="bg-white rounded-2xl border border-[#E5D2B8] p-5 sm:p-6 space-y-4 shadow-[0_4px_24px_rgba(180,140,80,0.08)]">
                <div className="flex items-center justify-between border-b border-[#F0E4D3] pb-3">
                  <h2 className="font-serif text-base sm:text-lg font-bold text-[#38060F] tracking-wide uppercase">
                    CONTACT DETAILS
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#C59B3C]/10 text-[#8B651B] border border-[#C59B3C]/30">
                    Direct Line
                  </span>
                </div>

                <div className="space-y-3.5 text-xs sm:text-[13px]">
                  {/* Calling Number */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#FAF5EE] border border-[#E5D2B8]/60">
                    <div className="w-8 h-8 rounded-lg bg-[#38060F] text-[#FFE28A] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                        Calling Number
                      </span>
                      <a
                        href="tel:7871166317"
                        className="text-stone-900 font-bold hover:text-[#C59B3C] text-sm tracking-wide transition-colors"
                      >
                        +91 78711 66317
                      </a>
                      <span className="block text-[10px] text-stone-500 mt-0.5">Direct Showroom Voice Line</span>
                    </div>
                  </div>

                  {/* WhatsApp Enquiry Number */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30">
                    <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                        WhatsApp Enquiry Number
                      </span>
                      <a
                        href="https://wa.me/916382573997"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-900 font-bold hover:text-emerald-700 text-sm tracking-wide transition-colors inline-flex items-center gap-1"
                      >
                        +91 63825 73997
                        <ExternalLink className="w-3 h-3 text-emerald-700" />
                      </a>
                      <span className="block text-[10px] text-emerald-700 mt-0.5">Instant Specialist Assistance</span>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#FAF5EE] border border-[#E5D2B8]/60">
                    <div className="w-8 h-8 rounded-lg bg-[#C59B3C]/20 text-[#8B651B] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                        Official Email
                      </span>
                      <a
                        href="mailto:sriramasjewel1987@gmail.com"
                        className="text-stone-900 font-medium hover:text-[#C59B3C] break-all transition-colors"
                      >
                        sriramasjewel1987@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Prominent WhatsApp CTA Button */}
                <div className="pt-1">
                  <a
                    href="https://wa.me/916382573997"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Enquire on WhatsApp with Sri Ramas Jewellery"
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#25D366] hover:bg-[#20ba59] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
                  >
                    <MessageCircle className="w-4 h-4 text-white shrink-0" />
                    <span>ENQUIRE ON WHATSAPP (+91 63825 73997)</span>
                  </a>
                </div>
              </div>

              {/* Card 2: Location Card (Clickable to Google Maps) */}
              <div className="bg-white rounded-2xl border border-[#E5D2B8] p-5 sm:p-6 space-y-3 shadow-[0_4px_24px_rgba(180,140,80,0.08)]">
                <div className="flex items-center justify-between border-b border-[#F0E4D3] pb-3">
                  <h2 className="font-serif text-base sm:text-lg font-bold text-[#38060F] tracking-wide uppercase">
                    STORE LOCATION
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#38060F]/10 text-[#38060F]">
                    Thanjavur
                  </span>
                </div>

                <a
                  href="https://maps.app.goo.gl/7sxg7JxUVmCF7CQs5?g_st=iw"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Click to open Sri Ramas Jewellery in Google Maps"
                  className="group block p-3.5 rounded-xl bg-gradient-to-br from-[#FAF5EE] to-[#FFFDF8] border border-[#C59B3C]/40 hover:border-[#C59B3C] hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#C59B3C] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-stone-900 font-bold text-sm group-hover:text-[#8B651B] transition-colors">
                          Sri Ramas Jewellery
                        </strong>
                        <Navigation className="w-3.5 h-3.5 text-[#C59B3C] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        18/995, South East Rampart,<br />
                        Near Old Bus Stand,<br />
                        Thanjavur, Tamil Nadu – 613001.
                      </p>
                      <div className="pt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#8B651B] group-hover:underline">
                        <span>Get Directions on Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </a>
              </div>

              {/* Card 3: Business Hours Card */}
              <div className="bg-white rounded-2xl border border-[#E5D2B8] p-5 sm:p-6 space-y-3 shadow-[0_4px_24px_rgba(180,140,80,0.08)]">
                <div className="flex items-center justify-between border-b border-[#F0E4D3] pb-3">
                  <h2 className="font-serif text-base sm:text-lg font-bold text-[#38060F] tracking-wide uppercase">
                    BUSINESS HOURS
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Open 365 Days
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#E5D2B8]/60 text-center space-y-1">
                    <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-semibold">
                      Opening Time
                    </span>
                    <span className="text-stone-900 font-extrabold text-sm block">9:00 AM</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#E5D2B8]/60 text-center space-y-1">
                    <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-semibold">
                      Closing Time
                    </span>
                    <span className="text-stone-900 font-extrabold text-sm block">9:30 PM</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-medium">
                    Holidays: <strong>No holidays</strong> (Open all days of the week).
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Card: Submit a Showcase Enquiry (7 columns) */}
            <ScrollReveal
              variant="slide-right"
              distance={16}
              delay={80}
              className="lg:col-span-7 bg-white rounded-2xl border border-[#E5D2B8] p-6 sm:p-8 md:p-10 shadow-[0_4px_24px_rgba(180,140,80,0.08)]"
            >
              {submissionSuccess ? (
                <div className="text-center py-10 space-y-5 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-burgundy-950">
                    Enquiry Successfully Registered &amp; Saved
                  </h3>
                  <p className="text-sm text-stone-600">
                    Your official enquiry reference number is:
                  </p>
                  <div className="inline-block bg-[#FCF7EC] border border-gold-400 px-6 py-2.5 rounded-xl font-mono font-bold text-burgundy-950 text-2xl tracking-wider shadow-sm">
                    {submissionSuccess.refNumber}
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 max-w-md mx-auto space-y-1">
                    <p className="font-bold">✓ Saved in Admin Enquiry CRM</p>
                    <p className="text-[11px] text-emerald-800">
                      Your enquiry details have been registered and our showroom advisors have opened the conversation on WhatsApp.
                    </p>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={submissionSuccess.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 text-white shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.98.69.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
                      </svg>
                      <span>Open WhatsApp Conversation</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-xs"
                    >
                      Submit Another Enquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#38060F] tracking-wide uppercase">
                      SUBMIT A SHOWCASE ENQUIRY
                    </h2>
                    <p className="text-xs sm:text-[13px] text-stone-600 font-normal mt-1 mb-5">
                      Share your requirements with us and our team will get in touch shortly.
                    </p>
                  </div>

                  {/* Selected Product Context Banner */}
                  {selectedProduct && (
                    <div className="bg-[#FAF4EA] rounded-xl border border-gold-400/60 p-3.5 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-burgundy-900 text-gold-300 flex items-center justify-center shrink-0">
                          <Gem className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 block">
                            Enquiring About Selected Jewellery Piece
                          </span>
                          <h4 className="font-serif font-bold text-xs sm:text-sm text-burgundy-950 truncate">
                            {selectedProduct.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-stone-600 font-mono">
                            <span>SKU: {selectedProduct.sku}</span>
                            {selectedProduct.category && <span>• {selectedProduct.category}</span>}
                            {selectedProduct.metalType && <span>• {selectedProduct.metalType}</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null);
                          setValue('enquiryType', 'GENERAL');
                          setValue('message', '');
                        }}
                        className="p-1 rounded-lg hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 shrink-0"
                        title="Clear product selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Selected Savings Scheme Context Banner */}
                  {selectedScheme && !selectedProduct && (
                    <div className="bg-[#FAF4EA] rounded-xl border border-gold-400/60 p-3.5 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-burgundy-900 text-gold-300 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 block">
                            Savings Scheme Selected
                          </span>
                          <h4 className="font-serif font-bold text-xs sm:text-sm text-burgundy-950 truncate">
                            {selectedScheme.name}
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-stone-600 line-clamp-1">
                            Submit this form to receive official scheme details, enrollment guidelines, and showroom consultation.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedScheme(null);
                          setValue('enquiryType', 'GENERAL');
                          setValue('message', '');
                        }}
                        className="p-1 rounded-lg hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 shrink-0"
                        title="Clear scheme selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
                      {errorMessage}
                    </div>
                  )}

                  {/* Field 1: YOUR FULL NAME * */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      YOUR FULL NAME *
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={80}
                        {...register('customerName')}
                        onChange={(e) => {
                          const filtered = filterAlphabeticNameInput(e.target.value);
                          setValue('customerName', filtered, { shouldValidate: true, shouldDirty: true });
                        }}
                        placeholder="e.g. Meenakshi Ramakrishnan"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm text-stone-800 focus:border-[#C59B3C] focus:outline-none bg-white transition-colors"
                      />
                    </div>
                    {errors.customerName && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.customerName.message}</p>
                    )}
                  </div>

                  {/* Field 2 & 3: Mobile & Enquiry Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                        MOBILE NUMBER (WHATSAPP PREFERRED) *
                      </label>
                      <div className="relative flex items-center">
                        <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          {...register('customerMobile')}
                          onChange={(e) => {
                            const cleaned = filterIndianMobileInput(e.target.value);
                            setValue('customerMobile', cleaned, { shouldValidate: true, shouldDirty: true });
                          }}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm text-stone-800 focus:border-[#C59B3C] focus:outline-none bg-white transition-colors"
                        />
                      </div>
                      {errors.customerMobile && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.customerMobile.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                        ENQUIRY TYPE *
                      </label>
                      <div className="relative flex items-center">
                        <LayoutGrid className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                        <select
                          {...register('enquiryType')}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm text-stone-800 focus:border-[#C59B3C] focus:outline-none bg-white transition-colors cursor-pointer"
                        >
                          <option value="GENERAL">General Enquiry</option>
                          <option value="SCHEME">Savings Scheme Enquiry</option>
                          <option value="PRODUCT">Product Enquiry</option>
                          <option value="DIGI_GOLD">DigiGold Enquiry</option>
                          <option value="DIGI_SILVER">DigiSilver Enquiry</option>
                        </select>
                      </div>
                      {errors.enquiryType && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.enquiryType.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Field 4 & 5: Email & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                        EMAIL ADDRESS (OPTIONAL)
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type="email"
                          {...register('customerEmail')}
                          placeholder="e.g. enquiry@gmail.com"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm text-stone-800 focus:border-[#C59B3C] focus:outline-none bg-white transition-colors"
                        />
                      </div>
                      {errors.customerEmail && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.customerEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                        CITY / TOWN
                      </label>
                      <div className="relative flex items-center">
                        <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          maxLength={60}
                          {...register('city')}
                          onChange={(e) => {
                            const filtered = filterAlphabeticNameInput(e.target.value).slice(0, 60);
                            setValue('city', filtered, { shouldValidate: true, shouldDirty: true });
                          }}
                          placeholder="e.g. Coimbatore"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm text-stone-800 focus:border-[#C59B3C] focus:outline-none bg-white transition-colors"
                        />
                      </div>
                      {errors.city && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.city.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Field 6 & 7: Preferred Purchase Period & Preferred Contact Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                        PREFERRED PURCHASE PERIOD
                      </label>
                      <div className="relative flex items-center">
                        <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                        <select
                          {...register('preferredPurchasePeriod')}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm text-stone-800 focus:border-[#C59B3C] focus:outline-none bg-white transition-colors cursor-pointer"
                        >
                          <option value="Within One Month">Within One Month</option>
                          <option value="1 - 3 Months">1 - 3 Months</option>
                          <option value="3 - 6 Months">3 - 6 Months</option>
                          <option value="Just Exploring">Just Exploring</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                        PREFERRED CONTACT TIME
                      </label>
                      <div className="relative flex items-center">
                        <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                        <select
                          {...register('preferredContactTime')}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm text-stone-800 focus:border-[#C59B3C] focus:outline-none bg-white transition-colors cursor-pointer"
                        >
                          <option value="ANYTIME">Anytime (10 AM - 8 PM)</option>
                          <option value="MORNING">Morning (10 AM - 1 PM)</option>
                          <option value="AFTERNOON">Afternoon (1 PM - 5 PM)</option>
                          <option value="EVENING">Evening (5 PM - 8 PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Field 8: Enquiry Message */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      ENQUIRY MESSAGE / REQUIREMENTS *
                    </label>
                    <div className="relative">
                      <PenLine className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
                      <textarea
                        rows={3}
                        {...register('message')}
                        placeholder="Tell us about the jewellery you're looking for (e.g., wedding collection, custom design, savings scheme, etc.)"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm text-stone-800 focus:border-[#C59B3C] focus:outline-none bg-white transition-colors resize-none"
                      />
                    </div>
                    {errors.message && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Action Button matching reference */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#4E0814] via-[#6B0D1D] to-[#4E0814] hover:opacity-95 text-white shadow-md hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gold-300 border-t-transparent rounded-full animate-spin" />
                        <span>Registering &amp; Opening WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <span>SUBMIT SHOWCASE ENQUIRY</span>
                        <Send className="w-4 h-4 text-gold-300 rotate-12" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};
