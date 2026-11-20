import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Coins,
  Gem,
  Heart,
  MessageCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { schemesApi } from '@/services/api/schemes.api';
import { SchemeCard } from '@/components/customer/SchemeCard';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { ScrollReveal } from '@/components/motion';
import { SchemePlan } from '@/types';
import { SEO } from '@/components/common/SEO';

export const SchemesPage: React.FC = () => {
  const { buildWhatsAppUrl } = useStoreWhatsApp();

  const {
    data: fetchedSchemes = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['schemes'],
    queryFn: schemesApi.getSchemes,
  });

  // Filter active schemes and sort according to admin displayOrder
  const displaySchemes = (fetchedSchemes || [])
    .filter((s) => s.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const whatsappGeneralUrl = buildWhatsAppUrl({ type: 'SCHEME' });

  return (
    <div className="w-full min-h-screen bg-[#FAF6F0] text-stone-900 selection:bg-gold-200 selection:text-burgundy-950">
      <SEO
        title="Jewellery Savings Schemes | Sri Ramas Jewellery"
        description="Plan your gold and silver acquisitions with flexible jewellery savings schemes at Sri Ramas Jewellery Thanjavur."
        canonical="https://sriramasjewellery.com/schemes"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Savings Schemes', path: '/schemes' }
        ]}
      />

      {/* 1. Full-Bleed Hero Section matching reference screenshot with balanced height */}
      <section className="relative w-full bg-[#240308] text-gold-100 min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] pt-10 pb-12 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-18 flex flex-col justify-center border-b border-gold-500/30">
        {/* Background South Indian Gold Jewellery Hero Image (2nd Image provided by user) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src="/images/schemes-hero-bg.jpg"
            alt="Sri Ramas Jewellery Savings Schemes Hero Background"
            className="w-full h-full object-cover object-center scale-[1.01]"
          />
          {/* Luxury wine vignette and gradient overlay to ensure crystal clear typography while preserving the gorgeous necklace */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#1A0307]/80 via-[#1A0307]/50 to-[#1A0307]/85"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(26, 3, 8, 0.45) 0%, rgba(20, 2, 5, 0.15) 70%, transparent 100%)',
            }}
          />
        </div>

        {/* Hero Content matching exact reference typography and alignment */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2 sm:space-y-3">
          <ScrollReveal variant="fade-up" immediate>
            {/* Gold Lotus Emblem with clean vector paths */}
            <div className="flex justify-center mb-1">
              <svg
                className="w-11 h-7 text-[#E0B250] drop-shadow-md select-none"
                viewBox="0 0 50 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="srjLotusGold" x1="25" y1="2" x2="25" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F8DE97" />
                    <stop offset="45%" stopColor="#E5BD58" />
                    <stop offset="100%" stopColor="#C4962C" />
                  </linearGradient>
                </defs>
                {/* Central petal */}
                <path
                  d="M25 3C23.5 8 20.8 13.5 19 16.5C21.8 18 23.8 21.5 25 24.5C26.2 21.5 28.2 18 31 16.5C29.2 13.5 26.5 8 25 3Z"
                  fill="url(#srjLotusGold)"
                />
                {/* Inner left petal */}
                <path
                  d="M19 16.5C15 17.5 12 21 11 24C14.5 25 18 23 19.8 19.5C19.3 18.5 19.1 17.5 19 16.5Z"
                  fill="url(#srjLotusGold)"
                  opacity="0.95"
                />
                {/* Inner right petal */}
                <path
                  d="M31 16.5C35 17.5 38 21 39 24C35.5 25 32 23 30.2 19.5C30.7 18.5 30.9 17.5 31 16.5Z"
                  fill="url(#srjLotusGold)"
                  opacity="0.95"
                />
                {/* Outer left petal */}
                <path
                  d="M13 21C8.5 22.5 5.5 25.5 4 28.5C8 29.5 12 28 14 25C13.5 23.5 13.2 22.2 13 21Z"
                  fill="url(#srjLotusGold)"
                  opacity="0.85"
                />
                {/* Outer right petal */}
                <path
                  d="M37 21C41.5 22.5 44.5 25.5 46 28.5C42 29.5 38 28 36 25C36.5 23.5 36.8 22.2 37 21Z"
                  fill="url(#srjLotusGold)"
                  opacity="0.85"
                />
                {/* Base petals */}
                <path
                  d="M16 25C20 28 23 29 25 29C27 29 30 28 34 25C32 29 28 30.5 25 30.5C22 30.5 18 29 16 25Z"
                  fill="url(#srjLotusGold)"
                />
              </svg>
            </div>

            {/* Accent lines with SRI RAMAS JEWELLERY */}
            <div className="flex items-center justify-center gap-2.5 text-[11px] sm:text-xs tracking-[0.25em] text-[#E0B250] font-serif uppercase font-semibold">
              <span className="w-8 sm:w-14 h-[1px] bg-[#E0B250]/70"></span>
              <span>SRI RAMAS JEWELLERY</span>
              <span className="w-8 sm:w-14 h-[1px] bg-[#E0B250]/70"></span>
            </div>

            {/* Main Heading */}
            <h1
              className="font-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-wide leading-[1.1] uppercase drop-shadow-xl mt-1.5"
              style={{
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.85)',
              }}
            >
              SRI RAMAS JEWELLERY<br className="hidden sm:inline" /> SAVINGS SCHEMES
            </h1>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={50}>
            <p
              className="text-xs sm:text-sm md:text-[15px] text-[#F5DFC0] max-w-2xl mx-auto font-light leading-relaxed"
              style={{
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
              }}
            >
              Plan gracefully for bridal milestones, family celebrations, and heirloom jewellery through our trusted showroom savings programmes.
            </p>
            {/* Small Diamond Accent */}
            <div className="text-[#E0B250] text-[11px] mt-1 select-none">◆</div>
          </ScrollReveal>
        </div>
      </section>

      {/* Floating Benefits Strip: Positioned in the middle straddling the boundary, slightly enlarged */}
      <div className="relative z-20 max-w-[1100px] mx-auto px-3 sm:px-6 -mt-7 sm:-mt-8 md:-mt-9">
        <ScrollReveal variant="fade-up" delay={80}>
          <div className="rounded-2xl bg-[#240309] md:bg-[#28040C]/95 md:backdrop-blur-md border border-[#D4AF37]/50 shadow-[0_12px_36px_rgba(0,0,0,0.48)] py-3 sm:py-3.5 px-3 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:divide-x md:divide-[#D4AF37]/25 items-center text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 py-1.5 px-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E0B250]/15 border border-[#E0B250]/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFE082] stroke-2" />
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-white/95 leading-tight">
                  Trusted Since 1947
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 py-1.5 px-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E0B250]/15 border border-[#E0B250]/30 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFE082] stroke-2" />
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-white/95 leading-tight">
                  Save Systematically
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 py-1.5 px-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E0B250]/15 border border-[#E0B250]/30 flex items-center justify-center shrink-0">
                  <Gem className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFE082] stroke-2" />
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-white/95 leading-tight">
                  Get More Value
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 py-1.5 px-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E0B250]/15 border border-[#E0B250]/30 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFE082] stroke-2" />
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-white/95 leading-tight">
                  Ideal for Weddings &amp; Occasions
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* 2. Main Schemes Section */}
      <section className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12">
        {/* Section Heading & Decorative Separator */}
        <div className="text-center space-y-1.5 mb-6 sm:mb-8">
          <ScrollReveal variant="fade-up">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-[34px] font-bold text-[#3B060F]">
              Our Savings Schemes
            </h2>
            <div className="flex items-center justify-center gap-3 my-2">
              <span className="w-16 sm:w-24 h-[1px] bg-gradient-to-r from-transparent to-[#C59B3C]"></span>
              <span className="text-[#C59B3C] text-xs select-none">◆</span>
              <span className="w-16 sm:w-24 h-[1px] bg-gradient-to-l from-transparent to-[#C59B3C]"></span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto font-normal">
              Choose a scheme that suits your goal and make your jewellery dreams a reality.
            </p>
          </ScrollReveal>
        </div>

        {/* Dynamic Schemes List: Expanded width & Uniform same-size layout with side scroll animations */}
        {isLoading ? (
          <div className="flex flex-col space-y-8 sm:space-y-10 w-full max-w-[1360px] mx-auto">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-[320px] sm:h-[350px] rounded-3xl bg-[#FAF3E5] border border-[#E5D2B8] animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-white rounded-2xl border border-gold-300 p-10 text-center space-y-3 max-w-lg mx-auto shadow-sm">
            <p className="font-serif text-lg font-bold text-burgundy-950">
              Unable to load savings schemes right now
            </p>
            <p className="text-xs text-stone-600">
              Please refresh to view our active showroom savings plans.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#460813] text-gold-200 text-xs font-semibold hover:bg-[#600C1B] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : displaySchemes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gold-300 p-10 text-center space-y-3 max-w-lg mx-auto shadow-sm">
            <p className="font-serif text-lg font-bold text-burgundy-950">
              Our Savings Schemes Are Coming Soon
            </p>
            <p className="text-xs text-stone-600">
              New showroom savings programmes are being curated. Connect with our showroom team on WhatsApp for current plans.
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-8 sm:space-y-10 w-full max-w-[1360px] mx-auto overflow-hidden px-1">
            {displaySchemes.map((scheme, idx) => {
              const isReversed = idx % 2 === 1;
              const sideVariant = isReversed ? 'slide-left' : 'slide-right';
              return (
                <ScrollReveal
                  key={scheme._id}
                  variant={sideVariant}
                  distance={50}
                  threshold={0.12}
                  delay={40}
                >
                  <SchemeCard
                    scheme={scheme}
                    isFirst={idx === 0}
                    isReversed={isReversed}
                  />
                </ScrollReveal>
              );
            })}
          </div>
        )}

        {/* 3. Bottom Promotional CTA Ribbon Banner */}
        <ScrollReveal variant="fade-up" delay={150}>
          <div className="mt-12 sm:mt-16 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#38050D] via-[#520916] to-[#38050D] border border-[#D4AF37]/50 p-5 sm:p-7 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: 3D Gift Box Graphic */}
            <div className="shrink-0 flex items-center justify-center">
              <img
                src="/images/schemes/gift-box-cta.png"
                alt="Savings Scheme Gift Box"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            {/* Center: Title & Subtitle */}
            <div className="flex-1 text-center md:text-left space-y-1">
              <h3 className="font-serif text-xl sm:text-2xl lg:text-[26px] font-bold text-white tracking-wide">
                Start Your Savings Journey Today!
              </h3>
              <p className="text-xs sm:text-sm text-[#F5E2C5] font-light">
                Visit our showroom or contact us to enrol in your preferred scheme.
              </p>
            </div>

            {/* Right: Enquire on WhatsApp Gold Pill Button */}
            <div className="shrink-0">
              <a
                href={whatsappGeneralUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-gradient-to-r from-[#F4D98C] via-[#E5BC58] to-[#CAA034] text-burgundy-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-luxury-gold hover:brightness-105 active:scale-95 transition-all whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Enquire on WhatsApp</span>
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};
