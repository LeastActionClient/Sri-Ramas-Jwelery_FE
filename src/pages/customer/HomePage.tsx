import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  ShieldCheck,
  Award,
  Gem,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import heroVideo from '@/assets/gemini_generated_video_069d4352.mp4';
import { cmsApi } from '@/services/api/cms.api';
import { productsApi } from '@/services/api/products.api';
import { categoriesApi } from '@/services/api/categories.api';
import { schemesApi } from '@/services/api/schemes.api';
import { useRates } from '@/hooks/useRates';
import { ProductCard } from '@/components/customer/ProductCard';
import { BullionRatesPanel } from '@/components/customer/BullionRatesPanel';
import { CategoryCarousel } from '@/components/customer/CategoryCarousel';
import { PromotionalBannerCarousel } from '@/components/customer/PromotionalBannerCarousel';
import { FounderLegacySection } from '@/components/customer/FounderLegacySection';
import { BisTrustSection } from '@/components/customer/BisTrustSection';
import { SEO } from '@/components/common/SEO';
import {
  AnimatedCTA,
  AnimatedHeading,
  ScrollReveal,
  StaggerReveal
} from '@/components/motion';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { MOTION_EASE_GSAP, ensureGsapRegistered } from '@/utils/motion';
import { StoreLocation } from '@/types';

const ShowroomCard: React.FC<{
  store: StoreLocation;
  isSingleLayout: boolean;
  whatsappHref: string;
}> = ({ store, isSingleLayout }) => {
  const fullAddress =
    [
      store.addressLine1 || store.address,
      store.addressLine2,
      [store.city, store.state].filter(Boolean).join(', '),
      store.postalCode || store.pincode,
    ]
      .filter(Boolean)
      .join(', ') || '18/995, South East Rampart, Near Old Bus Stand, Thanjavur, Tamil Nadu – 613001';

  const directionsUrl = 'https://maps.app.goo.gl/7sxg7JxUVmCF7CQs5?g_st=iw';
  const callingNumber = '7871166317';
  const whatsappUrl = 'https://wa.me/916382573997';

  // Use CMS-configured image if provided, otherwise the generated South Indian gold jewellery background
  const bgImage = store.imageUrl || store.images?.[0] || '/images/showroom-jewellery-bg.jpg';

  return (
    <ScrollReveal variant="fade-up" distance={20}>
      <article
        className={`group/showroom relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-[#C49A3A]/70 hover:border-[#E5C775] shadow-luxury hover:shadow-[0_24px_50px_-10px_rgba(56,7,17,0.55)] transition-all duration-500 ease-out bg-[#1A0307] ${
          isSingleLayout ? 'max-w-6xl mx-auto w-full' : 'w-full'
        }`}
      >
        {/* Background South Indian Gold Jewellery Visual */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src={bgImage}
            alt="Sri Ramas Showroom Jewellery Ambiance"
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/showroom:scale-[1.04]"
          />
          {/* Deep Burgundy & Dark Wine Gradient Scrim - Horizontal (Left-to-Right contrast protection) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(20, 2, 5, 0.97) 0%, rgba(36, 5, 11, 0.92) 42%, rgba(24, 3, 7, 0.68) 72%, rgba(20, 2, 5, 0.35) 100%)',
            }}
          />
          {/* Top-to-Bottom Vignette (Softens top chandelier light for 100% badge & title visibility) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(18, 2, 5, 0.82) 0%, rgba(24, 3, 7, 0.30) 45%, rgba(18, 2, 5, 0.85) 100%)',
            }}
          />
          {/* Warm Ambient Golden Corner Aura */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-[#C49A3A]/20 blur-3xl group-hover/showroom:bg-[#C49A3A]/30 transition-colors duration-500"
          />
        </div>

        {/* Showroom Details Content Layer (Expanded Card Size & High-Visibility Content) */}
        <div className="relative z-10 p-8 sm:p-10 lg:p-14 flex flex-col justify-between gap-8 min-h-[380px] sm:min-h-[420px] lg:min-h-[460px]">
          <div className="space-y-5 max-w-3xl">
            {/* Showroom Location / City Badge (100% High Visibility Solid Pill) */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A0307]/95 border-2 border-[#D4AF37] text-[#FFE28A] text-xs sm:text-sm font-extrabold uppercase tracking-[0.24em] shadow-xl backdrop-blur-md">
                <MapPin className="w-4 h-4 text-[#FFE28A] shrink-0" />
                <span className="drop-shadow-sm">Thanjavur • Tamil Nadu</span>
              </span>

              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-brand-gold-gradient text-burgundy-950 text-xs font-bold uppercase tracking-wider shadow-lg">
                Flagship Boutique Since 1987
              </span>
            </div>

            {/* Showroom Name (Bold & Large with Strong Contrast Shadow) */}
            <div>
              <h3
                className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-wide leading-tight group-hover/showroom:text-[#FFE8A3] transition-colors"
                style={{
                  textShadow:
                    '0 4px 20px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.85)',
                }}
              >
                Sri Ramas Jewellery
              </h3>
            </div>

            {/* Address & Phone (High Contrast Pure White & Gold, Large & Clearly Visible) */}
            <div className="space-y-4 pt-2">
              {/* Clickable Address directly opening Google Maps */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Click to open Sri Ramas Jewellery in Google Maps"
                className="group/addr inline-flex items-start gap-3.5 text-sm sm:text-base lg:text-lg font-medium text-white hover:text-[#FFE8A3] leading-relaxed transition-colors cursor-pointer"
                style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)' }}
              >
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#E5C775] shrink-0 mt-0.5 group-hover/addr:scale-110 transition-transform" />
                <span className="text-white group-hover/addr:text-[#FFE8A3] font-semibold underline decoration-[#E5C775]/50 underline-offset-4">
                  {fullAddress}
                </span>
              </a>

              {/* Calling Number */}
              <div
                className="flex items-center gap-3.5 text-sm sm:text-base lg:text-lg"
                style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)' }}
              >
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-[#E5C775] shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-gold-200/80 text-xs sm:text-sm">Call Us:</span>
                  <a
                    href={`tel:${callingNumber}`}
                    className="font-bold text-[#FFE8A3] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C775] rounded underline-offset-4 hover:underline"
                  >
                    +91 78711 66317
                  </a>
                </div>
              </div>

              {/* Showroom Timings */}
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#E5C775] pt-1">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5C775] shrink-0" />
                <span>
                  Hours: <strong className="text-white">9:00 AM – 9:30 PM</strong> (Open All 7 Days • No Holidays)
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Get Directions & Enquire on WhatsApp */}
          <div className="pt-6 border-t border-[#C49A3A]/40 flex flex-wrap items-center justify-between gap-4">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-xl border-2 border-[#E5C775] hover:border-[#FFF1C2] bg-[#1A0307]/80 hover:bg-[#C49A3A]/25 text-[#FFE8A3] hover:text-white font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C775]"
            >
              <ExternalLink className="w-4 h-4 text-[#E5C775]" />
              <span>Get Directions (Google Maps)</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 sm:px-9 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_6px_24px_rgba(37,211,102,0.4)] hover:shadow-[0_8px_30px_rgba(37,211,102,0.55)] border border-emerald-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-white shrink-0"
                aria-hidden="true"
              >
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.98.69.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
              </svg>
              <span>Enquire on WhatsApp (+91 63825 73997)</span>
            </a>
          </div>
        </div>
      </article>
    </ScrollReveal>
  );
};

export const HomePage: React.FC = () => {
  const heroContainerRef = useRef<HTMLElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const { buildWhatsAppUrl } = useStoreWhatsApp();

  useGSAP(
    () => {
      ensureGsapRegistered();
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduceMotion: '(prefers-reduced-motion: reduce)',
          desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
          compact: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const { reduceMotion, desktop } = context.conditions || {};
          if (reduceMotion) return;

          const tl = gsap.timeline({
            defaults: { ease: MOTION_EASE_GSAP },
          });

          tl.fromTo(
            '.hero-bg-layer',
            { opacity: 0.7 },
            { opacity: 1, duration: 0.9, ease: 'power2.out', clearProps: 'opacity' },
            0
          )
            .fromTo(
              '.hero-badge',
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.55, clearProps: 'transform,opacity' },
              0.08
            )
            .fromTo(
              '.hero-headline-line',
              { opacity: 0, yPercent: 28 },
              { opacity: 1, yPercent: 0, duration: 0.75, stagger: 0.14, clearProps: 'transform,opacity' },
              0.2
            )
            .fromTo(
              '.hero-desc',
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.65, clearProps: 'transform,opacity' },
              0.42
            )
            .fromTo(
              '.hero-cta-item',
              { opacity: 0, y: 12 },
              { opacity: 1, y: 0, duration: 0.55, stagger: 0.09, clearProps: 'transform,opacity' },
              0.52
            )
            .fromTo(
              '.hero-trust-item',
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, clearProps: 'transform,opacity' },
              0.7
            );

          if (desktop) {
            gsap.to('.hero-bg-parallax', {
              yPercent: 9,
              ease: 'none',
              scrollTrigger: {
                trigger: heroContainerRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.85,
              },
            });
          }
        }
      );

      return () => mm.revert();
    },
    { scope: heroContainerRef }
  );

  const {
    data: liveRates,
    isLoading: ratesLoading,
    isError: ratesError,
    refetch: refetchRates,
  } = useRates();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const {
    data: featuredProducts = [],
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getFeaturedProducts({ limit: 24 }),
  });

  const {
    data: stores = [],
    isLoading: storesLoading,
    isError: storesError,
    refetch: refetchStores,
  } = useQuery({
    queryKey: ['stores'],
    queryFn: cmsApi.getStores,
  });

  const { data: activeSchemes = [] } = useQuery({
    queryKey: ['schemes'],
    queryFn: schemesApi.getSchemes,
  });

  const { data: digiGoldContent } = useQuery({
    queryKey: ['digi', 'gold'],
    queryFn: () => cmsApi.getDigiContent('GOLD'),
  });

  const {
    data: promotionalBanners = [],
    isLoading: bannersLoading,
  } = useQuery({
    queryKey: ['banners', 'HOME_HERO'],
    queryFn: () => cmsApi.getPublicBanners('HOME_HERO'),
    staleTime: 5000,
  });

  const activeCategories = useMemo(
    () => categories.filter((cat) => cat.isActive !== false && !cat.parentCategory),
    [categories]
  );

  const visibleFeaturedProducts = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return featuredProducts;
    }
    return featuredProducts.filter((product) => product.categoryId === selectedCategoryId);
  }, [featuredProducts, selectedCategoryId]);

  const primaryScheme = activeSchemes[0];

  return (
    <div className="space-y-8 lg:space-y-10 pb-10">
      <SEO
        title="Sri Ramas Jewellery | Traditional Gold & Silver Jewellery"
        description="Discover elegant gold and silver jewellery at Sri Ramas Jewellery. Explore traditional designs, bridal collections and timeless jewellery craftsmanship."
        canonical="https://sriramasjewellery.com/"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'JewelryStore',
          name: 'Sri Ramas Jewellery',
          alternateName: 'Sri Ramas Jewellery Thanjavur',
          url: 'https://sriramasjewellery.com',
          logo: 'https://sriramasjewellery.com/logo.jpg',
          image:
            'https://res.cloudinary.com/m7bmcsh3/image/upload/v1795010070/sri-ramas-jewellery/categories/vr78lceiy1fsfyqdnycx.png',
          description:
            'Heritage South Indian jewellery showroom established in 1987 in Thanjavur. Renowned for 100% BIS 916 hallmarked bridal gold, temple harams, antique bangles, and 925 sterling silver.',
          telephone: '+91 78711 66317',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '18/995, South East Rampart, Near Old Bus Stand',
            addressLocality: 'Thanjavur',
            addressRegion: 'Tamil Nadu',
            postalCode: '613001',
            addressCountry: 'IN'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 10.787,
            longitude: 79.1378
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              opens: '09:00',
              closes: '21:30'
            }
          ],
          priceRange: '₹₹₹',
          currenciesAccepted: 'INR',
          sameAs: [
            'https://www.instagram.com/sriramasjewellery_official',
            'https://www.facebook.com/sriramasjewellery',
            'https://www.youtube.com/@sriramasjewellery'
          ]
        }}
      />

      {/* 1. HERO SECTION: Full Ambient Background Video + Luxury Jewellery Showcase */}
      <section
        ref={heroContainerRef}
        id="hero-section"
        className="relative overflow-hidden bg-burgundy-950 text-gold-100 border-b-2 border-gold-600/40 min-h-[100svh] min-h-screen sm:min-h-screen lg:min-h-[92vh] xl:h-screen pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-20 lg:pb-10 flex items-end sm:items-center w-full max-w-full"
      >
        <div className="hero-bg-layer absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="hero-bg-parallax w-full h-full">
            <video
              src={heroVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center scale-100 sm:scale-105 lg:scale-[1.22] brightness-[1.06] contrast-[1.04]"
            />
          </div>
          {/* 
            Mobile-optimized gradient:
            - On mobile (< lg): Soft vertical gradient (dark at bottom for text legibility, clear & luminous at center/top for video visibility)
            - On desktop (>= lg): Horizontal gradient protecting text on the left while showcasing jewellery on the right
          */}
          <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950/95 via-burgundy-950/35 to-black/25 lg:bg-gradient-to-r lg:from-burgundy-950/92 lg:via-burgundy-950/60 lg:to-burgundy-950/35" />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="flex items-center">
            {/* Hero Campaign Headline & Trust Actions */}
            <div className="max-w-2xl space-y-3 sm:space-y-5 text-center lg:text-left mx-auto lg:mx-0">
              <div className="hero-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-burgundy-950/70 border border-gold-400/40 backdrop-blur-md shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                <span className="text-[9px] sm:text-[11px] font-serif uppercase tracking-[0.2em] text-gold-300 font-medium">
                  Heritage South Indian Jewellery • Estd. 1987
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl xl:text-[52px] font-extrabold tracking-wide text-gold-100 leading-tight sm:leading-[1.16] drop-shadow-lg">
                <span className="block overflow-hidden">
                  <span className="hero-headline-line block">Purity in Every Grain.</span>
                </span>
                <span className="block overflow-hidden mt-0.5">
                  <span className="hero-headline-line block text-gold-gradient">
                    Elegance Across Generations.
                  </span>
                </span>
              </h1>

              <p className="hero-desc text-[11px] sm:text-sm lg:text-base text-gold-100/90 max-w-lg font-light leading-relaxed mx-auto lg:mx-0 drop-shadow-md line-clamp-2 sm:line-clamp-none">
                Welcome to Sri Ramas Jewellery. Celebrating 39 years of royal South Indian craftsmanship, BIS 916 Hallmarked bridal gold, exquisite temple jewellery, and certified diamonds.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-1">
                <div className="hero-cta-item">
                  <AnimatedCTA
                    to="/products"
                    variant="gold"
                    icon={<ArrowRight className="w-4 h-4" />}
                    className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-bold shadow-luxury-gold"
                  >
                    <span>Explore Collections</span>
                  </AnimatedCTA>
                </div>
                <div className="hero-cta-item">
                  <a
                    href={buildWhatsAppUrl({ type: 'GENERAL' })}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Connect with Sri Ramas Jewellery WhatsApp Advisor"
                    className="group inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm tracking-wide shadow-[0_8px_24px_rgba(37,211,102,0.38)] hover:shadow-[0_12px_32px_rgba(37,211,102,0.52)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-emerald-400/50 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    >
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.98.69.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
                    </svg>
                    <span>WhatsApp Advisor</span>
                  </a>
                </div>
              </div>

              {/* Staggered Trust Indicators */}
              <div className="pt-2.5 sm:pt-4 border-t border-gold-400/20 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-gold-200/90">
                <div className="hero-trust-item inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>BIS 916 HUID Hallmarked</span>
                </div>
                <div className="hero-trust-item inline-flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>39+ Years Craftsmanship</span>
                </div>
                <div className="hero-trust-item hidden min-[400px]:inline-flex sm:inline-flex items-center gap-1.5">
                  <Gem className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>In-Showroom Certified Diamonds</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. TODAY'S BULLION RATES SECTION */}
      <BullionRatesPanel
        rates={liveRates}
        isLoading={ratesLoading}
        isError={ratesError}
        onRetry={() => refetchRates()}
      />

      {/* 3. JEWELLERY CATEGORIES SECTION (SHOP BY CATEGORY) */}
      <section className="bg-white py-6 sm:py-8 w-full">
        <CategoryCarousel
          categories={activeCategories.length > 0 ? activeCategories : categories}
          isLoading={categoriesLoading}
          isError={categoriesError}
          onRetry={() => refetchCategories()}
        />
      </section>

      {/* 4. PROMOTIONAL SILVER & HERITAGE CAMPAIGN CAROUSEL (CMS Driven) - Full-Bleed Banner Section */}
      <div className="!mt-0 !mb-0 w-full max-w-full p-0">
        <PromotionalBannerCarousel
          banners={promotionalBanners}
          isLoading={bannersLoading}
        />
      </div>

      {/* 4. FEATURED BRIDAL & HEIRLOOM PIECES (Product Listing with Dynamic Side Decorations) */}
      <section className="relative w-full overflow-hidden py-4 sm:py-6">
        {/* Extreme Left Champagne-Gold Floral Ornamental Strip: Repeats seamlessly down entire section height on desktop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bottom-0 z-0 w-[72px] xl:w-[84px] opacity-90 select-none hidden lg:block"
          style={{
            backgroundImage: "url('/images/floral-ornament-left-tile.png')",
            backgroundRepeat: 'repeat-y',
            backgroundPosition: 'left top',
            backgroundSize: '100% auto',
          }}
        />

        {/* Extreme Right Champagne-Gold Floral Ornamental Strip: Repeats seamlessly down entire section height on desktop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 z-0 w-[72px] xl:w-[84px] opacity-90 select-none hidden lg:block"
          style={{
            backgroundImage: "url('/images/floral-ornament-right-tile.png')",
            backgroundRepeat: 'repeat-y',
            backgroundPosition: 'right top',
            backgroundSize: '100% auto',
          }}
        />

        {/* Inner Content Container: Full width on mobile, balanced spacing on desktop */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <AnimatedHeading
              kicker="Masterpiece Showcase"
              title="Curated Featured Pieces"
              showRule
              kickerClassName="text-gold-700 tracking-[0.22em]"
              titleClassName="text-3xl font-bold text-burgundy-950 mt-1"
            />
            <AnimatedCTA
              to="/products"
              variant="outline"
              icon={<ArrowRight className="w-4 h-4 text-gold-600" />}
              className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border-gold-500/70 shrink-0"
            >
              <span>Browse All Pieces</span>
            </AnimatedCTA>
          </div>

        {/* Dynamic Category Filter Tabs */}
        {activeCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Filter featured pieces by category">
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === 'all'}
              onClick={() => setSelectedCategoryId('all')}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                selectedCategoryId === 'all'
                  ? 'bg-[#450A13] text-[#F9E7BC] border-[#450A13] shadow-sm'
                  : 'bg-[#FCF7EC] text-[#5C3D35] border-[#DFC389] hover:border-[#A4792B] hover:text-[#450A13]'
              }`}
            >
              All Products
            </button>
            {activeCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat._id;
              return (
                <button
                  key={cat._id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategoryId(cat._id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                    isSelected
                      ? 'bg-[#450A13] text-[#F9E7BC] border-[#450A13] shadow-sm'
                      : 'bg-[#FCF7EC] text-[#5C3D35] border-[#DFC389] hover:border-[#A4792B] hover:text-[#450A13]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Featured Product Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl overflow-hidden border border-gold-200">
                <div className="aspect-square bg-[#E9D7B7]/60" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                  <div className="h-4 bg-stone-200 rounded w-4/5" />
                  <div className="h-8 bg-stone-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="bg-[#FCF7EC] p-8 text-center rounded-xl border border-[#DEC48C] space-y-3">
            <p className="text-sm font-semibold text-[#450A13]">
              Unable to load curated showcase pieces right now.
            </p>
            <button
              type="button"
              onClick={() => refetchFeatured()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#450A13] text-[#F9E7BC] text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : visibleFeaturedProducts.length > 0 ? (
          <StaggerReveal
            key={selectedCategoryId}
            staggerMs={55}
            className={`grid gap-4 sm:gap-6 ${
              visibleFeaturedProducts.length <= 2
                ? 'grid-cols-1 min-[480px]:grid-cols-2 max-w-2xl mx-auto'
                : visibleFeaturedProducts.length === 3
                ? 'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {visibleFeaturedProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </StaggerReveal>
        ) : (
          <div className="bg-white p-10 text-center rounded-xl border border-stone-200 space-y-3">
            <p className="text-stone-600 text-sm">
              {selectedCategoryId === 'all'
                ? 'Explore our complete jewellery showcase in the catalogue.'
                : 'No featured pieces are currently assigned to this category.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {selectedCategoryId !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className="px-4 py-2 rounded-lg border border-[#C69B3D] text-[#450A13] text-xs font-semibold hover:bg-[#FCF7EC]"
                >
                  Show All Featured Pieces
                </button>
              )}
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-burgundy-900 text-gold-200 font-medium text-xs"
              >
                Open Catalogue
              </Link>
            </div>
          </div>
        )}
        </div>
      </section>

      {/* 4B. FOUNDER & OUR LEGACY SECTION (Bilingual Tamil / English & Client Banner) */}
      <FounderLegacySection />

      {/* 4C. BIS 100% CERTIFIED JEWELLERY TRUST SECTION */}
      <BisTrustSection />

      {/* 5. ROYAL TEMPLE JEWELLERY & BRIDAL HERITAGE EDITORIAL SHOWCASE */}
      <section className="relative w-full bg-[#FAF5EE] py-8 sm:py-12 border-y border-[#D4AF37]/30 overflow-hidden">
        {/* Subtle Ambient Decorative Gold Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gold-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-burgundy-900/5 blur-3xl"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left: High-Resolution Temple Bridal Masterpiece Photograph (5 cols on lg) */}
            <ScrollReveal variant="slide-left" distance={20} className="lg:col-span-5">
              <div className="relative group rounded-3xl overflow-hidden border-2 border-[#D4AF37]/60 shadow-[0_16px_40px_rgba(58,6,15,0.22)] bg-[#1A0307]">
                <img
                  src="/images/temple-bridal-heritage.jpg"
                  alt="Sri Ramas Sacred Temple Bridal Gold Jewellery Collection"
                  className="w-full h-auto max-h-[580px] object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                {/* Subtle Luxury Caption Overlay */}
                <div className="pointer-events-none absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#140205]/95 via-[#140205]/60 to-transparent p-5 sm:p-6 text-white">
                  <p className="font-serif text-sm sm:text-base font-bold text-[#FCECD7]">
                    Goddess Lakshmi Kasu Haram &amp; Nakshi Bangles
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Right: Static Description & Craftsmanship Details (7 cols on lg) */}
            <ScrollReveal variant="slide-right" distance={20} delay={80} className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-burgundy-950 tracking-tight leading-tight">
                  Sacred Temple Jewellery &amp; Bridal Grandeur
                </h2>

                <div className="space-y-3.5 text-stone-700 text-xs sm:text-sm md:text-base leading-relaxed font-light pt-1">
                  <p>
                    Hand-chiseled by generational goldsmiths, Sri Ramas Jewellery's temple bridal collection reinterprets the sacred grandeur of South Indian temple architecture. Every Kasu necklace, divine Lakshmi pendant, and nakshi bangle carries the resonance of timeless tradition and spiritual prosperity.
                  </p>
                  <p>
                    Each piece is meticulously crafted in 100% BIS 916 Hallmarked gold, adorned with hand-selected kemp stones, cabochon rubies, certified natural emeralds, and dangling freshwater pearls—creating a bridal heirloom to be cherished for generations.
                  </p>
                </div>
              </div>

              {/* 3 Luxury Craft Feature Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="bg-white/90 backdrop-blur-xs rounded-xl border border-gold-300/60 p-4 shadow-2xs hover:border-gold-500 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-burgundy-950 text-gold-300 flex items-center justify-center mb-2.5 shadow-xs">
                    <Award className="w-4 h-4 text-gold-400" />
                  </div>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-burgundy-950">
                    Hand-Carved Nakshi Work
                  </h4>
                  <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                    Ancient repoussé gold crafting depicting Goddess Lakshmi &amp; peacock motifs.
                  </p>
                </div>

                <div className="bg-white/90 backdrop-blur-xs rounded-xl border border-gold-300/60 p-4 shadow-2xs hover:border-gold-500 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-burgundy-950 text-gold-300 flex items-center justify-center mb-2.5 shadow-xs">
                    <Gem className="w-4 h-4 text-gold-400" />
                  </div>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-burgundy-950">
                    Sacred Kemp &amp; Pearls
                  </h4>
                  <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                    Antique closed-back setting with unheated natural kemp rubies and pearls.
                  </p>
                </div>

                <div className="bg-white/90 backdrop-blur-xs rounded-xl border border-gold-300/60 p-4 shadow-2xs hover:border-gold-500 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-burgundy-950 text-gold-300 flex items-center justify-center mb-2.5 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-gold-400" />
                  </div>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-burgundy-950">
                    100% BIS 916 Hallmark
                  </h4>
                  <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                    Complete purity certification and lifetime authenticity assurance.
                  </p>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/contact?type=PRODUCT&productName=Temple+Bridal+Masterpiece"
                  state={{
                    product: {
                      name: 'Temple Bridal Masterpiece Collection',
                      sku: 'SRJ-TEMPLE-BRIDAL',
                      category: 'Bridal & Temple Jewellery',
                      metalType: 'Gold',
                      purity: '22K 916 BIS Hallmark',
                    },
                  }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-burgundy-900 hover:bg-burgundy-800 text-gold-100 text-xs sm:text-sm font-semibold shadow-md transition-all group"
                >
                  <span>Enquire Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href={buildWhatsAppUrl({
                    type: 'GENERAL',
                    customMessage: 'Hello Sri Ramas Jewellery, I would like to know more about your Temple Bridal Jewellery Collection.',
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gold-600/60 hover:border-gold-600 text-burgundy-950 hover:bg-gold-500/10 text-xs sm:text-sm font-semibold transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-gold-700" />
                  <span>Enquire on WhatsApp</span>
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 6. SAVINGS SCHEME & DIGIGOLD VALUE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Card — Savings Scheme (Deep Burgundy & Antique Gold) */}
          <ScrollReveal variant="fade-up" distance={20} className="h-full">
            <div className="group/scheme h-full relative overflow-hidden bg-brand-maroon-gradient text-gold-100 p-8 sm:p-10 rounded-2xl border border-[#C69B3D]/55 hover:border-[#E4CB75]/80 shadow-luxury hover:shadow-[0_18px_40px_-12px_rgba(51,4,14,0.45)] hover:-translate-y-1 transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col justify-between space-y-6">
              {/* Subtle Antique-Gold Ornamental Corner Halo */}
              <div
                className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-[#D4AF37]/20 group-hover/scheme:scale-105 transition-transform duration-700 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -right-8 -top-8 w-44 h-44 rounded-full border border-[#D4AF37]/15 group-hover/scheme:scale-105 transition-transform duration-700 pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#F6DA8D] text-xs font-bold uppercase tracking-widest border border-[#D4AF37]/35">
                  {activeSchemes.length > 0 ? `${activeSchemes.length} Active Savings Plans` : 'Personalised Plan Enquiry'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFF6DC]">
                  Sri Ramas Jewellery Savings Schemes
                </h3>
                <p className="text-xs sm:text-sm text-[#F4E1BA]/90 leading-relaxed">
                  {primaryScheme?.shortDescription ||
                    primaryScheme?.description ||
                    primaryScheme?.benefitDescription ||
                    'Plan thoughtfully for upcoming weddings and auspicious celebrations. Explore our dedicated gold & heritage savings programmes or connect with our showroom advisors on WhatsApp.'}
                </p>

                {activeSchemes.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeSchemes.slice(0, 4).map((scheme) => (
                        <Link
                          key={scheme._id}
                          to={`/contact?type=SCHEME&scheme=${encodeURIComponent(scheme.name)}`}
                          className="group/item flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-burgundy-950/60 border border-gold-500/35 hover:border-gold-400 hover:bg-burgundy-950/85 transition-all"
                        >
                          <div className="min-w-0">
                            <p className="font-serif text-xs sm:text-[13px] font-bold text-[#FCE9BE] group-hover/item:text-gold-300 truncate">
                              {scheme.name}
                            </p>
                            {scheme.durationLabel ? (
                              <p className="text-[10px] text-gold-300/75 truncate">{scheme.durationLabel}</p>
                            ) : scheme.tenureMonths ? (
                              <p className="text-[10px] text-gold-300/75">{scheme.tenureMonths} Months</p>
                            ) : null}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gold-400 shrink-0 group-hover/item:translate-x-0.5 transition-transform" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <StaggerReveal staggerMs={70} className="space-y-2.5 text-xs sm:text-[13px] text-[#F9E8BF] pt-2">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#E6C56F] shrink-0 mt-0.5" />
                      <span>Dedicated in-showroom consultation before any enrollment</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Award className="w-4 h-4 text-[#E6C56F] shrink-0 mt-0.5" />
                      <span>Official scheme schedule and eligibility terms explained clearly in person</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-[#E6C56F] shrink-0 mt-0.5" />
                      <span>Enquiry-based guidance for bridal &amp; festival planning</span>
                    </div>
                  </StaggerReveal>
                )}
              </div>

              <div className="relative z-10 flex flex-wrap gap-3 pt-4 border-t border-[#8B6421]/50">
                <AnimatedCTA
                  to="/schemes"
                  variant="gold"
                  className="px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider"
                >
                  <span>Explore All Schemes</span>
                </AnimatedCTA>
                <AnimatedCTA
                  variant="whatsapp"
                  href={buildWhatsAppUrl({
                    type: 'SCHEME',
                    schemeName: primaryScheme?.name,
                    customMessage: primaryScheme?.whatsappMessage,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-md"
                  icon={
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.761.947 2.796.947 3.179 0 5.766-2.587 5.767-5.766.001-3.182-2.585-5.768-5.767-5.768zm0 10.455c-.911 0-1.637-.282-2.434-.783l-.174-.108-1.576.413.421-1.536-.114-.183c-.544-.871-.83-1.621-.83-2.475 0-2.584 2.103-4.686 4.688-4.686 2.583 0 4.686 2.102 4.687 4.686 0 2.585-2.103 4.688-4.688 4.688zm2.571-3.504c-.141-.07-.833-.411-.962-.458-.129-.047-.223-.07-.317.071-.094.141-.365.458-.447.552-.082.094-.165.106-.306.035-.141-.07-.597-.22-1.137-.701-.42-.375-.704-.838-.786-.979-.082-.141-.009-.217.062-.287.063-.063.141-.165.212-.247.07-.082.094-.141.141-.235.047-.094.024-.176-.012-.247-.035-.07-.317-.764-.435-1.046-.114-.275-.231-.238-.317-.242l-.271-.004c-.094 0-.247.035-.376.176-.129.141-.494.482-.494 1.176s.506 1.364.576 1.458c.07.094 1.002 1.529 2.427 2.145.339.147.604.235.811.301.341.108.652.093.898.056.274-.041.833-.341.951-.67.118-.329.118-.611.082-.67-.035-.059-.129-.094-.27-.165z" />
                    </svg>
                  }
                >
                  <span>Enquire on WhatsApp</span>
                </AnimatedCTA>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Card — DigiGold & DigiSilver Guidance (Premium Ivory + Subtle Bullion Visual) */}
          <ScrollReveal variant="fade-up" delay={110} distance={20} className="h-full">
            <div className="group/digi h-full relative overflow-hidden bg-gradient-to-br from-[#FCF7EC] via-[#FFFDF8] to-[#F5E7C9] p-8 sm:p-10 rounded-2xl border border-[#C69B3D]/60 hover:border-[#A87D24] shadow-luxury hover:shadow-[0_18px_40px_-12px_rgba(164,121,43,0.22)] hover:-translate-y-1 transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col justify-between space-y-6">
              {/* Subtle Decorative Bullion Texture */}
              <img
                src="/images/bullion-rates-banner.jpg"
                alt=""
                aria-hidden="true"
                className="hidden sm:block absolute -right-6 -bottom-6 w-52 h-52 object-cover rounded-tl-3xl opacity-20 group-hover/digi:opacity-25 group-hover/digi:scale-[1.04] transition-all duration-700 pointer-events-none select-none mix-blend-multiply"
              />
              <div
                className="absolute inset-0 bg-gradient-to-tr from-[#FCF7EC] via-[#FCF7EC]/90 to-transparent pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-[#450A13]/10 text-[#450A13] text-xs font-bold uppercase tracking-widest border border-[#450A13]/20">
                  Advisory & Consultation
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#450A13]">
                  {digiGoldContent?.headline || 'DigiGold & DigiSilver Guidance'}
                </h3>
                <p className="text-xs sm:text-sm text-[#4A2E28] leading-relaxed">
                  {digiGoldContent?.description ||
                    'Explore how digital gold and silver work alongside showroom jewellery purchases. Our specialists provide clear guidance on current market rates, purity standards, and official enquiry support.'}
                </p>
                <StaggerReveal staggerMs={70} className="space-y-2.5 text-xs sm:text-[13px] text-[#3B231E] pt-2">
                  <div className="flex items-start gap-2.5">
                    <Gem className="w-4 h-4 text-[#A4792B] shrink-0 mt-0.5" />
                    <span>Transparent daily 24K & 999 bullion rate reference updated for showroom context</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#A4792B] shrink-0 mt-0.5" />
                    <span>Personalised consultation covering documentation and current service terms</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#A4792B] shrink-0 mt-0.5" />
                    <span>Advisory-only guidance with no online wallets or automated deposits</span>
                  </div>
                </StaggerReveal>
              </div>

              <div className="relative z-10 flex flex-wrap gap-3 pt-4 border-t border-[#DFC389]/70">
                <AnimatedCTA
                  to="/digigold"
                  variant="burgundy"
                  className="px-5 py-2.5 rounded-lg bg-[#450A13] hover:bg-[#5E111E] text-[#F9E7BC] text-xs uppercase tracking-wider"
                >
                  <span>Learn About DigiGold</span>
                </AnimatedCTA>
                <AnimatedCTA
                  to="/digisilver"
                  variant="outline"
                  className="px-5 py-2.5 rounded-lg bg-white/75 text-[#450A13] text-xs"
                >
                  <span>Learn About DigiSilver</span>
                </AnimatedCTA>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 6. SHOWROOM LOCATIONS & APPOINTMENTS (Red-boxed heading removed & card expanded) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {storesLoading ? (
          <div className="max-w-6xl mx-auto bg-white rounded-3xl p-10 border border-[#DEC48C] animate-pulse space-y-4">
            <div className="h-8 bg-stone-200 rounded w-1/3" />
            <div className="h-5 bg-stone-200 rounded w-2/3" />
            <div className="h-5 bg-stone-200 rounded w-1/2" />
          </div>
        ) : storesError ? (
          <div className="max-w-xl mx-auto bg-[#FCF7EC] rounded-xl p-8 border border-[#DEC48C] text-center space-y-3">
            <p className="text-sm font-semibold text-[#450A13]">
              Unable to load showroom details right now.
            </p>
            <button
              type="button"
              onClick={() => refetchStores()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#450A13] text-[#F9E7BC] text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : stores.length > 0 ? (
          <div
            className={
              stores.length === 1
                ? 'max-w-6xl mx-auto w-full'
                : stores.length === 2
                ? 'grid grid-cols-1 lg:grid-cols-2 max-w-6xl mx-auto gap-8 w-full'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full'
            }
          >
            {stores.map((store) => (
              <ShowroomCard
                key={store._id}
                store={store}
                isSingleLayout={stores.length === 1}
                whatsappHref={buildWhatsAppUrl({
                  type: 'SHOWROOM',
                  storeName: store.name,
                  phoneNumber: store.whatsappNumber || store.phone,
                })}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 border border-gold-300/60 text-center space-y-3">
            <MapPin className="w-8 h-8 text-gold-600 mx-auto" />
            <h3 className="font-serif font-bold text-lg text-burgundy-950">
              Showroom Details Updating
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Our active showroom branches are managed directly from the Sri Ramas admin console. Reach our advisors on WhatsApp for location guidance and private appointments.
            </p>
            <a
              href={buildWhatsAppUrl({ type: 'SHOWROOM' })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-burgundy-900 text-gold-200 text-xs font-semibold"
            >
              <Phone className="w-4 h-4 text-gold-400" />
              Connect on WhatsApp
            </a>
          </div>
        )}
      </section>
    </div>
  );
};
