import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
import { schemesApi } from '@/services/api/schemes.api';
import { SchemeBannerCard } from '@/components/customer/SchemeBannerCard';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { ScrollReveal, AnimatedCTA } from '@/components/motion';

export const SchemesPage: React.FC = () => {
  const { buildWhatsAppUrl } = useStoreWhatsApp();

  const {
    data: schemes = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['schemes'],
    queryFn: schemesApi.getSchemes,
  });

  const activeSchemes = schemes
    .filter((s) => s.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div className="w-full min-h-screen">
      {/* 1. Full-Bleed Hero Section with Jewellery Image Background */}
      <section className="relative w-full overflow-hidden bg-[#1A0307] text-gold-100 py-16 sm:py-20 lg:py-24 border-b-2 border-gold-500/30">
        {/* Background South Indian Gold Jewellery Image */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src="/images/schemes-hero-bg.jpg"
            alt="Sri Ramas Jewellery Savings Schemes Ambiance"
            className="w-full h-full object-cover object-center scale-[1.02]"
          />
          {/* Deep Burgundy Contrast Vignette Scrim for Royal Contrast and 100% Readability */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(20, 2, 5, 0.82) 0%, rgba(36, 5, 11, 0.75) 45%, rgba(20, 2, 5, 0.90) 100%)',
            }}
          />
          {/* Subtle Ambient Gold Radiance in Top Center */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[22rem] rounded-full bg-[#C49A3A]/20 blur-3xl"
          />
        </div>

        {/* Hero Content (No Card, Full Hero Section, Badge Removed) */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-5">
          <ScrollReveal variant="fade-up" immediate>
            <h1
              className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-wide leading-tight"
              style={{
                textShadow:
                  '0 4px 20px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.85)',
              }}
            >
              Sri Ramas Jewellery Savings Schemes
            </h1>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={80}>
            <p
              className="text-xs sm:text-sm md:text-base lg:text-lg text-gold-100/90 max-w-2xl mx-auto font-light leading-relaxed"
              style={{
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
              }}
            >
              Plan gracefully for bridal milestones, family celebrations, and heirloom jewellery through our trusted showroom savings programmes.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. Main Schemes Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Scheme Banners Stack */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-64 sm:h-72 rounded-2xl bg-burgundy-900/15 border border-gold-300/40"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-gold-300 p-10 text-center space-y-3">
          <p className="font-serif text-lg font-bold text-burgundy-950">
            Unable to load savings schemes right now
          </p>
          <p className="text-xs text-stone-600">
            Please refresh to view our active showroom savings plans.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-burgundy-900 text-gold-200 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : activeSchemes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gold-300/60 p-10 text-center space-y-4">
          <Sparkles className="w-8 h-8 text-gold-600 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-burgundy-950">
            Savings Schemes Currently Updating
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            Our showroom team is updating active plan details. Speak directly with our specialists on WhatsApp for scheme brochures and showroom guidance.
          </p>
          <AnimatedCTA
            variant="whatsapp"
            href={buildWhatsAppUrl({ type: 'SCHEME' })}
            target="_blank"
            rel="noopener noreferrer"
            icon={<MessageCircle className="w-4 h-4" />}
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Enquire on WhatsApp
          </AnimatedCTA>
        </div>
      ) : (
        <div className="space-y-7 sm:space-y-9">
          {activeSchemes.map((scheme, idx) => (
            <ScrollReveal key={scheme._id} variant="fade-up" delay={idx * 60}>
              <SchemeBannerCard scheme={scheme} />
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Showroom Advisory Disclaimer */}
      <ScrollReveal variant="fade-up">
        <div className="bg-white rounded-2xl border border-gold-300/60 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gold-100 border border-gold-300 flex items-center justify-center shrink-0 text-burgundy-900">
              <ShieldCheck className="w-6 h-6 text-gold-700" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-burgundy-950">
                Dedicated In-Showroom Enrollment &amp; Guidance
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
                Online enrollment payments are never collected on this website. Visit any Sri Ramas Jewellery showroom or message our advisors on WhatsApp to review official scheme booklets, eligibility, and terms before joining.
              </p>
            </div>
          </div>

          <AnimatedCTA
            variant="whatsapp"
            href={buildWhatsAppUrl({ type: 'SCHEME' })}
            target="_blank"
            rel="noopener noreferrer"
            icon={<MessageCircle className="w-4 h-4" />}
            className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0"
          >
            Chat With Scheme Advisor
          </AnimatedCTA>
        </div>
      </ScrollReveal>
      </div>
    </div>
  );
};
