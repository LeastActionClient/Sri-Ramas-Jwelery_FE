import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Mail, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';
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
import { ScrollReveal, AnimatedCTA } from '@/components/motion';

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

export const ContactPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { primaryStore, buildWhatsAppUrl } = useStoreWhatsApp();
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
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
    defaultValues: {
      preferredContactMethod: 'WHATSAPP',
      preferredContactTime: 'ANYTIME',
    },
  });

  const nameVal = watch('customerName');

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const cleanName = stripHtmlAndControlChars(data.customerName).trim();
      const cleanCity = data.city ? stripHtmlAndControlChars(data.city).trim() : '';
      const cleanMessage = sanitizeMultilineText(data.message).trim();
      const res = await enquiriesApi.submitPublicEnquiry({
        enquiryType: 'GENERAL',
        customerName: cleanName,
        customerMobile: data.customerMobile.trim(),
        customerEmail: data.customerEmail?.trim() || undefined,
        preferredContactMethod: data.preferredContactMethod,
        preferredTimeSlot: data.preferredContactTime,
        preferredContactTime: data.preferredContactTime,
        city: cleanCity || undefined,
        message: cleanMessage,
      });
      setRefNumber(res.enquiryNumber);
      reset();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          'Unable to send enquiry. Please contact us via phone or WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Banner */}
      <ScrollReveal variant="fade-up" immediate>
        <div className="bg-brand-maroon-gradient text-gold-100 rounded-2xl p-8 sm:p-12 border border-gold-500/40 shadow-luxury text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-semibold uppercase tracking-widest border border-gold-400/30">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Concierge & Enquiries</span>
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

            <div className="pt-4 border-t border-stone-200">
              <AnimatedCTA
                variant="whatsapp"
                href={buildWhatsAppUrl({ type: 'GENERAL' })}
                target="_blank"
                rel="noopener noreferrer"
                icon={<MessageSquare className="w-4 h-4" />}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md"
              >
                Instant Chat on WhatsApp
              </AnimatedCTA>
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
          {refNumber ? (
            <div className="text-center py-10 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-burgundy-950">
                Enquiry Successfully Registered
              </h3>
              <p className="text-sm text-stone-600">
                Your enquiry reference number is:
              </p>
              <div className="inline-block bg-gold-100 border border-gold-400 px-5 py-2 rounded-lg font-mono font-bold text-burgundy-950 text-xl tracking-wider">
                {refNumber}
              </div>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Our jewellery consultant will reach out via your preferred method. You can also quote this reference number on WhatsApp.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <a
                  href={buildWhatsAppUrl({
                    type: 'GENERAL',
                    referenceId: refNumber,
                    customerName: nameVal,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-xs flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Continue on WhatsApp
                </a>
                <button
                  onClick={() => setRefNumber(null)}
                  className="px-5 py-2.5 rounded-lg border border-stone-300 text-stone-700 font-medium text-xs"
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
                    Mobile Number <span className="text-burgundy-700">*</span>
                  </label>
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

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Enquiry Message / Requirements <span className="text-burgundy-700">*</span>
                </label>
                <textarea
                  rows={4}
                  {...register('message')}
                  placeholder="Tell us about the jewellery items you are looking for, wedding dates, or showroom visit preferences..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs focus:border-gold-500 outline-none resize-none"
                />
                {errors.message && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.message.message}</p>
                )}
              </div>

              <AnimatedCTA
                variant="burgundy"
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md"
              >
                {isSubmitting ? 'Registering Enquiry...' : 'Submit Showcase Enquiry'}
              </AnimatedCTA>
            </form>
          )}
        </ScrollReveal>
      </div>
    </div>
  );
};
