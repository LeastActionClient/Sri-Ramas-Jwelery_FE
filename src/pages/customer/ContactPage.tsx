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
  MessageSquare,
  CheckCircle2,
  Gem,
  X,
} from 'lucide-react';
import { enquiriesApi } from '@/services/api/enquiries.api';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
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

const formatEnquiryTypeLabel = (type?: string): string => {
  switch (type) {
    case 'PRODUCT':
      return 'Product Enquiry';
    case 'SCHEME':
      return 'Savings Scheme Enquiry';
    case 'DIGI_GOLD':
    case 'DIGIGOLD':
      return 'DigiGold Enquiry';
    case 'DIGI_SILVER':
    case 'DIGISILVER':
      return 'DigiSilver Enquiry';
    case 'GENERAL':
      return 'General Enquiry';
    default:
      return type ? type.replace(/_/g, ' ') : 'General Enquiry';
  }
};

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

  const [selectedProduct, setSelectedProduct] = useState<SelectedProductContext | null>(
    incomingProduct
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
      enquiryType: selectedProduct ? 'PRODUCT' : 'GENERAL',
      preferredContactMethod: 'WHATSAPP',
      preferredContactTime: 'ANYTIME',
      message: selectedProduct
        ? `I would like to enquire about the following jewellery product:\n\nProduct Name: ${selectedProduct.name}\nProduct SKU: ${selectedProduct.sku}\n\nPlease provide more information about this product.`
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
      const cleanMessage = sanitizeMultilineText(data.message).trim();

      // Action 1: Save enquiry to backend & MongoDB
      const res = await enquiriesApi.submitPublicEnquiry({
        enquiryType: data.enquiryType as any,
        customerName: cleanName,
        customerMobile: data.customerMobile.trim(),
        customerEmail: data.customerEmail?.trim() || undefined,
        preferredContactMethod: data.preferredContactMethod,
        preferredTimeSlot: data.preferredContactTime,
        preferredContactTime: data.preferredContactTime,
        city: cleanCity || undefined,
        message: cleanMessage,
        productId: selectedProduct?.id || undefined,
        productName: selectedProduct?.name || undefined,
        productSku: selectedProduct?.sku || undefined,
        productUrl: selectedProduct?.url || undefined,
      });

      const refNo = res.enquiryNumber;

      // Action 2: Construct comprehensive company WhatsApp message
      const enquiryTypeLabel = formatEnquiryTypeLabel(data.enquiryType);
      const preferredMethodLabel =
        data.preferredContactMethod === 'WHATSAPP'
          ? 'WhatsApp Message'
          : data.preferredContactMethod === 'CALL'
          ? 'Phone Call'
          : 'Email';

      let productDetailsBlock = '';
      if (selectedProduct?.name || selectedProduct?.sku) {
        productDetailsBlock = `\nProduct Details:\n\nProduct Name: ${selectedProduct.name}\n\nProduct SKU: ${selectedProduct.sku}`;
        if (selectedProduct.url) {
          productDetailsBlock += `\n\nProduct Link: ${selectedProduct.url}`;
        }
        productDetailsBlock += '\n';
      }

      const formattedWhatsAppMsg =
        `NEW CUSTOMER ENQUIRY — SRI RAMAS JEWELLERY\n\n` +
        `Enquiry Reference: ${refNo}\n\n` +
        `Customer Details:\n\n` +
        `Name: ${cleanName}\n\n` +
        `Customer WhatsApp Number: +91 ${data.customerMobile.trim()}\n\n` +
        `Email: ${data.customerEmail?.trim() || 'Not Provided'}\n\n` +
        `City / Town: ${cleanCity || 'Not Provided'}\n\n` +
        `Enquiry Type: ${enquiryTypeLabel}\n\n` +
        `Preferred Response Method: ${preferredMethodLabel}\n\n` +
        `Enquiry Requirements:\n${cleanMessage}\n` +
        productDetailsBlock +
        `\nPlease contact the customer and assist with this enquiry.\n\n` +
        `Thank you.\nSri Ramas Jewellery Website Enquiry`;

      const targetWhatsAppUrl = buildWhatsAppUrl({
        customMessage: formattedWhatsAppMsg,
      });

      // Safely navigate popup or redirect
      if (popupWindow && !popupWindow.closed) {
        popupWindow.location.href = targetWhatsAppUrl;
      } else {
        window.open(targetWhatsAppUrl, '_blank');
      }

      setSubmissionSuccess({
        refNumber: refNo,
        whatsappUrl: targetWhatsAppUrl,
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
    reset({
      enquiryType: 'GENERAL',
      preferredContactMethod: 'WHATSAPP',
      preferredContactTime: 'ANYTIME',
      message: '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Banner */}
      <ScrollReveal variant="fade-up" immediate>
        <div className="bg-brand-maroon-gradient text-gold-100 rounded-3xl p-8 sm:p-12 border border-gold-500/40 shadow-luxury text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-semibold uppercase tracking-widest border border-gold-400/30">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Concierge &amp; Enquiries</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-gold-100">
            Connect With Sri Ramas Jewellery
          </h1>
          <p className="text-xs sm:text-sm text-gold-200/80 max-w-xl mx-auto font-light leading-relaxed">
            Whether you have questions regarding bespoke bridal customization, savings schemes, or wish to schedule a private viewing, our specialists are at your service.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Contact Info Cards (5 cols) */}
        <ScrollReveal variant="slide-left" distance={16} className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gold-400/40 p-6 sm:p-8 space-y-6 shadow-sm transition-shadow duration-300 hover:shadow-luxury">
            <h2 className="font-serif text-xl font-bold text-burgundy-950 border-b border-stone-200 pb-3">
              Direct Contact Information
            </h2>

            <div className="space-y-4 text-xs text-stone-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 font-semibold mb-0.5">
                    {primaryStore?.name || 'Showroom Address'}
                  </strong>
                  <span>
                    {storeAddress || 'Showroom advisory and viewing by appointment.'}
                  </span>
                </div>
              </div>

              {primaryPhones.length > 0 && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 font-semibold mb-0.5">Telephone Lines</strong>
                    <div className="flex flex-wrap gap-x-3">
                      {primaryPhones.map((num, idx) => (
                        <a key={idx} href={`tel:${num.replace(/\s+/g, '')}`} className="hover:text-gold-700 font-medium">
                          {num}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {primaryStore?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gold-600 shrink-0" />
                  <div>
                    <strong className="block text-stone-900 font-semibold mb-0.5">Electronic Mail</strong>
                    <a href={`mailto:${primaryStore.email}`} className="hover:text-gold-700">
                      {primaryStore.email}
                    </a>
                  </div>
                </div>
              )}

              {primaryStore?.openingHours &&
                !primaryStore.openingHours.toLowerCase().includes('confirm') && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-stone-900 font-semibold mb-0.5">Visiting Hours</strong>
                      <span>{primaryStore.openingHours}</span>
                    </div>
                  </div>
                )}
            </div>

            {/* Redesigned High-Contrast WhatsApp Instant Chat Button */}
            <div className="pt-4 border-t border-stone-200">
              <a
                href={instantChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instant Chat on WhatsApp with Sri Ramas Jewellery"
                className="w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-white shrink-0"
                  aria-hidden="true"
                >
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.98.69.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
                </svg>
                <span>Instant Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* Right: Universal Enquiry Form (7 cols) */}
        <ScrollReveal
          variant="slide-right"
          distance={16}
          delay={80}
          className="lg:col-span-7 bg-white rounded-2xl border border-gold-400/40 p-6 sm:p-10 shadow-luxury"
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
                  Your enquiry details and product specifications have been registered. The company WhatsApp desk conversation has been opened.
                </p>
              </div>

              {/* Direct Fallback WhatsApp Button in case popup was blocked */}
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
                <h2 className="font-serif text-2xl font-bold text-burgundy-950">
                  Submit a Showcase Enquiry
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Sri Ramas Jewellery is strictly an enquiry and boutique showroom platform.
                </p>
              </div>

              {/* Selected Product Context Banner */}
              {selectedProduct && (
                <div className="bg-[#FAF4EA] rounded-xl border border-gold-400/60 p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-burgundy-900 text-gold-300 flex items-center justify-center shrink-0">
                      <Gem className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 block">
                        Enquiring About Selected Jewellery Piece
                      </span>
                      <h4 className="font-serif font-bold text-sm text-burgundy-950 truncate">
                        {selectedProduct.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-stone-600 font-mono">
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
                    className="p-1.5 rounded-lg hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 shrink-0"
                    title="Clear product selection"
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

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Your Full Name <span className="text-burgundy-700">*</span>
                </label>
                <input
                  type="text"
                  maxLength={80}
                  {...register('customerName')}
                  onChange={(e) => {
                    const filtered = filterAlphabeticNameInput(e.target.value);
                    setValue('customerName', filtered, { shouldValidate: true, shouldDirty: true });
                  }}
                  placeholder="e.g. Meenakshi Ramanathan"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs focus:border-gold-500 outline-none"
                />
                {errors.customerName && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.customerName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Mobile Number (WhatsApp Number) <span className="text-burgundy-700">*</span>
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1">
                    Please provide your active WhatsApp mobile number. Our advisors will message you directly on this number.
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-500 text-xs font-medium">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      {...register('customerMobile')}
                      onChange={(e) => {
                        const cleaned = filterIndianMobileInput(e.target.value);
                        setValue('customerMobile', cleaned, { shouldValidate: true, shouldDirty: true });
                      }}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-3 py-2.5 rounded-lg border border-stone-300 text-xs focus:border-gold-500 outline-none"
                    />
                  </div>
                  {errors.customerMobile && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.customerMobile.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Enquiry Type <span className="text-burgundy-700">*</span>
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1">
                    Select the service you wish to enquire about.
                  </p>
                  <select
                    {...register('enquiryType')}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs focus:border-gold-500 outline-none bg-white font-medium text-stone-800"
                  >
                    <option value="PRODUCT">Product Enquiry</option>
                    <option value="SCHEME">Savings Scheme Enquiry</option>
                    <option value="DIGI_GOLD">DigiGold Enquiry</option>
                    <option value="DIGI_SILVER">DigiSilver Enquiry</option>
                    <option value="GENERAL">General Enquiry</option>
                  </select>
                  {errors.enquiryType && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.enquiryType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    {...register('customerEmail')}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs focus:border-gold-500 outline-none"
                  />
                  {errors.customerEmail && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.customerEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    {...register('city')}
                    onChange={(e) => {
                      const filtered = filterAlphabeticNameInput(e.target.value).slice(0, 60);
                      setValue('city', filtered, { shouldValidate: true, shouldDirty: true });
                    }}
                    placeholder="e.g. Chennai, Coimbatore"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs focus:border-gold-500 outline-none"
                  />
                  {errors.city && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.city.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Preferred Response Method
                  </label>
                  <select
                    {...register('preferredContactMethod')}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-xs focus:border-gold-500 outline-none bg-white"
                  >
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="CALL">Phone Call</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Preferred Contact Time
                  </label>
                  <select
                    {...register('preferredContactTime')}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-xs focus:border-gold-500 outline-none bg-white"
                  >
                    <option value="ANYTIME">Anytime (10 AM - 8 PM)</option>
                    <option value="MORNING">Morning (10 AM - 1 PM)</option>
                    <option value="AFTERNOON">Afternoon (1 PM - 5 PM)</option>
                    <option value="EVENING">Evening (5 PM - 8 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Enquiry Message / Requirements <span className="text-burgundy-700">*</span>
                </label>
                <textarea
                  rows={4}
                  {...register('message')}
                  placeholder="Tell us about the jewellery items you are looking for, wedding dates, or showroom visit preferences..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs focus:border-gold-500 outline-none resize-none"
                />
                {errors.message && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.message.message}</p>
                )}
              </div>

              {/* Single action button: Saves to MongoDB & Dispatches to Company WhatsApp */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-burgundy-900 hover:bg-burgundy-800 text-gold-100 shadow-md hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gold-300 border-t-transparent rounded-full animate-spin" />
                    <span>Registering &amp; Opening WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Showcase Enquiry</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.98.69.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </ScrollReveal>
      </div>
    </div>
  );
};
