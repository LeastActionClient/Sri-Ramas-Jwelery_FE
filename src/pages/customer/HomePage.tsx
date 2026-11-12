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
  MessageSquare,
  Phone,
  RefreshCw,
  Building2,
  ExternalLink
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
import {
  AnimatedCTA,
  AnimatedHeading,
  ImageReveal,
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
}> = ({ store, isSingleLayout, whatsappHref }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const fullAddress = [
    store.addressLine1 || store.address,
    store.addressLine2,
    [store.city, store.state].filter(Boolean).join(', '),
    store.postalCode || store.pincode
  ]
    .filter(Boolean)
    .join(', ');

  const phones =
    store.phoneNumbers && store.phoneNumbers.length > 0
      ? store.phoneNumbers
      : store.phone
      ? [store.phone]
      : [];

  const showroomPhoto = store.imageUrl || store.images?.[0];
  const hasPhoto = Boolean(showroomPhoto) && !imgFailed;

  return (
    <ScrollReveal variant="fade-up" distance={22}>
      <article
        className={`group/showroom bg-gradient-to-br from-[#FCF7EC] via-[#FFFDF8] to-[#F7EBD2] rounded-2xl border border-[#C69B3D]/55 hover:border-[#C69B3D] shadow-luxury hover:shadow-[0_18px_40px_-12px_rgba(69,10,19,0.28)] transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden ${
          isSingleLayout ? 'grid grid-cols-1 md:grid-cols-12' : 'flex flex-col justify-between'
        }`}
      >
        {/* Optional Showroom Visual / Heritage Architectural Frame */}
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-[#4D0F18] via-[#35060E] to-[#1D0206] ${
            isSingleLayout ? 'md:col-span-5 min-h-[240px] md:min-h-full' : 'h-52'
          }`}
        >
          {/* Warm ambient golden radial lighting behind showroom visual */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#D4AF37]/15 blur-2xl group-hover/showroom:bg-[#D4AF37]/25 transition-colors duration-500"
          />

          {hasPhoto ? (
            <ImageReveal
              src={showroomPhoto}
              alt={store.name}
              loading="lazy"
              className="w-full h-full object-cover object-center transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/showroom:scale-[1.06]"
              onImageError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative transition-transform duration-[450ms] ease-out group-hover/showroom:scale-[1.02]">
              <div
                className="absolute inset-3 rounded-xl border border-[#D4AF37]/30 group-hover/showroom:border-[#E6C56F]/60 transition-colors duration-400 pointer-events-none"
                aria-hidden="true"
              />
              {/* Architectural archway flourish */}
              <svg
                viewBox="0 0 120 50"
                className="w-24 h-10 text-[#D4AF37]/45 mb-2 pointer-events-none"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 45 C12 22, 34 8, 60 8 C86 8, 108 22, 108 45"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="svg-line-draw svg-line-draw-active"
                />
                <circle cx="60" cy="8" r="2.5" fill="currentColor" />
              </svg>
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/45 group-hover/showroom:border-[#E6C56F]/75 group-hover/showroom:bg-[#D4AF37]/25 transition-all duration-400 flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-[#E6C56F]" />
              </div>
              <p className="font-serif text-xs uppercase tracking-[0.22em] text-[#E6C56F] font-semibold">
                {store.city || 'Sri Ramas Showroom'}
              </p>
              {store.branchCode && (
                <p className="text-[11px] text-[#E7D4AF]/75 mt-1 font-mono">
                  Branch Code: {store.branchCode}
                </p>
              )}
              <p className="text-[10.5px] text-[#E7D4AF]/65 mt-2 max-w-[190px]">
                Showroom interior photograph managed via Admin CMS
              </p>
            </div>
          )}

          {store.isFlagship && (
            <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-0.5 rounded bg-brand-gold-gradient text-burgundy-950 text-[10px] font-bold uppercase tracking-wider shadow z-10">
              Flagship Boutique
            </span>
          )}
        </div>

        {/* Showroom Details Body with Staggered Reveal */}
        <div
          className={`p-6 sm:p-7 flex flex-col justify-between gap-5 ${
            isSingleLayout ? 'md:col-span-7' : 'flex-1'
          }`}
        >
          <StaggerReveal staggerMs={65} className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                {store.city && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A7220]">
                    {[store.city, store.state].filter(Boolean).join(' • ')}
                  </span>
                )}
                <h3 className="font-serif font-bold text-xl text-[#450A13] group-hover/showroom:text-[#6B1220] transition-colors mt-0.5">
                  {store.name}
                </h3>
              </div>
            </div>

            <div className="text-xs sm:text-[13px] text-[#4A2E28] space-y-2.5 pt-1">
              {fullAddress && (
                <p className="flex items-start gap-2.5 leading-relaxed">
                  <MapPin className="w-4 h-4 text-[#A4792B] shrink-0 mt-0.5 transition-transform duration-300 group-hover/showroom:-translate-y-0.5" />
                  <span>{fullAddress}</span>
                </p>
              )}

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#A4792B] shrink-0 mt-0.5" />
                {phones.length > 0 ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {phones.map((num, idx) => (
                      <a
                        key={idx}
                        href={`tel:${num.replace(/\s+/g, '')}`}
                        className="font-medium text-[#450A13] hover:text-[#9A7220] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
                      >
                        {num}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#6E4F47] italic">Contact number awaits showroom update</span>
                )}
              </div>

              {store.openingHours && !store.openingHours.toLowerCase().includes('confirm') && (
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#A4792B] shrink-0 mt-0.5" />
                  <span>{store.openingHours}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#DFC389]/60 flex flex-wrap items-center justify-between gap-3">
              {store.googleMapsUrl ? (
                <AnimatedCTA
                  href={store.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  icon={<ExternalLink className="w-3.5 h-3.5 text-[#8A621C]" />}
                  className="px-4 py-2 rounded-lg text-xs"
                >
                  <span>Get Directions</span>
                </AnimatedCTA>
              ) : (
                <span />
              )}
              <AnimatedCTA
                variant="burgundy"
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-lg bg-[#450A13] hover:bg-[#5E111E] text-[#F8E2AF] text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#E6C56F]" />
                <span>Enquire on WhatsApp</span>
              </AnimatedCTA>
            </div>
          </StaggerReveal>
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
  });

  const activeCategories = useMemo(
    () => categories.filter((cat) => cat.isActive !== false),
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
    <div className="space-y-12 lg:space-y-16 pb-16">
      {/* 1. HERO SECTION: Full Ambient Background Video + Luxury Jewellery Showcase */}
      <section
        ref={heroContainerRef}
        id="hero-section"
        className="relative overflow-hidden bg-burgundy-950 text-gold-100 border-b-2 border-gold-600/40 min-h-screen lg:min-h-[92vh] xl:h-screen pt-24 pb-12 sm:pt-28 sm:pb-14 lg:pt-24 lg:pb-12 flex items-center w-full max-w-full"
      >
        <div className="hero-bg-layer absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="hero-bg-parallax w-full h-full">
            <video
              src={heroVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center scale-[1.22]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-burgundy-950/92 via-burgundy-950/60 to-burgundy-950/35" />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="flex items-center">
            {/* Hero Campaign Headline & Trust Actions */}
            <div className="max-w-2xl space-y-4 sm:space-y-5 text-center lg:text-left mx-auto lg:mx-0">
              <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burgundy-950/75 border border-gold-400/40 backdrop-blur-md shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                <span className="text-[10px] sm:text-[11px] font-serif uppercase tracking-[0.2em] text-gold-300 font-medium">
                  Heritage South Indian Jewellery • Estd. 1987
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-[52px] font-extrabold tracking-wide text-gold-100 leading-tight sm:leading-[1.16] drop-shadow-lg">
                <span className="block overflow-hidden">
                  <span className="hero-headline-line block">Purity in Every Grain.</span>
                </span>
                <span className="block overflow-hidden mt-0.5">
                  <span className="hero-headline-line block text-gold-gradient">
                    Elegance Across Generations.
                  </span>
                </span>
              </h1>

              <p className="hero-desc text-xs sm:text-sm lg:text-base text-gold-100/85 max-w-lg font-light leading-relaxed mx-auto lg:mx-0 drop-shadow-md">
                Welcome to Sri Ramas Jewellery. Celebrating 39 years of royal South Indian craftsmanship, BIS 916 Hallmarked bridal gold, exquisite temple jewellery, and certified diamonds.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1">
                <div className="hero-cta-item">
                  <AnimatedCTA
                    to="/products"
                    variant="gold"
                    icon={<ArrowRight className="w-4 h-4" />}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm uppercase tracking-wider shadow-lg"
                  >
                    <span>Explore Collections</span>
                  </AnimatedCTA>
                </div>
                <div className="hero-cta-item">
                  <AnimatedCTA
                    to="/stores"
                    variant="burgundy"
                    className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-burgundy-900/80 border border-gold-400/70 text-gold-100 hover:bg-burgundy-900 text-xs sm:text-sm backdrop-blur-md"
                  >
                    <MapPin className="w-4 h-4 text-gold-300" />
                    <span>Visit Our Showrooms</span>
                  </AnimatedCTA>
                </div>
                <div className="hero-cta-item">
                  <AnimatedCTA
                    href={buildWhatsAppUrl({ type: 'GENERAL' })}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="whatsapp"
                    className="px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm backdrop-blur-md"
                  >
                    <span>WhatsApp Advisor</span>
                  </AnimatedCTA>
                </div>
              </div>

              {/* Staggered Trust Indicators */}
              <div className="pt-3 sm:pt-4 border-t border-gold-400/20 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-[11px] sm:text-xs text-gold-200/90">
                <div className="hero-trust-item inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>BIS 916 HUID Hallmarked</span>
                </div>
                <div className="hero-trust-item inline-flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>39+ Years Craftsmanship</span>
                </div>
                <div className="hero-trust-item inline-flex items-center gap-1.5">
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

      {/* 3. PROMOTIONAL SILVER & HERITAGE CAMPAIGN CAROUSEL (CMS Driven) */}
      <PromotionalBannerCarousel
        banners={promotionalBanners}
        isLoading={bannersLoading}
      />

      {/* 4. JEWELLERY CATEGORIES SECTION */}
      <div className="bg-[#FDFBF5] border-y border-[#E9D7B7]/60">
        <CategoryCarousel
          categories={categories}
          isLoading={categoriesLoading}
          isError={categoriesError}
          onRetry={() => refetchCategories()}
        />
      </div>

      {/* 4. FEATURED BRIDAL & HEIRLOOM PIECES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
            className={`grid gap-6 ${
              visibleFeaturedProducts.length <= 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                : visibleFeaturedProducts.length === 3
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
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
      </section>

      {/* 5. SAVINGS SCHEME & DIGIGOLD VALUE SECTION */}
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
                          to={`/schemes/${scheme.slug}`}
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
                  variant="outline"
                  href={buildWhatsAppUrl({
                    type: 'SCHEME',
                    schemeName: primaryScheme?.name,
                    customMessage: primaryScheme?.whatsappMessage,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-lg border-[#D4AF37]/80 text-[#FCE9BE] hover:bg-[#D4AF37]/15 hover:border-[#F6DA8D] hover:text-[#FFF6DC] font-medium text-xs"
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

      {/* 6. SHOWROOM LOCATIONS & APPOINTMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <AnimatedHeading
          kicker="Personal Showroom Hospitality"
          title="Visit Our Showrooms"
          subtitle="Step into an ambience of heritage luxury. Experience our collections with dedicated personal jewellery specialists."
          align="center"
          showRule
          className="max-w-2xl mx-auto"
          titleClassName="text-3xl font-bold text-burgundy-950"
          kickerClassName="text-gold-700 tracking-widest"
        />

        {storesLoading ? (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 border border-[#DEC48C] animate-pulse space-y-4">
            <div className="h-6 bg-stone-200 rounded w-1/3" />
            <div className="h-4 bg-stone-200 rounded w-2/3" />
            <div className="h-4 bg-stone-200 rounded w-1/2" />
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
                ? 'max-w-4xl mx-auto'
                : stores.length === 2
                ? 'grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-6'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
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
