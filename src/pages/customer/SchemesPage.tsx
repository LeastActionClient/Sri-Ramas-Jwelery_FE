import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, ShieldCheck, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Page Header */}
      <ScrollReveal variant="fade-up" immediate>
        <div className="bg-brand-maroon-gradient text-gold-100 rounded-3xl p-8 sm:p-12 border border-gold-500/40 shadow-luxury text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-semibold uppercase tracking-widest border border-gold-400/30">
            <Award className="w-3.5 h-3.5" />
            <span>Jewellery Savings Programmes</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-gold-100">
            Sri Ramas Jewellery Savings Schemes
          </h1>
          <p className="text-xs sm:text-sm text-gold-200/85 max-w-2xl mx-auto font-light leading-relaxed">
            Plan gracefully for bridal milestones, family celebrations, and heirloom jewellery through our trusted showroom savings programmes.
          </p>
        </div>
      </ScrollReveal>

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
  );
};
